import { useMemo, useState } from 'react'
import { Tap } from '../shared/Tap'

/* 어른 확인: 덧셈 답(두 자리)을 숫자로 골라야 열림 → 아이가 우연히 열기 어려움
   출처: legacy/maeum-nalssi/src/components/ParentGate.tsx (2026-11-22 복사) */
export function ParentGate({ onPass, onClose, why = '설정은 어른만 열 수 있어요.' }: { onPass: () => void; onClose: () => void; why?: string }) {
  const [a, b] = useMemo(() => [6 + Math.floor(Math.random() * 4), 5 + Math.floor(Math.random() * 5)], [])
  const [ans, setAns] = useState('')
  const [shake, setShake] = useState(false)
  const press = (d: string) => {
    if (d === '←') return setAns((s) => s.slice(0, -1))
    const next = (ans + d).slice(0, 2)
    setAns(next)
    if (next.length === 2) {
      if (+next === a + b) onPass()
      else {
        setShake(true)
        setTimeout(() => { setShake(false); setAns('') }, 450)
      }
    }
  }
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="어른 확인">
      <div className="sheet gate">
        <div className="sheet-head" style={{ width: '100%' }}>
          <h2>🔒 어른 확인</h2>
          <Tap className="icon small" aria-label="닫기" onTap={onClose}>✕</Tap>
        </div>
        <p className="note">{why} 답을 눌러 주세요.</p>
        <div className="q">{a} + {b} = ?</div>
        <div className={'ans' + (shake ? ' shake' : '')}>{ans || ' '}</div>
        <div className="pad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '←'].map((d, i) =>
            d ? <Tap key={i} onTap={() => press(d)}>{d}</Tap> : <span key={i} />,
          )}
        </div>
      </div>
    </div>
  )
}
