import { describe, expect, it } from 'vitest'
import { addMinutes, afterRest, freshPlayTime, isOver, isRestDue, REST_AFTER_SEC, STREAK_RESET_MS, tick, unlockToday } from './playtime'

const at = (h: number, m = 0, s = 0, day = 22) => new Date(2026, 10, day, h, m, s)
const play = (p: ReturnType<typeof freshPlayTime>, secs: number, start: Date) => {
  for (let i = 0; i < secs; i++) p = tick(p, new Date(start.getTime() + i * 1000), true)
  return p
}

describe('놀이 시간 제한', () => {
  it('게임 화면에 있을 때만 시간을 센다', () => {
    let p = freshPlayTime('2026-11-22')
    p = tick(p, at(10), false)
    expect(p.sec).toBe(0)
    p = tick(p, at(10, 0, 1), true)
    expect(p.sec).toBe(1)
  })

  it('정한 시간(20분)이 되면 잠기고, 제한이 없으면 잠기지 않는다', () => {
    const p = play(freshPlayTime('2026-11-22'), 20 * 60, at(10))
    expect(isOver(p, 20, at(11))).toBe(true)
    expect(isOver(p, 21, at(11))).toBe(false)
    expect(isOver(p, 0, at(11))).toBe(false)
  })

  it('부모가 10분 더 주면 풀리고, 「오늘은 제한 없이」면 오늘만 풀린다', () => {
    let p = play(freshPlayTime('2026-11-22'), 20 * 60, at(10))
    expect(isOver(addMinutes(p, 10), 20, at(11))).toBe(false)
    p = unlockToday(p, at(11))
    expect(isOver(p, 20, at(11))).toBe(false)
    /* 다음 날에는 처음부터 다시 셈 */
    const next = tick(p, at(9, 0, 0, 23), true)
    expect(next.sec).toBe(1)
    expect(next.unlockedDay).toBeNull()
  })

  it('날짜가 바뀌면 새로 센다', () => {
    const p = play(freshPlayTime('2026-11-22'), 30, at(23, 59, 45))
    expect(p.day).toBe('2026-11-23')
    expect(p.sec).toBeLessThan(30)
  })
})

describe('쉬는 시간', () => {
  it('연속 10분 놀면 쉬는 시간, 쉬고 나면 다시 처음부터', () => {
    let p = play(freshPlayTime('2026-11-22'), REST_AFTER_SEC - 1, at(10))
    expect(isRestDue(p, true)).toBe(false)
    p = tick(p, at(10, 30), true)
    expect(isRestDue(p, true)).toBe(true)
    expect(isRestDue(p, false)).toBe(false)
    expect(isRestDue(afterRest(p), true)).toBe(false)
  })

  it('게임 밖에서 3분 넘게 있으면 연속 시간이 처음부터', () => {
    let p = play(freshPlayTime('2026-11-22'), 300, at(10))
    p = tick(p, new Date(p.lastPlayAt + STREAK_RESET_MS - 1000), false)
    expect(p.streakSec).toBe(300)
    p = tick(p, new Date(p.lastPlayAt + STREAK_RESET_MS + 1000), false)
    expect(p.streakSec).toBe(0)
    expect(p.sec).toBe(300) /* 하루 놀이 시간은 그대로 */
  })
})
