/* 축하 꽃가루 (부드럽게 퍼졌다 사라짐, 번쩍임 없음) */
export function confetti(emojis = ['⭐', '💛', '✨', '🌟']) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const cx = innerWidth / 2
  const cy = innerHeight / 2
  for (let i = 0; i < 26; i++) {
    const s = document.createElement('span')
    s.className = 'cf'
    s.textContent = emojis[i % emojis.length]
    const a = Math.random() * Math.PI * 2
    const v = 140 + Math.random() * Math.max(innerWidth, innerHeight) * 0.45
    s.style.left = cx + 'px'
    s.style.top = cy + 'px'
    s.style.setProperty('--x', Math.cos(a) * v + 'px')
    s.style.setProperty('--y', Math.sin(a) * v + 120 + 'px')
    s.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg')
    s.style.setProperty('--d', 1.4 + Math.random() * 0.8 + 's')
    document.body.appendChild(s)
    setTimeout(() => s.remove(), 2400)
  }
}
