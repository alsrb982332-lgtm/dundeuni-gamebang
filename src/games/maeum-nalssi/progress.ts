import { createStore, raw } from '../../shared/storage'
import { addSticker, stickerStore } from '../../shared/useStickers'
import type { Who } from '../../shared/useProfile'

/* 마음 날씨 설정 (dundeuni:maeum) — 아이 이름·소리 크기는 게임방 설정에서 함께 관리
   별 스티커는 게임방 공통 스티커판(dundeuni:stickers)에 모음 */
export type Settings = {
  version: 1
  dongCount: number // 동생 모드 한 판 문제 수
  hyeongCount: number // 형 모드 한 판 문제 수
  hyeongChoices: number // 형 모드 기분 카드 수 (3~4)
  off: number[] // 꺼 둔 상황 번호
  starsMoved: boolean // 1단계 때 모은 별을 공통 스티커판으로 옮겼는지
}
export const DEFAULT_SETTINGS: Settings = { version: 1, dongCount: 3, hyeongCount: 5, hyeongChoices: 4, off: [], starsMoved: false }

/* 1단계 복사본이 쓰던 설정(maeum.settings)이 있으면 이어받음 */
function fromLegacy(): Partial<Settings> {
  const old = raw.get<Record<string, unknown> | null>('maeum.settings', null)
  if (!old) return {}
  const n = (k: string) => (typeof old[k] === 'number' ? (old[k] as number) : undefined)
  const p: Partial<Settings> = {}
  if (n('dongCount')) p.dongCount = n('dongCount')
  if (n('hyeongCount')) p.hyeongCount = n('hyeongCount')
  if (n('hyeongChoices')) p.hyeongChoices = n('hyeongChoices')
  if (Array.isArray(old.off)) p.off = (old.off as unknown[]).filter((x): x is number => typeof x === 'number')
  return p
}

export const maeumStore = createStore<Settings>('maeum', { ...DEFAULT_SETTINGS, ...fromLegacy() })
export const useMaeumSettings = maeumStore.use

/** 1단계 때 모은 별(maeum.progress)을 공통 스티커판으로 한 번만 옮김 */
export function moveLegacyStars() {
  if (maeumStore.get().starsMoved) return 0
  const old = raw.get<{ days?: Record<string, number> } | null>('maeum.progress', null)
  let n = 0
  if (old?.days) {
    const moved = Object.entries(old.days).flatMap(([day, c]) => Array.from({ length: Math.max(0, Math.min(500, c | 0)) }, () => ({ game: GAME_ID, kind: 'star' as const, who: null, day })))
    if (moved.length) stickerStore.set((b) => ({ ...b, list: [...moved, ...b.list] }))
    n = moved.length
  }
  maeumStore.patch({ starsMoved: true })
  return n
}

export const GAME_ID = 'maeum-nalssi'
export const addStar = (who: Who | null) => addSticker(GAME_ID, { who, icon: '☀️' })
