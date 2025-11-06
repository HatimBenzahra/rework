/**
 * @fileoverview Global API Cache System - Production Ready
 * Provides intelligent caching for all API calls with automatic invalidation
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface CacheConfig {
  defaultTTL: number // Time to live in milliseconds
  maxSize: number
  enableDebug?: boolean
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
 * TTL configuration by namespace
 */
const TTL_BY_NAMESPACE: Record<string, number> = {
  statistics: 10_000, // 30s - données volatiles
  zones: 10_000, // 10min - données semi-statiques
  directeurs: 10_000, // 5min - default
  managers: 10_000, // 5min - default
  commercials: 10_000, // 3min - plus volatile
  immeubles: 10_000, // 10min - données statiques
  portes: 10_000, // 10s - données volatiles (changent souvent)
  'mapbox-geocode': 30 * 24 * 60 * 60_000, // 30 jours - géolocalisation très stable
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>()
  private inflight = new Map<string, Promise<any>>()
  private config: CacheConfig
  private storageKey = 'api-cache-v3'
  private saveScheduled = false
  private hits = 0
  private misses = 0
  private currentUserId: string | null = null

  constructor(config: CacheConfig = { defaultTTL: 5 * 60 * 1000, maxSize: 200 }) {
    this.config = config
    if (isBrowser()) {
      this.loadFromSessionStorage()
      this.setupMultiTabSync()
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
   * Multi-tab synchronization with BroadcastChannel
   */
  private setupMultiTabSync(): void {
    if (!isBrowser() || !('BroadcastChannel' in window)) return

    try {
      const channel = new BroadcastChannel('api-cache-sync')
      channel.addEventListener('message', event => {
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
   * Broadcast cache invalidation to other tabs
   */
  private broadcast(type: string, data: any): void {
    if (!isBrowser() || !('BroadcastChannel' in window)) return

    try {
      const channel = new BroadcastChannel('api-cache-sync')
      channel.postMessage({ type, ...data })
    } catch (e) {
      // Ignore broadcast errors
    }
  }

  /**
   * Load cache from sessionStorage on initialization
   */
  private loadFromSessionStorage(): void {
    if (!isBrowser()) return

    try {
      const stored = sessionStorage.getItem(this.storageKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        for (const [key, entry] of Object.entries(parsed)) {
          if (this.isValid(entry as CacheEntry<any>)) {
            this.cache.set(key, entry as CacheEntry<any>)
          }
        }
      }
    } catch (error) {
      this.debugLog('Failed to load cache from sessionStorage:', error)
    }
  }

  /**
   * Throttled save to sessionStorage
   */
  private scheduleSave(): void {
    if (this.saveScheduled) return
    this.saveScheduled = true

    setTimeout(() => {
      this.saveToSessionStorage()
      this.saveScheduled = false
    }, 0)
  }

  /**
   * Save cache to sessionStorage with quota handling
   */
  private saveToSessionStorage(): void {
    if (!isBrowser()) return

    try {
      const cacheObject = Object.fromEntries(this.cache.entries())
      sessionStorage.setItem(this.storageKey, JSON.stringify(cacheObject))
    } catch (error) {
      this.debugLog('Quota exceeded, using memory-only cache:', error)
      // Continue with memory-only cache
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
   * Implement LRU: move accessed item to end (most recent)
   */
  private markAsRecent(key: string): void {
    const entry = this.cache.get(key)
    if (entry) {
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
      this.debugLog('Cache hit:', key)
      return cached
    }

    // Check if request is already in-flight
    if (this.inflight.has(key)) {
      this.debugLog('In-flight hit:', key)
      return this.inflight.get(key) as Promise<T>
    }

    // Start new request
    this.debugLog('Cache miss, fetching:', key)
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

    // Remove expired entry and save
    this.cache.delete(key)
    this.scheduleSave()
    this.misses++
    return null
  }

  /**
   * Store data in cache
   */
  set<T>(key: string, data: T, customTTL?: number): void {
    // LRU eviction: remove oldest entries if cache is full
    while (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    // Determine TTL
    const namespace = key.split('/')[0]
    const ttl = customTTL || this.getTTLForNamespace(namespace)

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })

    this.debugLog('Cache set:', key, 'TTL:', ttl)
    this.scheduleSave()
  }

  /**
   * Invalidate single key
   */
  invalidateKey(key: string, broadcast = true): void {
    this.cache.delete(key)
    this.scheduleSave()

    if (broadcast) {
      this.broadcast('cache-invalidate', { key })
    }

    this.debugLog('Invalidated key:', key)
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
    this.scheduleSave()

    if (broadcast) {
      this.broadcast('cache-invalidate', { namespace })
    }

    this.debugLog('Invalidated namespace:', namespace, 'Keys:', keysToDelete.length)
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
    this.scheduleSave()

    this.debugLog('Invalidated by predicate:', keysToDelete.length, 'keys')
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    this.inflight.clear()
    this.hits = 0
    this.misses = 0

    if (isBrowser()) {
      try {
        sessionStorage.removeItem(this.storageKey)
      } catch (e) {
        // Ignore storage errors
      }
    }

    this.debugLog('Cache cleared')
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
      hitRate: total > 0 ? this.hits / total : 0,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Global cache instance
export const apiCache = new APICache({
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 200,
  enableDebug: process.env.NODE_ENV === 'development',
})

/**
 * Cache invalidation mappings
 * When an entity is modified, invalidate related caches by namespace
 */
export const CACHE_INVALIDATION_MAP: Record<string, string[]> = {
  // When directeurs change, invalidate managers cache (they have directeurId)
  directeurs: ['directeurs', 'managers'],
  // When managers change, invalidate commercials cache
  managers: ['managers', 'commercials'],
  // When commercials change, invalidate zones and immeubles
  commercials: ['commercials', 'zones', 'immeubles', 'portes'],
  // Zones and immeubles are independent
  zones: ['zones', 'allcurrentassignations', 'zonehistory'],
  // When immeubles change, invalidate portes cache (portes belong to immeubles)
  immeubles: ['immeubles', 'portes'],
  // When portes change, invalidate portes and immeubles cache (stats impact)
  portes: ['portes', 'immeubles', 'statistics', 'commercials'],
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
}

/**
 * Set current user for cache scoping
 */
export function setCacheUser(userId: string | null): void {
  apiCache.setUserId(userId)
}

export default apiCache
