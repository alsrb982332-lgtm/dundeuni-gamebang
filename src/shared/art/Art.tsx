import type { CSSProperties } from 'react'
import { CUSTOM_ICONS, dundunSVG, face, friendSVG, GAME_ART, OUT, st, weatherSVG, type Kind, type Mood, type Weather } from './svg'

/* 그림 컴포넌트 (svg.ts 의 문자열 그림을 화면에 보여 줌) */
type Box = { className?: string; style?: CSSProperties }
type Color = { b: string; d: string; l: string }

export function Dundun({ mood = 'neutral', wave = false, className, style }: { mood?: Mood; wave?: boolean } & Box) {
  return <svg viewBox="0 0 200 160" className={className} style={style} aria-hidden="true" dangerouslySetInnerHTML={{ __html: dundunSVG(mood, wave) }} />
}

export function Friend({ kind, mood = 'neutral', color, wave, className, style }: { kind: Kind; mood?: Mood; color?: Color; wave?: boolean } & Box) {
  return <svg viewBox="-6 -20 132 166" className={className} style={style} aria-hidden="true" dangerouslySetInnerHTML={{ __html: friendSVG(kind, mood, color, wave) }} />
}

export function WeatherIcon({ w, className, style }: { w: Weather } & Box) {
  return <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden="true" dangerouslySetInnerHTML={{ __html: weatherSVG(w) }} />
}

export function GameArt({ id, className, style }: { id: string } & Box) {
  const art = GAME_ART[id]
  return <svg viewBox="0 0 200 160" className={className} style={style} aria-hidden="true" dangerouslySetInnerHTML={{ __html: art ? art() : dundunSVG('happy') }} />
}

/* 별 스티커 (gold = 진짜 습관 같은 특별 스티커) */
export function StarSticker({ gold = false, className, style }: { gold?: boolean } & Box) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const r = i % 2 ? 19 : 42
    return `${50 + Math.cos(a) * r},${52 + Math.sin(a) * r}`
  }).join(' ')
  return (
    <svg viewBox="0 0 100 100" className={className} style={style} aria-hidden="true">
      <polygon points={pts} fill={gold ? '#F7C531' : '#FFD84D'} stroke={gold ? '#B8860B' : OUT} strokeWidth={gold ? 4 : 3} strokeLinejoin="round" />
      {gold && <polygon points={pts} fill="none" stroke="#FFF6C8" strokeWidth="2" strokeLinejoin="round" transform="translate(50 52) scale(.72) translate(-50 -52)" />}
      <path d="M40 48 L40 50 M60 48 L60 50" stroke={OUT} strokeWidth="5" strokeLinecap="round" />
      <path d="M43 58 Q50 64 57 58" fill="none" stroke={OUT} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/* 기분 카드용 동그란 얼굴 */
export function EmotionFace({ mood, className }: { mood: Mood; className?: string }) {
  const html = `<circle cx="50" cy="50" r="40" fill="#FFF4E2" ${st(3)}/>` + face(36, 64, 46, 7, 64, mood)
  return <svg viewBox="0 0 100 100" className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
}

/** 그림 문자 또는 직접 그린 소품(svg:이름) */
export function Glyph({ icon, className, style }: { icon: string } & Box) {
  if (icon.startsWith('svg:'))
    return (
      <span className={'glyph ' + (className || '')} style={style}>
        <svg viewBox="0 0 100 100" width="1em" height="1em" aria-hidden="true" dangerouslySetInnerHTML={{ __html: CUSTOM_ICONS[icon.slice(4)] || '' }} />
      </span>
    )
  return <span className={'glyph ' + (className || '')} style={style}>{icon}</span>
}

export type { Kind, Mood, Weather }
export { PALETTE, KIND_COLORS } from './svg'
