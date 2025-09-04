// Minimal IndexedDB offline queue for activities and followups
type QueueItem = { type: 'activity' | 'followup'; payload: any }

const DB_NAME = 'fzcrm-offline'
const STORE = 'queue'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function enqueueActivity(payload: any) {
  const db = await open()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).add({ type: 'activity', payload })
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function enqueueFollowup(payload: any) {
  const db = await open()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).add({ type: 'followup', payload })
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function sync(processor: (item: QueueItem) => Promise<void>) {
  const db = await open()
  const tx = db.transaction(STORE, 'readwrite')
  const store = tx.objectStore(STORE)
  const items: Array<{ id: number } & QueueItem> = []
  await new Promise<void>((resolve, reject) => {
    const req = store.openCursor()
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) {
        items.push(cursor.value)
        cursor.continue()
      } else resolve()
    }
    req.onerror = () => reject(req.error)
  })
  for (const item of items) {
    try {
      await processor({ type: item.type, payload: item.payload })
      store.delete(item.id)
    } catch (e) {
      // stop on first failure to retry later
      break
    }
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}
