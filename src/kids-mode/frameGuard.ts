/* 1단계 게임(iframe 안의 HTML)에도 실수 조작 막기를 적용
   같은 주소(origin)에 있는 게임이라 바깥에서 안쪽 문서에 직접 넣을 수 있음 — 원본 파일은 고치지 않음 */

const CSS = `
html, body { overscroll-behavior: none !important; -webkit-user-select: none; user-select: none;
  -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; -webkit-text-size-adjust: 100% }
img, svg { -webkit-user-drag: none }
input, textarea { -webkit-user-select: text; user-select: text }
`

const isField = (t: EventTarget | null) => {
  const el = t as Element | null
  return !!el && typeof el.closest === 'function' && !!el.closest('input, textarea, select, [contenteditable="true"]')
}

export function guardFrame(frame: HTMLIFrameElement) {
  let doc: Document | null = null
  try { doc = frame.contentDocument } catch { return }
  if (!doc || (doc as Document & { __ddGuard?: boolean }).__ddGuard) return
  ;(doc as Document & { __ddGuard?: boolean }).__ddGuard = true

  const style = doc.createElement('style')
  style.textContent = CSS
  doc.head?.appendChild(style)

  const opt = { passive: false, capture: true } as AddEventListenerOptions
  /* 두 손가락 확대 (누르기는 그대로라 두 아이 동시 누르기는 됨) */
  doc.addEventListener('touchmove', (e) => {
    const sc = (e as TouchEvent & { scale?: number }).scale
    if ((e as TouchEvent).touches.length > 1 || (sc !== undefined && sc !== 1)) e.preventDefault()
  }, opt)
  for (const t of ['gesturestart', 'gesturechange', 'gestureend']) doc.addEventListener(t, (e) => e.preventDefault(), opt)
  doc.addEventListener('dblclick', (e) => e.preventDefault(), opt)
  doc.addEventListener('contextmenu', (e) => { if (!isField(e.target)) e.preventDefault() }, opt)
  doc.addEventListener('selectstart', (e) => { if (!isField(e.target)) e.preventDefault() }, opt)
  doc.addEventListener('dragstart', (e) => { if ((e.target as Element)?.tagName === 'IMG') e.preventDefault() }, opt)
  doc.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault() }, opt)
  /* 게임 안의 링크가 다른 곳으로 나가지 않게 */
  doc.addEventListener('click', (e) => {
    const a = (e.target as Element)?.closest?.('a[href]') as HTMLAnchorElement | null
    if (a && /^https?:/i.test(a.getAttribute('href') || '')) e.preventDefault()
  }, opt)
  try { (frame.contentWindow as Window).open = () => null } catch { /* 무시 */ }
}

/** 게임을 닫을 때 안에서 나오던 목소리 멈추기 */
export function hushFrame(frame: HTMLIFrameElement | null) {
  try { frame?.contentWindow?.speechSynthesis?.cancel() } catch { /* 무시 */ }
}
