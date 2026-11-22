import { createStore, raw, todayKey } from '../../shared/storage'
import { nameOf, useSettings } from '../../shared/settings'
import { addSticker, stickerStore } from '../../shared/useStickers'
import { HABITS } from './data/habits'

/* 반짝반짝 습관 놀이 설정 (dundeuni:banjjak) — 이름·소리 크기는 게임방 설정을 그대로 씀
   습관 스티커는 게임방 공통 스티커판에 (tag = 습관 id) */
export const GAME_ID = 'banjjak-habits'

type Own = {
  version: 1
  todayHabit: string // '' = 고르기
  five: boolean // 형 모드 5단계
  drag: boolean // 형 모드에서 카드를 끌어서 놓기도 허용
  on: Record<string, boolean> // 습관 켜고 끄기
  starsMoved: boolean
}
const DEFAULT_OWN: Own = { version: 1, todayHabit: '', five: false, drag: true, on: {}, starsMoved: false }

function fromLegacy(): Partial<Own> {
  const o = raw.get<Record<string, unknown> | null>('banjjak.settings', null)
  if (!o) return {}
  const p: Partial<Own> = {}
  if (typeof o.todayHabit === 'string') p.todayHabit = o.todayHabit
  if (typeof o.five === 'boolean') p.five = o.five
  return p
}
export const banjjakStore = createStore<Own>('banjjak', { ...DEFAULT_OWN, ...fromLegacy() })

export type Settings = Own & { hyeong: string; dongsaeng: string; volume: number }
export type DayRec = { play: string[]; real: string[] }
export type Records = Record<string, DayRec>

/** 습관 켜짐 여부 (설정에 없으면 켜짐) */
export const isOn = (s: Pick<Own, 'on'>, id: string) => s.on[id] !== false

export function moveLegacyStars() {
  if (banjjakStore.get().starsMoved) return
  const old = raw.get<Records | null>('banjjak.records', null)
  if (old) {
    const icon = (id: string) => HABITS.find((h) => h.id === id)?.icon
    const moved = Object.entries(old).flatMap(([day, r]) =>
      [...(r?.play || []), ...(r?.real || [])].map((id) => ({ game: GAME_ID, kind: 'star' as const, who: null, day, tag: id, ...(icon(id) ? { icon: icon(id) } : {}) })))
    if (moved.length) stickerStore.set((b) => ({ ...b, list: [...moved, ...b.list] }))
  }
  banjjakStore.patch({ starsMoved: true })
}

export function useProgress() {
  const g = useSettings()
  const own = banjjakStore.use()
  const mine = stickerStore.use().list.filter((s) => s.game === GAME_ID)
  const records: Records = {}
  for (const s of mine) {
    const d = (records[s.day] ||= { play: [], real: [] })
    d.play.push(s.tag || '')
  }
  const settings: Settings = { ...own, hyeong: nameOf(g, 'hyeong'), dongsaeng: nameOf(g, 'dong'), volume: g.volume }
  return {
    settings,
    setSettings: (p: Partial<Own>) => banjjakStore.patch(p),
    records,
    add: (habit: string) => {
      const h = HABITS.find((x) => x.id === habit)
      addSticker(GAME_ID, { tag: habit, icon: h?.icon && !h.icon.startsWith('svg:') ? h.icon : '⭐' })
    },
    reset: () => stickerStore.set((b) => ({ ...b, list: b.list.filter((s) => s.game !== GAME_ID) })),
    totals: { play: mine.length, real: 0 },
    today: records[todayKey()] || { play: [], real: [] },
  }
}
