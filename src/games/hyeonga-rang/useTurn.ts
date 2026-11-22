import { useState } from 'react'
import type { Role } from './progress'

/* 차례 정하기 (번갈아 가며) */
export function useTurn(first: Role = 'hyeong') {
  const [turn, setTurn] = useState<Role>(first)
  const next = () => setTurn((t) => (t === 'hyeong' ? 'dong' : 'hyeong'))
  return { turn, next, setTurn }
}
