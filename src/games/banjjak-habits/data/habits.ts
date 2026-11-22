import RAW from './habits.json'

/** 단계마다 하는 손놀이
   - rub(문지르기): clean = 문지르면 얼룩(spot)이 사라짐, foam = 문지르면 거품(spot)이 생김. target 'dundun' 이면 든든이 그림
   - drag(옮기기): item 을 끌어서 target 에 놓기. target 'dundun' 이면 든든이에게
   없으면 카드를 누르기만 하면 됨 */
export type StepDo =
  | { type: 'rub'; mode: 'clean' | 'foam'; target: string; spot: string }
  | { type: 'drag'; item: string; target: string }

export type Step = { id: string; icon: string; label: string; say: string; sfx?: string; act?: string; repeat?: string; do?: StepDo }
export type ThemeId = 'morning' | 'day' | 'night'
/** 배경: 욕실 · 침실(아침) · 밤 · 부엌 · 놀이방 · 현관 · 거실 */
export type SceneId = 'bathroom' | 'bedroom' | 'night' | 'kitchen' | 'playroom' | 'entrance' | 'living'

export type Habit = {
  id: string
  name: string
  icon: string
  when: string
  done: string
  sparkle?: string
  theme: ThemeId
  scene: SceneId
  steps: Record<string, Omit<Step, 'id'>>
  dong: string[]
  hyeong: string[]
  hyeong5?: string[]
}

export const HABITS = RAW as unknown as Habit[]

export const THEMES: { id: ThemeId; name: string; icon: string }[] = [
  { id: 'morning', name: '아침', icon: '🌅' },
  { id: 'day', name: '낮', icon: '🌤️' },
  { id: 'night', name: '저녁', icon: '🌙' },
]

/** 모드에 맞는 단계 목록 (3~5단계 모두 동작) */
export function stepsFor(h: Habit, mode: 'dong' | 'hyeong', five: boolean): Step[] {
  const ids = mode === 'dong' ? h.dong : five && h.hyeong5?.length ? h.hyeong5 : h.hyeong
  return ids.filter((id) => h.steps[id]).map((id) => ({ id, ...h.steps[id] }))
}
