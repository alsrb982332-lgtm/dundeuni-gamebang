import { useEffect, useRef } from 'react'
import { stopVoice } from './useVoice'

/* 화면이 바뀌면 진행 중이던 안내·타이머가 이어지지 않도록 막는 도우미.
   const alive = useAlive();  await say(...); if (!alive()) return; */
export function useAlive() {
  const on = useRef(true)
  useEffect(() => {
    on.current = true
    return () => { on.current = false; stopVoice() }
  }, [])
  return () => on.current
}
