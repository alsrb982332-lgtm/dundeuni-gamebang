/* 부모 화면 열림 표시 (어른 확인을 통과한 뒤에만 부모 화면에 들어갈 수 있음, 새로고침하면 다시 잠김) */
let open = false
export const unlockParent = () => { open = true }
export const lockParent = () => { open = false }
export const isParentOpen = () => open
