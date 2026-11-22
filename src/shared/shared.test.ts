import { beforeEach, describe, expect, it } from 'vitest'
import { createStore, loadVersioned, raw } from './storage'
import { addSticker, byDay, countFor, readLegacyStars, stickerStore } from './useStickers'
import { fill, setVoiceVars } from './useVoice'
import { backTarget } from '../kids-mode/BackGuard'

beforeEach(() => localStorage.clear())

describe('공통 저장 (dundeuni:)', () => {
  it('키 접두어는 dundeuni:', () => {
    expect(createStore('test', { version: 1, a: 1 }).key).toBe('dundeuni:test')
  })

  it('구조가 바뀌어도 옛 기록을 옮겨 오고 지우지 않음', () => {
    raw.set('dundeuni:x', { version: 1, stars: 7 })
    type V2 = { version: 2; total: number; extra: string }
    const v = loadVersioned<V2>('dundeuni:x', { version: 2, total: 0, extra: '기본' }, (old) => ({ total: Number(old.stars) }))
    expect(v).toEqual({ version: 2, total: 7, extra: '기본' })
  })

  it('저장된 값이 망가져 있으면 기본값', () => {
    localStorage.setItem('dundeuni:y', '{망가진')
    expect(loadVersioned('dundeuni:y', { version: 1, n: 3 })).toEqual({ version: 1, n: 3 })
  })
})

describe('공통 스티커판', () => {
  it('모든 게임의 스티커가 한곳에 모이고 새로 읽어도 남아 있음', () => {
    stickerStore.reload()
    addSticker('maeum-nalssi', { who: 'dong', day: '2026-11-21' })
    addSticker('banjjak-habits', { kind: 'gold', icon: '🪥', day: '2026-11-22' })
    addSticker('maeum-nalssi', { day: '2026-11-22' })
    stickerStore.reload()
    const list = stickerStore.get().list
    expect(list).toHaveLength(3)
    expect(countFor(list, 'maeum-nalssi')).toBe(2)
    expect(countFor(list, 'banjjak-habits', 'gold')).toBe(1)
    expect(byDay(list).map(([d, s]) => [d, s.length])).toEqual([['2026-11-22', 2], ['2026-11-21', 1]])
  })

  it('1단계 게임이 각자 저장한 별도 읽음', () => {
    raw.set('dino.v1', { stars: 5 })
    raw.set('trace.hyeong.stars', 2)
    raw.set('trace.dong.stars', 1)
    raw.set('banjjak.records', { '2026-11-22': { play: ['brush'], real: ['brush'] } })
    expect(readLegacyStars('dino')).toBe(5)
    expect(readLegacyStars('trace')).toBe(3)
    expect(readLegacyStars('banjjak-habits')).toBe(2)
    expect(readLegacyStars('없는게임')).toBe(0)
  })
})

describe('목소리 자리표시자', () => {
  it('{형} {동생} {이름} 과 조사', () => {
    setVoiceVars({ 형: '형', 동생: '동생', 이름: '우리' })
    expect(fill('{형랑} {동생이} 같이!')).toBe('형이랑 동생이 같이!')
    setVoiceVars({ 형: '하늘', 동생: '바다' })
    expect(fill('{형가} 기다려 줬어. {동생아}!')).toBe('하늘이 기다려 줬어. 바다야!')
  })
})

describe('뒤로 가기', () => {
  it('시작 화면이 아니면 항상 게임방 메인으로', () => {
    expect(backTarget('/play/dino')).toBe('/main')
    expect(backTarget('/main')).toBe('/main')
    expect(backTarget('/stickers')).toBe('/main')
    expect(backTarget('/')).toBe('/')
  })
})

import { deviceKind } from '../kids-mode/device'
describe('기기 판별 (화면 고정 안내)', () => {
  it('안드로이드 / 아이패드(맥처럼 보이는 것 포함) / 아이폰 / 기타', () => {
    expect(deviceKind('Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/131 Safari/537.36', 5)).toBe('android')
    expect(deviceKind('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15', 5)).toBe('ipad')
    expect(deviceKind('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15', 5)).toBe('ipad')
    expect(deviceKind('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15', 0)).toBe('other')
    expect(deviceKind('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 5)).toBe('iphone')
  })
})
