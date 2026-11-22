import { createStore } from '../shared/storage'

/* 공룡나라 › 공룡 도와주기 설정 (dundeuni:dino:rescue:settings) — 공룡나라 화면(public/legacy/dino)이 같은 키를 읽음 */
export type RescueSettings = { version: 1; noShot: boolean; dongCount: number; hyeongCount: number; drag: boolean; rub: boolean; off: string[] }
export const rescueStore = createStore<RescueSettings>('dino:rescue:settings', { version: 1, noShot: false, dongCount: 3, hyeongCount: 5, drag: true, rub: true, off: [] })
