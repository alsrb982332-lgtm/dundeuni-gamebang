import css from './banjjak.module.css'

/* 클래스 이름 → CSS Modules 이름. 이 게임 파일에 없는 이름(screen, ask, icon 등 게임방 공통)은 그대로 둠 */
export function cx(...parts: (string | false | null | undefined)[]) {
  return parts
    .filter(Boolean)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => css[n] ?? n)
    .join(' ')
}
export { css }
