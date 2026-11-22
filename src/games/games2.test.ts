import { describe, expect, it } from 'vitest'
import { makeSync } from './hyeonga-rang/useMultiTouch'
import { rubNeed } from './hyeonga-rang/games/Coloring/Coloring'
import { HABITS, THEMES, stepsFor } from './banjjak-habits/data/habits'
import SITUATIONS from './maeum-nalssi/data/situations.json'
import { KIND_COLORS } from '../shared/art/svg'

/* 2차 개선 규칙 시험 */
describe('형아랑 같이: 번갈아 누르기', () => {
  it('한 사람이 누르면 다른 사람 차례 안내, 다른 사람이 누르면 함께 해냄 (시간 제한 없음)', () => {
    const log: string[] = []
    const sync = makeSync({ onBoth: () => log.push('both'), onLonely: (w) => log.push('wait-' + w) })
    sync.press('hyeong')
    sync.press('hyeong') /* 같은 사람이 또 눌러도 기다림 */
    expect(log).toEqual(['wait-hyeong'])
    sync.press('dong')
    expect(log).toEqual(['wait-hyeong', 'both'])
    sync.press('dong')
    sync.press('hyeong')
    expect(log).toEqual(['wait-hyeong', 'both', 'wait-dong', 'both'])
  })

  it('색칠: 칸 크기의 약 2.4배를 문지르면 다 칠해짐 (대충 3~4번)', () => {
    expect(rubNeed(200, 100)).toBe(480)
    expect(rubNeed(20, 20)).toBe(160) /* 아주 작은 칸도 몇 번은 문지르게 */
  })
})

describe('반짝반짝 습관 놀이 데이터', () => {
  it('모든 습관이 아침·낮·저녁 중 하나와 배경을 가짐, 새 습관 4개 포함', () => {
    const themes = THEMES.map((t) => t.id)
    for (const h of HABITS) {
      expect(themes).toContain(h.theme)
      expect(h.scene).toBeTruthy()
    }
    for (const id of ['wakeup', 'face', 'bath', 'nose']) expect(HABITS.some((h) => h.id === id)).toBe(true)
  })
  it('단계 목록이 실제 단계를 가리키고(3~5단계), 손놀이 정보가 맞는 모양', () => {
    for (const h of HABITS) {
      for (const [mode, five] of [['dong', false], ['hyeong', false], ['hyeong', true]] as const) {
        const st = stepsFor(h, mode, five)
        expect(st.length).toBeGreaterThanOrEqual(3)
        expect(st.length).toBeLessThanOrEqual(5)
      }
      for (const s of Object.values(h.steps)) {
        if (!s.do) continue
        if (s.do.type === 'rub') expect(['clean', 'foam']).toContain(s.do.mode)
        else expect(s.do.item && s.do.target).toBeTruthy()
      }
    }
    /* 손놀이가 있는 단계가 충분히 많음 */
    const all = HABITS.flatMap((h) => Object.values(h.steps))
    expect(all.filter((s) => s.do).length).toBeGreaterThanOrEqual(30)
  })
})

describe('마음 날씨 새 상황', () => {
  it('엄마·아빠·선생님·할아버지·할머니·형·동생이 나오는 상황이 있고, 그림이 있는 인물만 씀', () => {
    const who = (SITUATIONS as { friend: string }[]).map((s) => s.friend)
    for (const k of ['mom', 'dad', 'teacher', 'grandpa', 'grandma', '형', '동생']) expect(who).toContain(k)
    for (const f of who) expect(f === '형' || f === '동생' || f in KIND_COLORS).toBe(true)
  })
})
