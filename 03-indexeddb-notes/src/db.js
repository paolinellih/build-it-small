const DB_NAME = 'local-notes'
const DB_VERSION = 1
const STORE = 'notes'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
        store.createIndex('updatedAt', 'updatedAt')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const store = t.objectStore(STORE)
    const req = fn(store)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getAllNotes() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, 'readonly')
    const req = t.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result.sort((a, b) => b.updatedAt - a.updatedAt))
    req.onerror = () => reject(req.error)
  })
}

export async function saveNote(note) {
  const db = await openDB()
  const now = Date.now()
  if (note.id) {
    return tx(db, 'readwrite', (s) => s.put({ ...note, updatedAt: now }))
  }
  return tx(db, 'readwrite', (s) => s.add({ ...note, createdAt: now, updatedAt: now }))
}

export async function deleteNote(id) {
  const db = await openDB()
  return tx(db, 'readwrite', (s) => s.delete(id))
}
