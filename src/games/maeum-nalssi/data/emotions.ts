import type { Mood, Weather } from '../../../shared/art/Art'

export type EmotionId = 'happy' | 'sad' | 'angry' | 'scared' | 'surprised' | 'upset'

export type Emotion = {
  id: EmotionId
  name: string // 카드에 쓰는 이름 (글자는 보조)
  weather: Weather
  mood: Mood
  bg: string // 연한 바탕색
  deep: string // 테두리 색
  shape: string // 색만으로 구분하지 않도록 모서리 모양도 다르게
}

export const EMOTIONS: Record<EmotionId, Emotion> = {
  happy: { id: 'happy', name: '기뻐요', weather: 'sun', mood: 'happy', bg: '#FFF1B8', deep: '#E9B92A', shape: '50%' },
  sad: { id: 'sad', name: '슬퍼요', weather: 'rain', mood: 'sad', bg: '#D6E8FF', deep: '#5C9FDA', shape: '36px' },
  angry: { id: 'angry', name: '화나요', weather: 'thunder', mood: 'angry', bg: '#FFDCD6', deep: '#E58C82', shape: '18px' },
  scared: { id: 'scared', name: '무서워요', weather: 'fog', mood: 'scared', bg: '#EAE0FB', deep: '#9D7FDA', shape: '40px 12px' },
  surprised: { id: 'surprised', name: '놀라요', weather: 'rainbow', mood: 'surprised', bg: '#FFE4C8', deep: '#EE9F52', shape: '12px 40px' },
  upset: { id: 'upset', name: '속상해요', weather: 'cloud', mood: 'upset', bg: '#E7EAF0', deep: '#97A1B4', shape: '28px' },
}
export const DONG_EMOTIONS: EmotionId[] = ['happy', 'sad']
export const ALL_EMOTIONS = Object.keys(EMOTIONS) as EmotionId[]

export type Prop = { e: string; x?: number; y?: number; size?: number; anim?: string }
export type Other = { kind: string; x?: number; mood?: Mood; big?: boolean; anim?: string }
export type Action = { icon: string; label: string; good: boolean; reply?: string }
export type Situation = {
  id: number
  modes: ('dong' | 'hyeong')[]
  story: string
  ask?: string
  emotion: EmotionId
  friend: string
  bg?: string
  props?: Prop[]
  others?: Other[]
  actions?: Action[]
  badReply?: string
}
