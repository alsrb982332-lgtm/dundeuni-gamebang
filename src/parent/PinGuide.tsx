import { useState } from 'react'
import { Tap } from '../shared/Tap'
import { deviceKind } from '../kids-mode/device'
import { useGo } from '../kids-mode/BackGuard'
import { isParentOpen } from './access'
import css from './parent.module.css'

/* 태블릿 화면 고정 설정 방법 (안드로이드 「앱 고정」 / 아이패드 「사용법 유도」)
   접속한 기기를 판별해서 맞는 안내를 먼저 보여 줌. 그림은 간단한 SVG 도식 */
type Tab = 'android' | 'ipad'

export function PinGuide() {
  const go = useGo()
  const kind = deviceKind()
  const auto: Tab = kind === 'ipad' || kind === 'iphone' ? 'ipad' : 'android'
  const [tab, setTab] = useState<Tab>(auto)
  const detected = kind === 'android' ? '안드로이드 기기' : kind === 'ipad' ? '아이패드' : kind === 'iphone' ? '아이폰' : null

  return (
    <div className={css.page} role="dialog" aria-modal="true" aria-label="화면 고정 설정 방법">
      <div className={css.sheet}>
        <div className={css.head}>
          <h2>📌 화면 고정 설정 방법</h2>
          <Tap className="icon small" aria-label="닫기" onTap={() => go(isParentOpen() ? '/parent' : '/')}>✕</Tap>
        </div>
        <div className={css.body} data-scroll>
          {detected && <span className={css.detected}>지금 기기: {detected}</span>}
          <p className="note">웹 앱은 스스로 태블릿을 잠글 수 없어요. 태블릿에 있는 기능을 켜 두면 아이가 게임방 밖으로 나가지 못해요.</p>
          <div className={'seg ' + css.tabs}>
            <Tap aria-pressed={tab === 'android'} onTap={() => setTab('android')}>🤖 안드로이드 (갤럭시 탭 등)</Tap>
            <Tap aria-pressed={tab === 'ipad'} onTap={() => setTab('ipad')}>🍎 아이패드</Tap>
          </div>
          {tab === 'android' ? <Android /> : <IPad />}
          <p className={css.hint}>OS 버전에 따라 메뉴 이름이 조금 다를 수 있어요.</p>
        </div>
      </div>
    </div>
  )
}

function Android() {
  return (
    <>
      <h3>「앱 고정」 켜기</h3>
      <AndroidDiagram />
      <ol className={css.steps}>
        <li><b>설정 → 보안 및 개인정보 보호 → 기타 보안 설정 → 앱 고정</b>을 켜요. (기종에 따라 「설정 → 보안 → 앱 고정」)</li>
        <li>「<b>고정 해제 전 잠금 화면 열기</b>」도 켜요. → 아이가 풀 수 없어요.</li>
        <li>든든이 게임방을 연 상태에서 <b>최근 앱 버튼</b>(▥)을 눌러요 → 게임방 <b>아이콘</b>을 탭 → 「<b>이 앱 고정</b>」.</li>
        <li>풀 때: <b>뒤로 가기 + 최근 앱 버튼을 동시에 길게</b> 누르기 → 잠금 화면 해제.</li>
      </ol>
    </>
  )
}

function IPad() {
  return (
    <>
      <h3>「사용법 유도」 켜기</h3>
      <IPadDiagram />
      <ol className={css.steps}>
        <li><b>설정 → 손쉬운 사용 → 사용법 유도</b>를 켜요.</li>
        <li>「<b>암호 설정</b>」에서 사용법 유도 전용 암호를 정해요.</li>
        <li>(선택) 「<b>시간 제한</b>」을 켜면 정해진 시간이 지나면 자동으로 잠겨요.</li>
        <li>든든이 게임방을 연 상태에서 <b>상단(또는 홈) 버튼을 빠르게 3번</b> 눌러요 → 「<b>시작</b>」.</li>
        <li>풀 때: 같은 버튼 <b>3번</b> → 암호 입력 → 「<b>종료</b>」.</li>
      </ol>
    </>
  )
}

/* 안드로이드: 최근 앱 화면에서 아이콘 → 「이 앱 고정」 */
function AndroidDiagram() {
  return (
    <svg className={css.diagram} viewBox="0 0 520 260" aria-hidden="true">
      <rect x="10" y="10" width="300" height="230" rx="22" fill="var(--sheet)" stroke="#3B3651" strokeWidth="5" />
      <rect x="60" y="40" width="200" height="140" rx="14" fill="#E4F7D8" stroke="#56B266" strokeWidth="4" />
      <circle cx="84" cy="64" r="16" fill="#7DD08A" stroke="#3B3651" strokeWidth="3" />
      <rect x="110" y="80" width="140" height="74" rx="10" fill="#fff" stroke="#3B3651" strokeWidth="3" />
      <text x="180" y="110" textAnchor="middle" fontSize="16" fill="#3B3651">앱 정보</text>
      <rect x="118" y="120" width="124" height="28" rx="8" fill="#FFCB2F" />
      <text x="180" y="140" textAnchor="middle" fontSize="16" fill="#1F2A44">이 앱 고정</text>
      <g transform="translate(0 4)">
        <rect x="88" y="196" width="22" height="22" rx="3" fill="none" stroke="#EE8420" strokeWidth="4" />
        <path d="M95 196 v22 M103 196 v22" stroke="#EE8420" strokeWidth="3" />
        <circle cx="160" cy="207" r="11" fill="none" stroke="#3B3651" strokeWidth="3" />
        <path d="M222 198 l-10 9 10 9" fill="none" stroke="#3B3651" strokeWidth="4" strokeLinecap="round" />
      </g>
      <text x="99" y="252" textAnchor="middle" fontSize="15" fill="#EE8420">최근 앱</text>
      <path d="M330 70 h40" stroke="#3B3651" strokeWidth="4" markerEnd="url(#ar)" />
      <defs><marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#3B3651" /></marker></defs>
      <text x="390" y="60" fontSize="17" fill="#3B3651">① 최근 앱 버튼</text>
      <text x="390" y="92" fontSize="17" fill="#3B3651">② 게임방 아이콘</text>
      <text x="390" y="124" fontSize="17" fill="#3B3651">③ 이 앱 고정</text>
      <text x="390" y="176" fontSize="15" fill="#5D6B85">풀 때:</text>
      <text x="390" y="200" fontSize="15" fill="#5D6B85">뒤로 + 최근 앱</text>
      <text x="390" y="222" fontSize="15" fill="#5D6B85">동시에 길게</text>
    </svg>
  )
}

/* 아이패드: 상단(또는 홈) 버튼 3번 */
function IPadDiagram() {
  return (
    <svg className={css.diagram} viewBox="0 0 520 260" aria-hidden="true">
      <rect x="40" y="30" width="300" height="210" rx="24" fill="var(--sheet)" stroke="#3B3651" strokeWidth="5" />
      <rect x="62" y="52" width="256" height="166" rx="10" fill="#E4F7D8" stroke="#56B266" strokeWidth="3" />
      <circle cx="190" cy="120" r="26" fill="#7DD08A" stroke="#3B3651" strokeWidth="3" />
      <text x="190" y="176" textAnchor="middle" fontSize="16" fill="#3B3651">든든이 게임방</text>
      <rect x="270" y="20" width="50" height="10" rx="5" fill="#EE8420" />
      <text x="295" y="14" textAnchor="middle" fontSize="15" fill="#EE8420">상단 버튼</text>
      {[0, 1, 2].map((i) => <circle key={i} cx={356 + i * 30} cy={26} r="10" fill="#FFCB2F" stroke="#3B3651" strokeWidth="2" />)}
      <text x="386" y="62" textAnchor="middle" fontSize="18" fill="#3B3651">빠르게 3번</text>
      <text x="360" y="120" fontSize="17" fill="#3B3651">→ 「시작」</text>
      <text x="360" y="176" fontSize="15" fill="#5D6B85">풀 때: 3번 →</text>
      <text x="360" y="200" fontSize="15" fill="#5D6B85">암호 → 「종료」</text>
    </svg>
  )
}
