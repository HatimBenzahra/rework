/**
 * @fileoverview Global API Cache System - OPTIMIZED
 * Provides intelligent caching for all API calls with automatic invalidation
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  accessCount: number // NEW: Pour LRU amélioré
}

interface CacheConfig {
  defaultTTL: number
  maxSize: number
  enableDebug?: boolean
  persistToStorage?: boolean // NEW: Option pour désactiver sessionStorage
}

interface CacheStats {
  size: number
  maxSize: number
  hits: number
  misses: number
  hitRate: number
  keys: string[]
}

/**
 * Check if we're in a browser environment (not SSR)
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined'
}

/**
 * Circular-safe stable stringify with WeakSet
 */
function stableStringifySafe(v: any, seen = new WeakSet()): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v)
  if (seen.has(v)) return '"[Circular]"'
  seen.add(v)

  if (Array.isArray(v)) {
    return `[${v.map(x => stableStringifySafe(x, seen)).join(',')}]`
  }

  const keys = Object.keys(v).sort()
  return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringifySafe(v[k], seen)}`).join(',')}}`
}

/**
 * Create a stable hash from dependencies (circular-safe)
 */
function hashDependencies(deps: any[]): string {
  if (!deps?.length) return ''

  const s = stableStringifySafe(deps)
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36)
}

/**
 * TTL configuration by namespace - FIXED VALUES
 */
const TTL_BY_NAMESPACE: Record<string, number> = {
  statistics: 30_000, // 30s - données volatiles
  zones: 10 * 60_000, // 10min - données semi-statiques
  directeurs: 5 * 60_000, // 5min - default
  managers: 5 * 60_000, // 5min - default
  commercials: 3 * 60_000, // 3min - plus volatile
  immeubles: 10 * 60_000, // 10min - données statiques
  portes: 60_000, // 1min - données plus volatiles
  'mapbox-geocode': 30 * 24 * 60 * 60_000, // 30 jours - géolocalisation très stable
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>()
  private inflight = new Map<string, Promise<any>>()
  private config: CacheConfig
  private storageKey = 'api-cache-v4' // Changed version
  private saveScheduled = false
  private saveDebounceTimer: number | null = null
  private hits = 0
  private misses = 0
  private currentUserId: string | null = null
  private broadcastChannel: BroadcastChannel | null = null // REUSE channel

  constructor(
    config: CacheConfig = {
      defaultTTL: 5 * 60 * 1000,
      maxSize: 500, // Increased from 200
      persistToStorage: true,
    }
  ) {
    this.config = config
    if (isBrowser()) {
      if (this.config.persistToStorage) {
        this.loadFromSessionStorage()
      }
      this.setupMultiTabSync()

      // Cleanup expired entries every 5 minutes
      setInterval(() => this.cleanupExpired(), 5 * 60_000)
    }
  }

  /**
   * Clean up expired entries proactively
   */
  private cleanupExpired(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp >= entry.ttl) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.cache.delete(key))

    if (keysToDelete.length > 0) {
      this.debugLog('Cleaned up expired entries:', keysToDelete.length)
      this.scheduleSave()
    }
  }

  /**
   * Set current user ID for scoping
   */
  setUserId(userId: string | null): void {
    if (this.currentUserId !== userId) {
      this.currentUserId = userId
      // Clear cache when user changes
      this.clear()
    }
  }

  /**
   * Multi-tab synchronization with BroadcastChannel - FIXED
   */
  private setupMultiTabSync(): void {
    if (!isBrowser() || !('BroadcastChannel' in window)) return

    try {
      this.broadcastChannel = new BroadcastChannel('api-cache-sync')
      this.broadcastChannel.addEventListener('message', event => {
        if (event.data.type === 'cache-invalidate') {
          const { namespace, key } = event.data
          if (namespace) {
            this.invalidateNamespace(namespace, false) // Don't broadcast back
          } else if (key) {
            this.invalidateKey(key, false)
          }
        }
      })
    } catch (e) {
      console.warn('BroadcastChannel not available, multi-tab sync disabled')
    }
  }

  /**
   * Broadcast cache invalidation to other tabs - FIXED
   */
  private broadcast(type: string, data: any): void {
    if (!this.broadcastChannel) return

    try {
      this.broadcastChannel.postMessage({ type, ...data })
    } catch (e) {
      // Ignore broadcast errors
    }
  }

  /**
   * Load cache from sessionStorage on initialization
   */
  private loadFromSessionStorage(): void {
    if (!isBrowser() || !this.config.persistToStorage) return

    try {
      const stored = sessionStorage.getItem(this.storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        for (const [key, entry] of Object.entries(parsed)) {
          const cacheEntry = entry as CacheEntry<any>
          if (this.isValid(cacheEntry)) {
            this.cache.set(key, cacheEntry)
          }
        }
        this.debugLog('Loaded cache from storage:', this.cache.size, 'entries')
      }
    } catch (error) {
      this.debugLog('Failed to load cache from sessionStorage:', error)
      // Clear corrupted storage
      try {
        sessionStorage.removeItem(this.storageKey)
      } catch {}
    }
  }

  /**
   * Debounced save to sessionStorage - OPTIMIZED
   */
  private scheduleSave(): void {
    if (!this.config.persistToStorage) return

    if (this.saveDebounceTimer !== null) {
      clearTimeout(this.saveDebounceTimer)
    }

    this.saveDebounceTimer = window.setTimeout(() => {
      this.saveToSessionStorage()
      this.saveDebounceTimer = null
    }, 1000) // Debounce 1 second
  }

  /**
   * Save cache to sessionStorage with quota handling - OPTIMIZED
   */
  private saveToSessionStorage(): void {
    if (!isBrowser() || !this.config.persistToStorage) return

    try {
      // Only save entries that are still valid
      const now = Date.now()
      const validEntries = Array.from(this.cache.entries())
        .filter(([_, entry]) => now - entry.timestamp < entry.ttl)
        .reduce(
          (obj, [key, entry]) => {
            obj[key] = entry
            return obj
          },
          {} as Record<string, CacheEntry<any>>
        )

      sessionStorage.setItem(this.storageKey, JSON.stringify(validEntries))
    } catch (error: any) {
      // Quota exceeded - clear old cache and try again with smaller dataset
      if (error?.name === 'QuotaExceededError') {
        this.debugLog('Quota exceeded, clearing storage and using memory-only')
        try {
          sessionStorage.removeItem(this.storageKey)
          this.config.persistToStorage = false // Disable persistence
        } catch {}
      }
    }
  }

  /**
   * Generate cache key with user scoping
   */
  private generateKey(apiCall: Function, dependencies: any[] = [], namespace?: string): string {
    const functionName = apiCall.name || 'anonymous'
    const depsHash = hashDependencies(dependencies)
    const baseKey = depsHash ? `${functionName}:${depsHash}` : functionName

    const userScope = this.currentUserId ? `user_${this.currentUserId}` : 'anonymous'
    const fullNamespace = namespace ? `${namespace}:${userScope}` : `global:${userScope}`

    return `${fullNamespace}/${baseKey}`
  }

  /**
   * Get TTL for namespace
   */
  private getTTLForNamespace(namespace?: string): number {
    if (!namespace) return this.config.defaultTTL

    const baseNamespace = namespace.split(':')[0] // Remove user scope
    return TTL_BY_NAMESPACE[baseNamespace] || this.config.defaultTTL
  }

  /**
   * Check if cache entry is still valid
   */
  private isValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl
  }

  /**
   * Implement LRU: move accessed item to end (most recent) + track access count
   */
  private markAsRecent(key: string): void {
    const entry = this.cache.get(key)
    if (entry) {
      entry.accessCount++
      this.cache.delete(key)
      this.cache.set(key, entry)
    }
  }

  /**
   * Debug logging
   */
  private debugLog(...args: any[]): void {
    if (this.config.enableDebug) {
      console.log('[APICache]', ...args)
    }
  }

  /**
   * In-flight deduplication - fetch with cache
   */
  async fetchWithCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key)
    if (cached !== null) {
      this.debugLog('✅ Cache hit:', key)
      return cached
    }

    // Check if request is already in-flight
    if (this.inflight.has(key)) {
      this.debugLog('🔄 In-flight hit:', key)
      return this.inflight.get(key) as Promise<T>
    }

    // Start new request
    this.debugLog('❌ Cache miss, fetching:', key)
    const promise = fetcher()
      .then(result => {
        this.set(key, result)
        this.inflight.delete(key)
        return result
      })
      .catch(error => {
        this.inflight.delete(key)
        throw error
      })

    this.inflight.set(key, promise)
    return promise
  }

  /**
   * Get data from cache if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) {
      this.misses++
      return null
    }

    if (this.isValid(entry)) {
      this.hits++
      // LRU: mark as recently used
      this.markAsRecent(key)
      return entry.data
    }

    // Remove expired entry
    this.cache.delete(key)
    this.misses++
    return null
  }

  /**
   * Store data in cache
   */
  set<T>(key: string, data: T, customTTL?: number): void {
    // LRU eviction: remove least accessed entries if cache is full
    while (this.cache.size >= this.config.maxSize) {
      // Find entry with lowest access count
      let minAccessCount = Infinity
      let oldestKey: string | null = null

      for (const [k, entry] of this.cache.entries()) {
        if (entry.accessCount < minAccessCount) {
          minAccessCount = entry.accessCount
          oldestKey = k
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey)
      } else {
        // Fallback to simple oldest (first in map)
        const firstKey = this.cache.keys().next().value
        this.cache.delete(firstKey)
      }
    }

    // Determine TTL
    const namespace = key.split('/')[0]
    const ttl = customTTL || this.getTTLForNamespace(namespace)

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
    })

    this.debugLog('💾 Cache set:', key, 'TTL:', `${Math.round(ttl / 1000)}s`)
    this.scheduleSave()
  }

  /**
   * Invalidate single key
   */
  invalidateKey(key: string, broadcast = true): void {
    const deleted = this.cache.delete(key)

    if (deleted) {
      this.scheduleSave()

      if (broadcast) {
        this.broadcast('cache-invalidate', { key })
      }

      this.debugLog('🗑️ Invalidated key:', key)
    }
  }

  /**
   * Invalidate cache entries by namespace (strict prefix matching)
   */
  invalidateNamespace(namespace: string, broadcast = true): void {
    const prefix = `${namespace}:`
    const keysToDelete: string[] = []

    this.cache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.cache.delete(key))

    if (keysToDelete.length > 0) {
      this.scheduleSave()

      if (broadcast) {
        this.broadcast('cache-invalidate', { namespace })
      }

      this.debugLog('🗑️ Invalidated namespace:', namespace, 'Keys:', keysToDelete.length)
    }
  }

  /**
   * Invalidate where predicate matches
   */
  invalidateWhere(predicate: (key: string) => boolean): void {
    const keysToDelete: string[] = []

    this.cache.forEach((_, key) => {
      if (predicate(key)) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.cache.delete(key))

    if (keysToDelete.length > 0) {
      this.scheduleSave()
      this.debugLog('🗑️ Invalidated by predicate:', keysToDelete.length, 'keys')
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    this.inflight.clear()
    this.hits = 0
    this.misses = 0

    if (isBrowser() && this.config.persistToStorage) {
      try {
        sessionStorage.removeItem(this.storageKey)
      } catch (e) {
        // Ignore storage errors
      }
    }

    this.debugLog('🧹 Cache cleared')
  }

  /**
   * Get cache key for specific API call with namespace
   */
  getKey(apiCall: Function, dependencies: any[] = [], namespace?: string): string {
    return this.generateKey(apiCall, dependencies, namespace)
  }

  /**
   * Get cache stats for debugging
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? Math.round((this.hits / total) * 100) / 100 : 0,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
      this.broadcastChannel = null
    }

    if (this.saveDebounceTimer !== null) {
      clearTimeout(this.saveDebounceTimer)
      this.saveDebounceTimer = null
    }

    this.clear()
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugEnabled(): boolean {
    return this.config.enableDebug || false
  }
}

// Global cache instance
export const apiCache = new APICache({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 500, // Increased
  enableDebug: import.meta.env.DEV, // Use Vite env
  persistToStorage: true,
})

// Clean up on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    apiCache.destroy()
  })
}

/**
 * Cache invalidation mappings - OPTIMIZED
 * When an entity is modified, invalidate related caches by namespace
 */
export const CACHE_INVALIDATION_MAP: Record<string, string[]> = {
  directeurs: ['directeurs', 'managers'],
  managers: ['managers', 'commercials'],
  commercials: ['commercials', 'zones', 'immeubles', 'statistics'],
  zones: ['zones', 'allcurrentassignations', 'zonehistory', 'statistics'],
  immeubles: ['immeubles', 'portes', 'statistics'],
  portes: ['portes', 'immeubles', 'statistics'],
  statistics: ['statistics'],
}

/**
 * Invalidate related caches when an entity is modified
 */
export function invalidateRelatedCaches(entityType: string): void {
  const toInvalidate = CACHE_INVALIDATION_MAP[entityType] || [entityType]

  toInvalidate.forEach(namespace => {
    apiCache.invalidateNamespace(namespace)
  })

  if (apiCache.isDebugEnabled()) {
    console.log(`🔄 Invalidated caches for: ${entityType} → [${toInvalidate.join(', ')}]`)
  }
}

/**
 * Set current user for cache scoping
 */
export function setCacheUser(userId: string | null): void {
  apiCache.setUserId(userId)
}

export default apiCache
