import { createStore } from './storage'
import type { Kind } from './art/svg'

/* 게임방 설정 (dundeuni:settings) — 부모 설정에서 바꿈, 이 기기에만 저장
   아이 이름 기본값은 「형」「동생」 (실명은 부모가 기기에서 직접 입력) */

export type Role = 'hyeong' | 'dong'
export type ColorKey = 'sky' | 'lime' | 'pink' | 'yellow' | 'purple' | 'orange'
export type AvatarPick = { kind: Kind; color: ColorKey }

export type Settings = {
  version: 1
  names: Record<Role, string> // 빈 칸이면 기본 이름
  avatars: Record<Role, AvatarPick>
  volume: number // 0 ~ 1
  dailyLimitMin: number // 하루 놀이 시간(분), 0 = 제한 없음
  restReminder: boolean // 연속 10분 놀면 쉬는 시간
  gamesOff: string[] // 메인에서 숨길 게임 id
  pinPromptDone: boolean // 「화면 고정을 설정할까요?」 다시 보지 않기
}

export const DEFAULT_NAMES: Record<Role, string> = { hyeong: '형', dong: '동생' }

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  names: { hyeong: '', dong: '' },
  avatars: { hyeong: { kind: 'bear', color: 'sky' }, dong: { kind: 'bunny', color: 'lime' } },
  volume: 0.9,
  dailyLimitMin: 0,
  restReminder: true,
  gamesOff: [],
  pinPromptDone: false,
}

export const settingsStore = createStore<Settings>('settings', DEFAULT_SETTINGS)
export const useSettings = settingsStore.use

export const nameOf = (s: Settings, r: Role) => s.names[r]?.trim() || DEFAULT_NAMES[r]
