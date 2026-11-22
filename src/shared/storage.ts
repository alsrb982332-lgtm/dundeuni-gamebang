import { useSyncExternalStore } from 'react'

/* 게임방 공통 저장 (localStorage)
   - 키 접두어는 모두 `dundeuni:` (예: dundeuni:settings)
   - 저장하는 값에는 version 을 넣고, 구조가 바뀌면 migrate 로 옛 기록을 새 구조로 옮김 (기록이 지워지지 않게)
   - 사생활 보호 모드 등에서 저장이 안 돼도 앱이 멈추지 않음 */

export const PREFIX = 'dundeuni:'
export const k = (name: string) => PREFIX + name

export const raw = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(key)
      return v == null ? fallback : (JSON.parse(v) as T)
    } catch {
      return fallback
    }
  },
  set(key: string, value: unknown) {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* 저장 실패 무시 */ }
  },
  del(key: string) {
    try { localStorage.removeItem(key) } catch { /* 무시 */ }
  },
}

export type Versioned = { version: number }

/** 저장된 값을 읽어 현재 버전으로 맞춤. 모르는 값이면 기본값 */
export function loadVersioned<T extends Versioned>(
  key: string,
  defaults: T,
  migrate?: (old: Record<string, unknown>, fromVersion: number) => Partial<T>,
): T {
  const saved = raw.get<Record<string, unknown> | null>(key, null)
  if (!saved || typeof saved !== 'object') return structuredClone(defaults)
  const from = typeof saved.version === 'number' ? saved.version : 0
  const body = from < defaults.version && migrate ? migrate(saved, from) : (saved as Partial<T>)
  return { ...structuredClone(defaults), ...body, version: defaults.version }
}

/** 작은 저장소: 값 + 구독 + React 훅 (여러 화면이 같은 값을 함께 봄) */
export function createStore<T extends Versioned>(
  name: string,
  defaults: T,
  migrate?: (old: Record<string, unknown>, fromVersion: number) => Partial<T>,
) {
  const key = k(name)
  let value = loadVersioned(key, defaults, migrate)
  const subs = new Set<() => void>()
  const emit = () => subs.forEach((f) => f())
  const store = {
    key,
    get: () => value,
    set(next: T | ((v: T) => T)) {
      value = typeof next === 'function' ? (next as (v: T) => T)(value) : next
      raw.set(key, value)
      emit()
    },
    patch(p: Partial<T>) { store.set((v) => ({ ...v, ...p })) },
    /** 다른 곳(가져오기 등)에서 localStorage 가 바뀌었을 때 다시 읽기 */
    reload() { value = loadVersioned(key, defaults, migrate); emit() },
    subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f) } },
    use: (): T => useSyncExternalStore(store.subscribe, store.get, store.get),
  }
  return store
}

export const todayKey = (d = new Date()) =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')

export const shuffle = <T,>(a: readonly T[]): T[] => {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}
export const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)]
export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
