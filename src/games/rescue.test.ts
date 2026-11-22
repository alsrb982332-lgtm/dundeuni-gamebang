import { beforeAll, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/* 공룡나라 › 공룡 도와주기 규칙 (public/legacy/dino/rescue-logic.js) */
type Friend = { id: string; tools: string[]; action: string; modes: string[]; world: string }
type RL = {
  isRight: (f: Friend, t: string, o?: object) => boolean
  needHint: (n: number) => boolean
  toolCount: (l: number) => number
  bubbleShown: (m: string, l: number) => boolean
  needs: (f: Friend, m: string, l: number, diet?: string, o?: object) => string[][]
  toolChoices: (n: string[][], m: string, l: number, o?: object, r?: () => number) => string[]
  pickFriends: (list: Friend[], m: string, n: number, off?: string[]) => Friend[]
  nextLevel: (s: object, who: string, ft: boolean[]) => { hyeong?: { lvl: number } }
  levelOf: (s: object, who: string) => number
  parseRescue: (j: string) => Friend[]
}
const DIR = path.resolve(__dirname, '../../public/legacy/dino')
let R: RL
let FRIENDS: Friend[]
beforeAll(async () => {
  ;(globalThis as { window?: unknown }).window = globalThis
  await import(path.join(DIR, 'rescue-logic.js'))
  R = (globalThis as unknown as { RescueLogic: RL }).RescueLogic
  FRIENDS = R.parseRescue(fs.readFileSync(path.join(DIR, 'rescue.json'), 'utf8'))
})

describe('공룡 도와주기', () => {
  it('rescue.json: 친구 12마리 이상, 세상 5개 모두, 동생 모드 친구는 먹이 주기만', () => {
    expect(FRIENDS.length).toBeGreaterThanOrEqual(12)
    expect(new Set(FRIENDS.map((f) => f.world)).size).toBe(5)
    const dong = FRIENDS.filter((f) => f.modes.includes('dong'))
    expect(dong.length).toBeGreaterThanOrEqual(3)
    dong.forEach((f) => expect(f.action).toBe('feed'))
  })

  it('알맞은 도구 판정: 여러 개면 아무거나 정답, 주사 끄기면 약만', () => {
    const sick = FRIENDS.find((f) => f.tools.includes('shot'))!
    expect(R.isRight(sick, 'medicine')).toBe(true)
    expect(R.isRight(sick, 'shot')).toBe(true)
    expect(R.isRight(sick, 'shot', { noShot: true })).toBe(false)
    expect(R.isRight(sick, 'meat')).toBe(false)
    for (let k = 0; k < 20; k++) expect(R.toolChoices(R.needs(sick, 'hyeong', 3, 'plant', { noShot: true }), 'hyeong', 3, { noShot: true })).not.toContain('shot')
  })

  it('2번 맞지 않으면 힌트', () => {
    expect(R.needHint(1)).toBe(false)
    expect(R.needHint(2)).toBe(true)
  })

  it('레벨에 따라 도구 수·말풍선, 레벨 5에서 아픈 친구는 먹이도 필요', () => {
    const f = FRIENDS.find((x) => x.id === 'stegosaurus')!
    expect(R.toolChoices(R.needs(f, 'dong', 1), 'dong', 1)).toHaveLength(1)
    expect(R.toolChoices(R.needs(f, 'hyeong', 1), 'hyeong', 1)).toHaveLength(2)
    expect(R.toolChoices(R.needs(f, 'hyeong', 4), 'hyeong', 4)).toHaveLength(4)
    expect(R.bubbleShown('hyeong', 3)).toBe(true)
    expect(R.bubbleShown('hyeong', 4)).toBe(false)
    expect(R.bubbleShown('dong', 5)).toBe(true)
    const n5 = R.needs(f, 'hyeong', 5, 'plant')
    expect(n5).toHaveLength(2)
    const ch = R.toolChoices(n5, 'hyeong', 5)
    expect(ch).toContain(n5[0][0])
    expect(ch).toContain('grass')
  })

  it('아이별 레벨: 동생이 해도 형 레벨은 그대로, 형은 잘하면 올라감', () => {
    let st = {}
    st = R.nextLevel(st, 'dong', [true, true, true])
    expect(R.levelOf(st, 'hyeong')).toBe(1)
    expect(R.levelOf(st, 'dong')).toBe(1)
    st = R.nextLevel(st, 'hyeong', [true, true, true, true, true])
    expect(R.levelOf(st, 'hyeong')).toBe(2)
    st = R.nextLevel(st, 'hyeong', [false, false, true, false, false])
    expect(R.levelOf(st, 'hyeong')).toBe(1)
  })

  it('한 판 친구: 모드에 맞게, 겹치지 않게, 꺼 둔 친구 제외', () => {
    const list = R.pickFriends(FRIENDS, 'hyeong', 5, ['triceratops'])
    expect(list).toHaveLength(5)
    expect(new Set(list.map((f) => f.id)).size).toBe(5)
    expect(list.some((f) => f.id === 'triceratops')).toBe(false)
    R.pickFriends(FRIENDS, 'dong', 3).forEach((f) => expect(f.modes).toContain('dong'))
  })
})
