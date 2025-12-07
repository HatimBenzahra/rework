export interface OfflineAction<T = any> {
  id: string
  type: string
  payload: T
  timestamp: number
  retryCount: number
}

class OfflineQueueService {
  private queue: OfflineAction[] = []
  private storageKey = 'offline_mutation_queue'

  constructor() {
    this.loadQueue()
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        this.queue = JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load offline queue', e)
      this.queue = []
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue))
    } catch (e) {
      console.error('Failed to save offline queue', e)
    }
  }

  enqueue(type: string, payload: any) {
    const action: OfflineAction = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0
    }
    this.queue.push(action)
    this.saveQueue()
    console.log('[OfflineQueue] Enqueued action:', action)
  }

  dequeue(): OfflineAction | undefined {
    const action = this.queue.shift()
    this.saveQueue()
    return action
  }

  peek(): OfflineAction | undefined {
    return this.queue[0]
  }

  isEmpty(): boolean {
    return this.queue.length === 0
  }

  getQueue(): OfflineAction[] {
    return this.queue
  }

  clear() {
    this.queue = []
    this.saveQueue()
  }

  remove(id: string) {
    this.queue = this.queue.filter(a => a.id !== id)
    this.saveQueue()
  }
}

export const offlineQueue = new OfflineQueueService()
