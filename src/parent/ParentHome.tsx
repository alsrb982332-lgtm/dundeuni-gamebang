import { Tap } from '../shared/Tap'
import { useGo } from '../kids-mode/BackGuard'
import { lockParent } from './access'

/* 부모 설정 (7단계에서 채움) */
export function ParentHome() {
  const go = useGo()
  return (
    <div className="overlay">
      <div className="sheet">
        <div className="sheet-head">
          <h2>⚙️ 어른 설정</h2>
          <Tap className="icon small" aria-label="닫기" onTap={() => { lockParent(); go('/main') }}>✕</Tap>
        </div>
        <p className="note">준비 중이에요.</p>
      </div>
    </div>
  )
}
