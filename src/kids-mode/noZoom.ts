/* 태블릿에서 화면이 잘못 눌려 확대·축소되거나 밀리는 것을 막는 장치
   - 두 손가락 벌리기(핀치) 확대 막기
   - 빠르게 두 번 톡톡 눌러서 확대되는 것 막기
   - 길게 눌러서 메뉴·글자 선택·그림 저장 창이 뜨는 것 막기
   - 화면을 아래로 당겨서 새로고침되는 것 막기
   - 그래도 확대가 되어 버리면 자동으로 원래 크기로 되돌리기
   CSS 쪽(shared/styles/base.css)의 touch-action·overscroll-behavior 설정과 함께 동작해요. */

const VIEWPORT =
  'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'

const isFormField = (t: EventTarget | null) =>
  t instanceof HTMLElement && !!t.closest('input, textarea, select, [contenteditable="true"]')

/* 설정 창처럼 위아래로 밀어서 보는 곳 */
const inScroller = (t: EventTarget | null) => t instanceof Element && !!t.closest('[data-scroll]')

export function installNoZoom() {
  const w = window as Window & { __noZoom?: boolean }
  if (w.__noZoom) return
  w.__noZoom = true

  let meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'viewport'
    document.head.appendChild(meta)
  }
  meta.content = VIEWPORT
  const vp = meta

  const opt = { passive: false, capture: true } as AddEventListenerOptions

  /* 손가락 두 개 이상이 움직이면 확대 동작으로 보고 막음.
     (누르기 이벤트는 그대로 두니까 형제가 동시에 눌러도 둘 다 인식돼요) */
  document.addEventListener(
    'touchmove',
    (e) => {
      const scale = (e as TouchEvent & { scale?: number }).scale
      if (e.touches.length > 1 || (scale !== undefined && scale !== 1)) {
        e.preventDefault()
        return
      }
      /* 밀어서 보는 곳이 아니면 화면이 밀리지 않게 */
      if (!inScroller(e.target) && !isFormField(e.target)) e.preventDefault()
    },
    opt,
  )

  /* 빠르게 두 번 눌러 확대 막기. 게임 버튼은 pointer 이벤트로 동작하므로 영향 없음 */
  let lastEnd = 0
  document.addEventListener(
    'touchend',
    (e) => {
      const now = performance.now()
      if (now - lastEnd < 400 && e.touches.length === 0 && !isFormField(e.target)) e.preventDefault()
      lastEnd = now
    },
    opt,
  )
  document.addEventListener('dblclick', (e) => e.preventDefault(), opt)

  /* 아이패드 사파리용 확대 동작 */
  for (const t of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(t, (e) => e.preventDefault(), opt)

  /* 길게 누르면 뜨는 메뉴, 글자 선택, 그림 끌기 막기 */
  document.addEventListener('contextmenu', (e) => { if (!isFormField(e.target)) e.preventDefault() }, opt)
  document.addEventListener('selectstart', (e) => { if (!isFormField(e.target)) e.preventDefault() }, opt)
  document.addEventListener('dragstart', (e) => e.preventDefault(), opt)

  /* PC: Ctrl + 휠, Ctrl + +/- 확대 막기 */
  document.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault() }, opt)
  document.addEventListener(
    'keydown',
    (e) => {
      if ((e.ctrlKey || e.metaKey) && ['+', '=', '-', '_', '0'].includes(e.key)) e.preventDefault()
    },
    opt,
  )

  /* 그래도 확대가 되어 버렸으면(브라우저 '강제 확대' 설정 등) 원래 크기로 되돌림 */
  const vv = window.visualViewport
  if (vv) {
    let fixing = false
    const check = () => {
      if (fixing || Math.abs(vv.scale - 1) < 0.02) return
      fixing = true
      vp.content = 'width=device-width, initial-scale=1.01, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
      requestAnimationFrame(() => {
        vp.content = VIEWPORT
        window.scrollTo(0, 0)
        fixing = false
      })
    }
    vv.addEventListener('resize', check)
    vv.addEventListener('scroll', check)
  }

  /* 페이지가 밀려 올라가 있으면 제자리로 */
  window.addEventListener('scroll', () => { if (window.scrollX || window.scrollY) window.scrollTo(0, 0) }, { passive: true })
}
