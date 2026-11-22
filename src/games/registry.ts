import type { ComponentType, LazyExoticComponent } from 'react'

/* 게임 목록 — 여기에 한 줄만 추가하면 메인 화면에 게임이 나옵니다.

   1단계(그대로 넣기) 게임:  { id, name, kind: 'legacy', src: 'legacy/<id>/index.html' }
     → public/legacy/<id>/index.html 을 게임 화면에 띄움
   2단계(옮긴) 게임:        { id, name, kind: 'module', load: () => import('./<id>') }
     → src/games/<id>/index.tsx 의 기본 내보내기 컴포넌트

   art: 카드 그림 (src/shared/art/svg.ts 의 GAME_ART 이름, 보통 id 와 같음)
   orientation: 권장 화면 방향 (다르면 「태블릿을 돌려 볼까?」 안내)
   together: 「둘이 같이」를 골랐을 때 강조할 게임 */

export type GameProps = { onExit: () => void }

type Base = {
  id: string
  name: string
  art?: string
  color: string
  orientation?: 'landscape' | 'portrait' | 'any'
  together?: boolean
}
export type LegacyGame = Base & { kind: 'legacy'; src: string }
export type ModuleGame = Base & { kind: 'module'; component: LazyExoticComponent<ComponentType<GameProps>> }
export type Game = LegacyGame | ModuleGame

export const GAMES: Game[] = [
  { id: 'dino', name: '든든 공룡나라', color: '#5DBB6B', kind: 'legacy', src: 'legacy/dino/index.html' },
  { id: 'trace', name: '따라 쓰기 놀이', color: '#5C9FDA', kind: 'legacy', src: 'legacy/trace/index.html' },
  { id: 'blocks', name: '든든 블록 놀이', color: '#E58F3E', kind: 'legacy', src: 'legacy/blocks/index.html' },
  { id: 'maeum-nalssi', name: '마음 날씨', color: '#E9B92A', kind: 'legacy', src: 'legacy/maeum-nalssi/index.html' },
  { id: 'hyeonga-rang', name: '형아랑 같이', color: '#DE7BA8', kind: 'legacy', src: 'legacy/hyeonga-rang/index.html', orientation: 'landscape', together: true },
  { id: 'banjjak-habits', name: '반짝반짝 습관 놀이', color: '#9D7FDA', kind: 'legacy', src: 'legacy/banjjak-habits/index.html' },
]

export const gameById = (id: string | undefined) => GAMES.find((g) => g.id === id)
