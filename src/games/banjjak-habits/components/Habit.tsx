import { cx } from '../cx'
import type { CSSProperties, ReactNode } from 'react'
import { Dundun, Glyph, type Mood } from '../../../shared/art/Art'
import type { SceneId, Step } from '../data/habits'

/* 단계 그림: 그림 문자 또는 직접 그린 소품 (svg:toothbrush, svg:towel, svg:bubble, svg:slide) */
export function StepIcon({ icon, className, style }: { icon: string; className?: string; style?: CSSProperties }) {
  return <Glyph icon={icon} className={cx('sicon ' + (className || ''))} style={style} />
}

/* 든든이가 단계 행동을 하는 무대 */
const MOOD: Record<string, Mood> = { sleep: 'sleepy', eat: 'joy', say: 'joy' }
export function DundunStage({ step, playing, sparkle, bubble, children, scene, overlay }: { step?: Step | null; playing: number; sparkle?: boolean; bubble?: string; children?: ReactNode; scene?: SceneId; overlay?: ReactNode }) {
  const act = step?.act || 'none'
  return (
    <div className={cx('dstage' + (scene ? ' scene-' + scene : '') + (sparkle ? ' sparkle' : '') + (act === 'sleep' && playing ? ' night' : '') + (overlay ? ' doing' : ''))}>
      {scene && <SceneDeco scene={scene} />}
      {overlay}
      {!overlay && <div className={cx('dun-wrap' + (playing ? ' act-' + act : ''))} key={'d' + playing}>
        <Dundun mood={sparkle ? 'joy' : playing ? MOOD[act] || 'happy' : 'happy'} wave={!!sparkle} />
      </div>}
      {!overlay && step && playing > 0 && (
        <div className={cx('prop act-' + act)} key={'p' + playing}>
          <StepIcon icon={step.icon} />
          {act === 'pour' && <span className={cx('fx drops')}>💧💧💧</span>}
          {act === 'bubbles' && <span className={cx('fx bubbles')}><Glyph icon="svg:bubble" /><Glyph icon="svg:bubble" /></span>}
          {act === 'sleep' && <span className={cx('fx zzz')}>💤</span>}
          {act === 'scrub' && <span className={cx('fx shine')}>✨</span>}
        </div>
      )}
      {bubble && <div className={cx('speech')} key={bubble}>{bubble}</div>}
      {sparkle && (
        <div className={cx('twinkles')} aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => <span key={i} style={{ '--i': i, left: 6 + i * 10.5 + '%', top: 8 + ((i * 37) % 70) + '%' } as CSSProperties}>✨</span>)}
        </div>
      )}
      {children}
    </div>
  )
}

/* 별 모양 습관 스티커 (놀이 = 흰색, 진짜 = 금색) */
export function HabitSticker({ icon, gold, className, style }: { icon: string; gold?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <span className={cx('hsticker' + (gold ? ' gold' : '') + (className ? ' ' + className : ''))} style={style}>
      <StepIcon icon={icon} />
      {gold && <span className={cx('crown')}>⭐</span>}
    </span>
  )
}

/* 습관마다 다른 배경 그림 (욕실 · 침실 · 밤 · 부엌 · 놀이방 · 현관 · 거실) — 무대 뒤에 깔림 */
const DECO: Record<SceneId, string> = {
  bathroom:
    '<rect x="276" y="22" width="92" height="74" rx="18" fill="#DFF3FF" stroke="#9CC9E6" stroke-width="5"/><path d="M292 40 l18 -10 M300 56 l26 -16" stroke="#fff" stroke-width="6" stroke-linecap="round"/>' +
    '<rect x="284" y="118" width="76" height="22" rx="8" fill="#fff" stroke="#9CC9E6" stroke-width="4"/><path d="M322 118 v-14 h10" fill="none" stroke="#9CC9E6" stroke-width="5" stroke-linecap="round"/>' +
    '<circle cx="40" cy="60" r="12" fill="rgba(255,255,255,.75)" stroke="#BFE3FA" stroke-width="3"/><circle cx="62" cy="40" r="7" fill="rgba(255,255,255,.75)" stroke="#BFE3FA" stroke-width="3"/>',
  bedroom:
    '<rect x="270" y="20" width="104" height="86" rx="12" fill="#CFEFFF" stroke="#E8B98A" stroke-width="7"/><circle cx="342" cy="50" r="16" fill="#FFD84D"/><path d="M290 88 q12 -16 26 -4 q10 -10 22 2 Z" fill="#fff"/><path d="M322 20 v86 M270 63 h104" stroke="#E8B98A" stroke-width="5"/>' +
    '<rect x="16" y="146" width="120" height="44" rx="14" fill="#FFC9D8"/><rect x="16" y="130" width="40" height="26" rx="10" fill="#fff"/>',
  night:
    '<rect x="270" y="20" width="104" height="86" rx="12" fill="#3C4A8C" stroke="#B49AE0" stroke-width="7"/><path d="M344 42 a16 16 0 1 0 12 26 a13 13 0 1 1 -12 -26 Z" fill="#FFE27A"/><g fill="#fff"><circle cx="292" cy="40" r="2.5"/><circle cx="306" cy="78" r="2"/><circle cx="360" cy="88" r="2.5"/></g>' +
    '<path d="M40 40 h36 l-8 26 h-20 Z" fill="#FFE9A8"/><rect x="54" y="66" width="8" height="70" fill="#C9A35E"/><circle cx="58" cy="54" r="40" fill="rgba(255,233,168,.18)"/>',
  kitchen:
    '<g fill="#fff" stroke="#E6C46A" stroke-width="4"><rect x="40" y="30" width="120" height="16" rx="6"/></g><text x="56" y="28" font-size="26">🥛🍎🍪</text>' +
    '<rect x="230" y="150" width="160" height="16" rx="6" fill="#E8B98A"/><path d="M230 158 h160" stroke="#fff" stroke-width="4" stroke-dasharray="10 10"/>',
  playroom:
    '<rect x="20" y="30" width="110" height="80" rx="10" fill="#FFE4B8" stroke="#E5A85F" stroke-width="5"/><path d="M20 70 h110" stroke="#E5A85F" stroke-width="5"/><text x="30" y="64" font-size="26">🧸🚂</text><text x="30" y="102" font-size="26">🎨🧩</text>' +
    '<ellipse cx="300" cy="172" rx="90" ry="18" fill="#C9E6B9"/>',
  entrance:
    '<rect x="290" y="20" width="84" height="150" rx="10" fill="#C98E5C" stroke="#9A6538" stroke-width="5"/><circle cx="356" cy="100" r="6" fill="#FFD84D"/><rect x="304" y="36" width="56" height="40" rx="6" fill="#E3B48A"/>' +
    '<rect x="20" y="140" width="110" height="34" rx="6" fill="#E8D2B0"/><text x="28" y="168" font-size="22">👟👢</text>',
  living:
    '<rect x="230" y="104" width="150" height="56" rx="20" fill="#9CCBF2"/><rect x="242" y="84" width="126" height="36" rx="14" fill="#B8DBF7"/>' +
    '<rect x="40" y="110" width="26" height="40" rx="6" fill="#E5A85F"/><circle cx="53" cy="92" r="24" fill="#8FD18A"/><circle cx="40" cy="80" r="14" fill="#7DC77A"/>',
}
function SceneDeco({ scene }: { scene: SceneId }) {
  return <svg className={cx('scene-deco')} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" dangerouslySetInnerHTML={{ __html: DECO[scene] || '' }} />
}
