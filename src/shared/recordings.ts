/* 부모 목소리 녹음 저장소 (IndexedDB, 이 기기에만 저장 — 서버로 보내지 않음, 저장소에도 안 들어감)
   이름표(key)마다 녹음 하나. useVoice 가 녹음이 있으면 기계 목소리 대신 녹음을 틀어 줌 */

const DB = 'dundeuni-voice'
const STORE = 'clips'
let dbp: Promise<IDBDatabase> | null = null

function db(): Promise<IDBDatabase> {
  if (dbp) return dbp
  dbp = new Promise((res, rej) => {
    try {
      const r = indexedDB.open(DB, 1)
      r.onupgradeneeded = () => r.result.createObjectStore(STORE)
      r.onsuccess = () => res(r.result)
      r.onerror = () => rej(r.error)
    } catch (e) { rej(e) }
  })
  dbp.catch(() => { dbp = null })
  return dbp
}

const urls = new Map<string, string>()
const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())

/** 앱을 켤 때 한 번: 저장된 녹음을 모두 불러 둠 */
export async function loadRecordings() {
  try {
    const d = await db()
    await new Promise<void>((res) => {
      const tx = d.transaction(STORE)
      const req = tx.objectStore(STORE).openCursor()
      req.onsuccess = () => {
        const c = req.result
        if (!c) return res()
        const old = urls.get(String(c.key))
        if (old) URL.revokeObjectURL(old)
        urls.set(String(c.key), URL.createObjectURL(c.value as Blob))
        c.continue()
      }
      req.onerror = () => res()
    })
    emit()
  } catch { /* IndexedDB 를 못 쓰는 기기: 기계 목소리만 사용 */ }
}

export async function saveRecording(key: string, blob: Blob | null) {
  const d = await db()
  await new Promise<void>((res, rej) => {
    const tx = d.transaction(STORE, 'readwrite')
    if (blob) tx.objectStore(STORE).put(blob, key)
    else tx.objectStore(STORE).delete(key)
    tx.oncomplete = () => res()
    tx.onerror = () => rej(tx.error)
  })
  const old = urls.get(key)
  if (old) URL.revokeObjectURL(old)
  if (blob) urls.set(key, URL.createObjectURL(blob))
  else urls.delete(key)
  emit()
}

export const recordingURL = (key: string) => urls.get(key)
export const recordedKeys = () => [...urls.keys()]
export const subscribeRecordings = (f: () => void) => { subs.add(f); return () => { subs.delete(f) } }
