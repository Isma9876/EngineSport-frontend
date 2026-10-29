import { useCallback, useSyncExternalStore } from 'react'

// true mientras se cumpla la media query (p. ej. '(min-width: 1024px)').
export default function useMediaQuery(consulta) {
  const suscribir = useCallback(
    (aviso) => {
      const lista = window.matchMedia(consulta)
      lista.addEventListener('change', aviso)
      return () => lista.removeEventListener('change', aviso)
    },
    [consulta],
  )
  return useSyncExternalStore(
    suscribir,
    () => window.matchMedia(consulta).matches,
    () => false,
  )
}
