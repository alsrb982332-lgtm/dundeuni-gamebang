import { createStore, raw, todayKey } from './storage'
import type { Who } from './useProfile'

/* 모든 게임 공통 스티커판 (dundeuni:stickers)
   - 2단계로 옮긴 게임은 addSticker 로 여기에 바로 모음
   - 아직 1단계(그대로 넣기)인 게임은 각자 저장한 별 개수를 읽어서 함께 보여 줌 (readLegacyStars) */

export type StickerKind = 'star' | 'gold'
export type Sticker = { game: string; kind: StickerKind; who: Who | null; day: string; icon?: string }
type StickerBook = { version: 1; list: Sticker[] }

export const stickerStore = createStore<StickerBook>('stickers', { version: 1, list: [] })

export function addSticker(game: string, opts: { kind?: StickerKind; who?: Who | null; icon?: string; day?: string } = {}) {
  const s: Sticker = { game, kind: opts.kind ?? 'star', who: opts.who ?? null, day: opts.day ?? todayKey(), ...(opts.icon ? { icon: opts.icon } : {}) }
  stickerStore.set((b) => ({ ...b, list: [...b.list, s] }))
  return s
}

/** 날짜별로 묶기 (최근 날짜가 먼저) */
export function byDay(list: Sticker[]): [string, Sticker[]][] {
  const m = new Map<string, Sticker[]>()
  for (const s of list) m.set(s.day, [...(m.get(s.day) || []), s])
  return [...m.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
}

export const countFor = (list: Sticker[], game: string, kind?: StickerKind) =>
  list.filter((s) => s.game === game && (!kind || s.kind === kind)).length

/* ---------- 1단계 게임이 각자 저장한 별 ---------- */
const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : 0)
const LEGACY_READERS: Record<string, () => number> = {
  dino: () => num(raw.get<{ stars?: number }>('dino.v1', {}).stars),
  trace: () => num(raw.get('trace.hyeong.stars', 0)) + num(raw.get('trace.dong.stars', 0)),
  blocks: () => num(raw.get('blocks.hyeong.stars', 0)) + num(raw.get('blocks.dong.stars', 0)),
  'maeum-nalssi': () => num(raw.get<{ total?: number }>('maeum.progress', {}).total),
  'hyeonga-rang': () => num(raw.get<{ total?: number }>('hyeonga.progress', {}).total),
  'banjjak-habits': () => {
    const r = raw.get<Record<string, { play?: unknown[]; real?: unknown[] }>>('banjjak.records', {})
    return Object.values(r || {}).reduce((a, d) => a + (d?.play?.length || 0) + (d?.real?.length || 0), 0)
  },
}
export function readLegacyStars(game: string) {
  try { return LEGACY_READERS[game]?.() ?? 0 } catch { return 0 }
}

export const useStickers = () => {
  const book = stickerStore.use()
  return { list: book.list, add: addSticker }
}
