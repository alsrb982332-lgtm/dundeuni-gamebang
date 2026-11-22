import { beforeEach, describe, expect, it } from 'vitest'
import { applyBackup, makeBackup, parseBackup } from './backup'

beforeEach(() => localStorage.clear())

describe('기록 내보내기/가져오기', () => {
  it('게임방·게임 기록만 담고, 다른 기기에서 그대로 되살림', () => {
    localStorage.setItem('dundeuni:stickers', JSON.stringify({ version: 1, list: [{ game: 'dino', kind: 'star', who: null, day: '2026-11-22' }] }))
    localStorage.setItem('dino.v1', '{"stars":4}')
    localStorage.setItem('남의앱', 'x')
    const text = JSON.stringify(makeBackup())
    localStorage.clear()
    const n = applyBackup(parseBackup(text))
    expect(n).toBe(2)
    expect(JSON.parse(localStorage.getItem('dundeuni:stickers')!).list).toHaveLength(1)
    expect(localStorage.getItem('dino.v1')).toBe('{"stars":4}')
    expect(localStorage.getItem('남의앱')).toBeNull()
  })

  it('다른 파일·망가진 파일은 거절', () => {
    expect(() => parseBackup('아님')).toThrow()
    expect(() => parseBackup('{"app":"other","version":1,"data":{}}')).toThrow()
    expect(() => parseBackup('{"app":"dundeuni-gamebang","version":99,"data":{}}')).toThrow(/새 버전/)
    expect(() => parseBackup('{"app":"dundeuni-gamebang","version":1,"data":{"evil":"1"}}')).toThrow()
  })
})
