import { createStore, raw } from '../../shared/storage'
import { nameOf, useSettings, type ColorKey } from '../../shared/settings'
import { addSticker, stickerStore } from '../../shared/useStickers'
import type { Kind } from '../../shared/art/svg'

/* 형아랑 같이 설정 (dundeuni:hyeonga) — 이름·아바타·소리 크기는 게임방 설정을 그대로 씀
   「우리 별」은 게임방 공통 스티커판에 모음 */
export type GameId = 'bridge' | 'tower' | 'coloring' | 'moving'
export type Role = 'hyeong' | 'dong'
export type { ColorKey }
export const GAME_ID = 'hyeonga-rang'

type Own = {
  version: 1
  hyeongSide: 'left' | 'right' // 형 자리 (세로 화면이면 left = 위)
  maxGames: number // 한 번에 할 놀이 수 (0 = 제한 없음)
  maxMinutes: number // 플레이 시간 (0 = 제한 없음)
  off: GameId[] // 꺼 둔 미니게임
  debug: boolean // 디버그(터치 표시·키보드 안내)
  starsMoved: boolean
}
const DEFAULT_OWN: Own = { version: 1, hyeongSide: 'left', maxGames: 3, maxMinutes: 10, off: [], debug: false, starsMoved: false }

function fromLegacy(): Partial<Own> {
  const o = raw.get<Record<string, unknown> | null>('hyeonga.settings', null)
  if (!o) return {}
  const p: Partial<Own> = {}
  if (o.hyeongSide === 'left' || o.hyeongSide === 'right') p.hyeongSide = o.hyeongSide
  if (typeof o.maxGames === 'number') p.maxGames = o.maxGames
  if (typeof o.maxMinutes === 'number') p.maxMinutes = o.maxMinutes
  if (Array.isArray(o.off)) p.off = o.off as GameId[]
  return p
}
export const hyeongaStore = createStore<Own>('hyeonga', { ...DEFAULT_OWN, ...fromLegacy() })

/** 놀이에서 쓰는 설정 = 게임방 설정(이름·아바타·소리) + 이 게임 설정 */
export type Settings = Own & {
  hyeong: string
  dongsaeng: string
  hyeongColor: ColorKey
  dongColor: ColorKey
  hyeongKind: Kind
  dongKind: Kind
  volume: number
}
export type Progress = { days: Record<string, number>; total: number }

export function moveLegacyStars() {
  if (hyeongaStore.get().starsMoved) return
  const old = raw.get<{ days?: Record<string, number> } | null>('hyeonga.progress', null)
  if (old?.days) {
    const moved = Object.entries(old.days).flatMap(([day, c]) => Array.from({ length: Math.max(0, Math.min(500, c | 0)) }, () => ({ game: GAME_ID, kind: 'star' as const, who: 'both' as const, day })))
    if (moved.length) stickerStore.set((b) => ({ ...b, list: [...moved, ...b.list] }))
  }
  hyeongaStore.patch({ starsMoved: true })
}

export function useProgress() {
  const g = useSettings()
  const own = hyeongaStore.use()
  const list = stickerStore.use().list.filter((s) => s.game === GAME_ID)
  const settings: Settings = {
    ...own,
    hyeong: nameOf(g, 'hyeong'),
    dongsaeng: nameOf(g, 'dong'),
    hyeongColor: g.avatars.hyeong.color,
    dongColor: g.avatars.dong.color,
    hyeongKind: g.avatars.hyeong.kind,
    dongKind: g.avatars.dong.kind,
    volume: g.volume,
  }
  const days: Record<string, number> = {}
  for (const s of list) days[s.day] = (days[s.day] || 0) + 1
  return {
    settings,
    setSettings: (p: Partial<Own>) => hyeongaStore.patch(p),
    progress: { days, total: list.length } as Progress,
    addStar: () => { addSticker(GAME_ID, { who: 'both', icon: '🖐️' }) },
    reset: () => stickerStore.set((b) => ({ ...b, list: b.list.filter((s) => s.game !== GAME_ID) })),
  }
}
