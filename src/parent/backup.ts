/* 기록 내보내기 / 가져오기 (JSON 파일)
   태블릿을 바꿔도 스티커·설정이 이어지도록, 이 기기 localStorage 의 게임방·게임 기록을 파일 하나로 저장
   (부모 녹음은 소리 파일이라 포함하지 않음 — 새 기기에서 다시 녹음) */

/** 게임방(dundeuni:)과 각 게임이 쓰는 저장 이름 */
export const BACKUP_PREFIXES = ['dundeuni:', 'dino.', 'trace.', 'blocks.', 'maeum.', 'hyeonga.', 'banjjak.']
export const BACKUP_APP = 'dundeuni-gamebang'
export const BACKUP_VERSION = 1

export type Backup = { app: typeof BACKUP_APP; version: number; exportedAt: string; data: Record<string, string> }

const ours = (k: string) => BACKUP_PREFIXES.some((p) => k.startsWith(p))

export function makeBackup(storage: Storage = localStorage, now = new Date()): Backup {
  const data: Record<string, string> = {}
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i)
    if (k && ours(k)) data[k] = storage.getItem(k) ?? ''
  }
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), data }
}

/** 파일 내용을 확인하고 읽음. 이상하면 이유를 담은 오류 */
export function parseBackup(text: string): Backup {
  let b: unknown
  try { b = JSON.parse(text) } catch { throw new Error('JSON 파일이 아니에요.') }
  const o = b as Partial<Backup>
  if (!o || o.app !== BACKUP_APP || typeof o.data !== 'object' || !o.data) throw new Error('든든이 게임방 기록 파일이 아니에요.')
  if (typeof o.version !== 'number' || o.version > BACKUP_VERSION) throw new Error('더 새 버전에서 만든 파일이에요. 앱을 먼저 업데이트해 주세요.')
  for (const [k, v] of Object.entries(o.data)) if (!ours(k) || typeof v !== 'string') throw new Error('알 수 없는 내용이 들어 있어요: ' + k)
  return o as Backup
}

/** 가져오기: 파일에 있는 기록으로 바꿈 (파일에 없는 게임방 기록은 그대로 둠) */
export function applyBackup(b: Backup, storage: Storage = localStorage) {
  let n = 0
  for (const [k, v] of Object.entries(b.data)) { storage.setItem(k, v); n++ }
  return n
}

export function backupFileName(now = new Date()) {
  const d = now.toISOString().slice(0, 10)
  return `dundeuni-기록-${d}.json`
}

export function downloadBackup() {
  const b = makeBackup()
  const blob = new Blob([JSON.stringify(b, null, 1)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = backupFileName()
  document.body.appendChild(a)
  a.click()
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 1000)
  return Object.keys(b.data).length
}
