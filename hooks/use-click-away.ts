import { useEffect, useRef } from "react"

export function useClickAway(cb: () => void) {
  const ref = useRef<any>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target)) {
        cb()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [cb])

  return ref
}
