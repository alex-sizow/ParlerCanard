import { useTelegram } from './useTelegram'
import type { TelegramCloudStorage } from './useTelegram'

const MAX_VALUE_SIZE = 4096
/** Reserve some bytes for sharding meta overhead */
const CHUNK_SIZE = 3900

/* ---------- promise wrappers over callback API ---------- */

function csGetItem (cs: TelegramCloudStorage, key: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cs.getItem(key, (err, val) => (err ? reject(new Error(err)) : resolve(val ?? '')))
  })
}

function csGetItems (cs: TelegramCloudStorage, keys: string[]): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    cs.getItems(keys, (err, val) => (err ? reject(new Error(err)) : resolve(val ?? {})))
  })
}

function csSetItem (cs: TelegramCloudStorage, key: string, value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cs.setItem(key, value, (err) => (err ? reject(new Error(err)) : resolve()))
  })
}

function csRemoveItem (cs: TelegramCloudStorage, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cs.removeItem(key, (err) => (err ? reject(new Error(err)) : resolve()))
  })
}

function csRemoveItems (cs: TelegramCloudStorage, keys: string[]): Promise<void> {
  if (keys.length === 0) return Promise.resolve()
  return new Promise((resolve, reject) => {
    cs.removeItems(keys, (err) => (err ? reject(new Error(err)) : resolve()))
  })
}

function csGetKeys (cs: TelegramCloudStorage): Promise<string[]> {
  return new Promise((resolve, reject) => {
    cs.getKeys((err, val) => (err ? reject(new Error(err)) : resolve(val ?? [])))
  })
}

/* ---------- sharding helpers ---------- */

function metaKey (key: string) { return `${key}__meta` }
function chunkKey (key: string, i: number) { return `${key}__${i}` }

/* ---------- public API ---------- */

export function useCloudStorage () {
  const { cloudStorage } = useTelegram()

  function getCS (): TelegramCloudStorage | null {
    return cloudStorage.value
  }

  /**
   * Read a value from CloudStorage.
   * Automatically reassembles sharded data if a meta-key exists.
   */
  async function cloudGet<T = unknown> (key: string): Promise<T | null> {
    const cs = getCS()
    if (!cs) return null

    try {
      // Check if there's a meta key indicating sharded data
      const mKey = metaKey(key)
      const results = await csGetItems(cs, [key, mKey])

      const metaRaw = results[mKey]
      if (metaRaw) {
        // Sharded data — read all chunks
        const meta = JSON.parse(metaRaw) as { chunks: number }
        const chunkKeys = Array.from({ length: meta.chunks }, (_, i) => chunkKey(key, i))
        const chunkData = await csGetItems(cs, chunkKeys)
        const assembled = chunkKeys.map(k => chunkData[k] ?? '').join('')
        return assembled ? JSON.parse(assembled) as T : null
      }

      // Simple (non-sharded) data
      const raw = results[key]
      return raw ? JSON.parse(raw) as T : null
    } catch {
      return null
    }
  }

  /**
   * Write a value to CloudStorage.
   * Automatically shards if the JSON exceeds CHUNK_SIZE.
   */
  async function cloudSet<T> (key: string, value: T): Promise<boolean> {
    const cs = getCS()
    if (!cs) return false

    try {
      const json = JSON.stringify(value)

      if (json.length <= MAX_VALUE_SIZE) {
        // Fits in a single key — clean up any old shards first
        await cleanupShards(cs, key)
        await csSetItem(cs, key, json)
        return true
      }

      // Need to shard
      const chunks: string[] = []
      for (let i = 0; i < json.length; i += CHUNK_SIZE) {
        chunks.push(json.slice(i, i + CHUNK_SIZE))
      }

      // Write meta first
      await csSetItem(cs, metaKey(key), JSON.stringify({ chunks: chunks.length }))

      // Write chunks in parallel
      await Promise.all(
        chunks.map((chunk, i) => csSetItem(cs, chunkKey(key, i), chunk)),
      )

      // Clean up the main key (it's replaced by shards)
      await csRemoveItem(cs, key).catch(() => {})

      // Clean up excess old chunks if previously had more
      await cleanupExcessChunks(cs, key, chunks.length)

      return true
    } catch {
      return false
    }
  }

  /**
   * Remove a key (and all its shards) from CloudStorage.
   */
  async function cloudRemove (key: string): Promise<boolean> {
    const cs = getCS()
    if (!cs) return false

    try {
      await cleanupShards(cs, key)
      await csRemoveItem(cs, key)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get all keys in CloudStorage (excluding shard internals).
   */
  async function cloudGetKeys (): Promise<string[]> {
    const cs = getCS()
    if (!cs) return []

    try {
      const keys = await csGetKeys(cs)
      // Filter out internal shard keys (__0, __1, __meta)
      return keys.filter(k => !/__\d+$/.test(k) && !k.endsWith('__meta'))
    } catch {
      return []
    }
  }

  return {
    cloudGet,
    cloudSet,
    cloudRemove,
    cloudGetKeys,
  }
}

/* ---------- internal cleanup ---------- */

async function cleanupShards (cs: TelegramCloudStorage, key: string) {
  try {
    const mRaw = await csGetItem(cs, metaKey(key))
    if (!mRaw) return
    const meta = JSON.parse(mRaw) as { chunks: number }
    const keysToRemove = [
      metaKey(key),
      ...Array.from({ length: meta.chunks }, (_, i) => chunkKey(key, i)),
    ]
    await csRemoveItems(cs, keysToRemove)
  } catch {
    // ignore — probably no shards
  }
}

async function cleanupExcessChunks (cs: TelegramCloudStorage, key: string, currentCount: number) {
  // Try to remove a few extra chunks that might exist from a previous larger write
  const extras: string[] = []
  for (let i = currentCount; i < currentCount + 10; i++) {
    extras.push(chunkKey(key, i))
  }
  await csRemoveItems(cs, extras).catch(() => {})
}
