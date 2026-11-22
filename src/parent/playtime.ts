import { createStore, todayKey } from '../shared/storage'

/* 놀이 시간 (dundeuni:playtime)
   - 게임 화면에 있는 동안만 셈 (메인·스티커판·부모 설정은 안 셈)
   - 하루 놀이 시간을 넘으면 잠김 → 부모 확인으로만 풀림 (10분 더 / 오늘은 제한 없이)
   - 연속 10분 놀면 30초 쉬는 시간. 게임 밖에서 3분 넘게 있으면 연속 시간은 처음부터 */

export type PlayTime = {
  version: 1
  day: string // 오늘 날짜 (바뀌면 새로 셈)
  sec: number // 오늘 논 시간(초)
  extraMin: number // 부모가 더 준 시간(분)
  unlockedDay: string | null // 이 날은 제한 없이
  streakSec: number // 쉬지 않고 논 시간(초)
  lastPlayAt: number // 마지막으로 게임 화면에 있던 때 (ms)
}

export const REST_AFTER_SEC = 10 * 60
export const REST_LEN_SEC = 30
export const STREAK_RESET_MS = 3 * 60 * 1000

export const freshPlayTime = (day: string): PlayTime => ({ version: 1, day, sec: 0, extraMin: 0, unlockedDay: null, streakSec: 0, lastPlayAt: 0 })

/** 1초(또는 dt초)가 지났을 때 */
export function tick(p: PlayTime, now: Date, inGame: boolean, dtSec = 1): PlayTime {
  const day = todayKey(now)
  let n = p.day === day ? p : freshPlayTime(day)
  const t = now.getTime()
  if (inGame) n = { ...n, sec: n.sec + dtSec, streakSec: n.streakSec + dtSec, lastPlayAt: t }
  else if (n.streakSec > 0 && t - n.lastPlayAt > STREAK_RESET_MS) n = { ...n, streakSec: 0 }
  return n
}

export function limitSec(p: PlayTime, limitMin: number) {
  return (limitMin + p.extraMin) * 60
}

export function isOver(p: PlayTime, limitMin: number, now = new Date()) {
  const day = todayKey(now)
  if (limitMin <= 0 || p.day !== day || p.unlockedDay === day) return false
  return p.sec >= limitSec(p, limitMin)
}

export const isRestDue = (p: PlayTime, enabled: boolean) => enabled && p.streakSec >= REST_AFTER_SEC
export const afterRest = (p: PlayTime): PlayTime => ({ ...p, streakSec: 0 })
export const addMinutes = (p: PlayTime, m: number): PlayTime => ({ ...p, extraMin: p.extraMin + m })
export const unlockToday = (p: PlayTime, now = new Date()): PlayTime => ({ ...p, unlockedDay: todayKey(now) })

export const playTimeStore = createStore<PlayTime>('playtime', freshPlayTime(todayKey()))
