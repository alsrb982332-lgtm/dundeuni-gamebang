import type { CSSProperties } from 'react'
import type { Weather } from '../../../shared/art/svg'
import { weatherSVG } from '../../../shared/art/svg'
import fx from './weatherFx.module.css'

/* 기분을 맞혔을 때 장면 전체에 나오는 날씨 효과 (약 3초, 번쩍임 없이 부드럽게)
   해: 햇살이 퍼지며 따뜻해짐 · 비: 빗방울 · 천둥: 먹구름 + 번개가 흔들 · 안개: 안개 띠가 흘러감
   무지개: 무지개가 그려짐 · 구름: 구름이 천천히 지나감 */
const rnd = (i: number, k: number) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1

export function WeatherFx({ w }: { w: Weather }) {
  return (
    <div className={fx.fx + ' ' + fx[w]} aria-hidden="true">
      {w === 'sun' && (
        <>
          <div className={fx.warm} />
          <svg className={fx.sunBig} viewBox="0 0 100 100" dangerouslySetInnerHTML={{ __html: weatherSVG('sun') }} />
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={fx.sparkle} style={{ left: `${10 + rnd(i, 1) * 80}%`, top: `${15 + rnd(i, 2) * 60}%`, animationDelay: `${0.3 + rnd(i, 3) * 1.2}s` } as CSSProperties}>✦</span>
          ))}
        </>
      )}
      {(w === 'rain' || w === 'thunder') && (
        <>
          <div className={fx.dim} />
          {Array.from({ length: 34 }, (_, i) => (
            <i key={i} className={fx.drop} style={{ left: `${rnd(i, 4) * 100}%`, animationDelay: `${rnd(i, 5) * 1.4}s`, animationDuration: `${0.9 + rnd(i, 6) * 0.5}s` } as CSSProperties} />
          ))}
          <svg className={fx.cloudL} viewBox="0 0 100 100" dangerouslySetInnerHTML={{ __html: weatherSVG(w === 'thunder' ? 'thunder' : 'rain') }} />
          <svg className={fx.cloudR} viewBox="0 0 100 100" dangerouslySetInnerHTML={{ __html: weatherSVG(w === 'thunder' ? 'thunder' : 'rain') }} />
        </>
      )}
      {w === 'fog' && [0, 1, 2, 3].map((i) => <div key={i} className={fx.band} style={{ top: `${12 + i * 20}%`, animationDelay: `${i * 0.35}s` } as CSSProperties} />)}
      {w === 'rainbow' && (
        <svg className={fx.arc} viewBox="0 0 200 110">
          {['#FF9A8C', '#FFC36B', '#FFE27A', '#9EDB8E', '#8EC5F5', '#BBA2EE'].map((c, i) => (
            <path key={c} d={`M${10 + i * 9} 105 A${90 - i * 9} ${90 - i * 9} 0 0 1 ${190 - i * 9} 105`} fill="none" stroke={c} strokeWidth="9" strokeLinecap="round" pathLength={1} style={{ animationDelay: `${i * 0.12}s` }} />
          ))}
        </svg>
      )}
      {w === 'cloud' && [0, 1, 2].map((i) => (
        <svg key={i} className={fx.drift} viewBox="0 0 100 100" style={{ top: `${6 + i * 22}%`, animationDelay: `${i * 0.5}s`, width: `${30 - i * 5}%` } as CSSProperties} dangerouslySetInnerHTML={{ __html: weatherSVG('cloud') }} />
      ))}
    </div>
  )
}
