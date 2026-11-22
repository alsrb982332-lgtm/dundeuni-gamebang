import { beforeEach, describe, expect, it } from 'vitest'
import { ALL_SITUATIONS, buildRound, hasActStep, pickActions, pickOptions } from './rounds'
import { DONG_EMOTIONS, EMOTIONS, type Situation } from './data/emotions'
import VOICE from './data/voice.json'
import { stickerStore } from '../../shared/useStickers'
import { raw } from '../../shared/storage'

/* 01번 의뢰서 「완료 기준」 중 코드로 확인할 수 있는 것 */
describe('마음 날씨 난이도 모드', () => {
  it('동생 모드: 기뻐요·슬퍼요 상황만, 보기 2개, 3문제, 행동 고르기 없음', () => {
    for (let t = 0; t < 30; t++) {
      const round = buildRound('dong', 3, [])
      expect(round).toHaveLength(3)
      for (const s of round) {
        expect(DONG_EMOTIONS).toContain(s.emotion)
        const opts = pickOptions(s, 'dong', 4)
        expect(opts).toHaveLength(2)
        expect(opts).toContain(s.emotion)
        opts.forEach((o) => expect(DONG_EMOTIONS).toContain(o))
        expect(hasActStep(s, 'dong')).toBe(false)
      }
    }
  })

  it('형 모드: 5문제, 기분 보기 3~4개(정답 포함, 겹치지 않음), 행동 고르기 있음', () => {
    for (let t = 0; t < 30; t++) {
      const round = buildRound('hyeong', 5, [])
      expect(round).toHaveLength(5)
      for (const s of round) {
        for (const n of [3, 4]) {
          const opts = pickOptions(s, 'hyeong', n)
          expect(opts).toHaveLength(n)
          expect(opts).toContain(s.emotion)
          expect(new Set(opts).size).toBe(n)
        }
        expect(hasActStep(s, 'hyeong')).toBe(true)
        const acts = pickActions(s)
        expect(acts.length).toBeGreaterThanOrEqual(2)
        expect(acts.some((a) => a.good)).toBe(true)
      }
    }
  })

  it('꺼 둔 상황은 나오지 않음 (다 꺼져 있으면 전부에서)', () => {
    const dongIds = ALL_SITUATIONS.filter((s) => s.modes.includes('dong') && DONG_EMOTIONS.includes(s.emotion)).map((s) => s.id)
    const off = dongIds.slice(1)
    for (let t = 0; t < 10; t++) buildRound('dong', 3, off).forEach((s) => expect(s.id).toBe(dongIds[0]))
    expect(buildRound('dong', 3, dongIds)).toHaveLength(3)
  })

  it('situations.json 에 상황을 추가하면 코드 수정 없이 나옴', () => {
    const extra: Situation = { id: 99, modes: ['dong', 'hyeong'], story: '새 상황', emotion: 'happy', friend: 'cat', actions: [{ icon: '👏', label: '박수', good: true }, { icon: '🙈', label: '모른 척', good: false }] }
    const all = [...ALL_SITUATIONS, extra]
    const off = ALL_SITUATIONS.map((s) => s.id)
    expect(buildRound('dong', 3, off.filter(() => true), all).every((s) => s.id === 99)).toBe(true)
  })
})

describe('마음 날씨 데이터', () => {
  it('상황 12개 이상, 모든 감정에 날씨·이름 음성이 있고, 이름 자리표시자 문제가 있음', () => {
    expect(ALL_SITUATIONS.length).toBeGreaterThanOrEqual(12)
    const v = VOICE as Record<string, string>
    for (const id of Object.keys(EMOTIONS)) {
      expect(v['name_' + id]).toBeTruthy()
      expect(v['right_' + id]).toBeTruthy()
      expect(EMOTIONS[id as keyof typeof EMOTIONS].weather).toBeTruthy()
    }
    expect(ALL_SITUATIONS.filter((s) => /\{(형|동생)/.test(s.story)).length).toBeGreaterThanOrEqual(2)
  })

  it('틀렸을 때 문장에 부정적인 말이 없음', () => {
    const v = VOICE as Record<string, string>
    const wrong = [v.retry_feel, v.hint, ...Object.entries(v).filter(([k]) => k.startsWith('bad_')).map(([, t]) => t)]
    for (const t of wrong) expect(t).not.toMatch(/틀렸|땡|아니야|못했|안 돼/)
  })
})

describe('마음 날씨 별 → 공통 스티커판', () => {
  beforeEach(() => { localStorage.clear(); stickerStore.reload() })

  it('별은 공통 스티커판에 모이고, 1단계 때 모은 별도 한 번만 옮겨 옴', async () => {
    raw.set('maeum.progress', { days: { '2026-11-20': 2, '2026-11-21': 1 }, total: 3 })
    const { addStar, moveLegacyStars, maeumStore } = await import('./progress')
    maeumStore.reload()
    expect(moveLegacyStars()).toBe(3)
    expect(moveLegacyStars()).toBe(0)
    addStar('dong')
    const mine = stickerStore.get().list.filter((s) => s.game === 'maeum-nalssi')
    expect(mine).toHaveLength(4)
    expect(mine.filter((s) => s.day === '2026-11-20')).toHaveLength(2)
  })
})
