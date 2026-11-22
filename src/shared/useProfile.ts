import { createStore } from './storage'
import { nameOf, settingsStore, useSettings, type Role, type Settings } from './settings'

/* 지금 누가 하는지: 형 / 동생 / 둘이 같이 */
export type Who = Role | 'both'

type Profile = { version: 1; who: Who | null }
export const profileStore = createStore<Profile>('profile', { version: 1, who: null })

export function setWho(who: Who) { profileStore.patch({ who }) }

/** 음성의 {이름} 자리에 들어갈 말 */
export function whoName(s: Settings, who: Who | null) {
  if (who === 'hyeong' || who === 'dong') return nameOf(s, who)
  return '우리'
}

/** 게임별 난이도 모드: 형 = 형 모드, 동생 = 동생 모드, 둘이 같이 = 게임이 정함 */
export function useProfile() {
  const { who } = profileStore.use()
  const s = useSettings()
  return {
    who,
    name: whoName(s, who),
    names: { hyeong: nameOf(s, 'hyeong'), dong: nameOf(s, 'dong') },
    avatars: s.avatars,
    setWho,
  }
}

export const currentWho = () => profileStore.get().who
export const currentNames = () => {
  const s = settingsStore.get()
  return { hyeong: nameOf(s, 'hyeong'), dong: nameOf(s, 'dong') }
}
