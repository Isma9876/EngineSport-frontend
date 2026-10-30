import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const MARGEN = 8
const HUECO = 4

// Solo un menú abierto a la vez en la página: el que abre cierra al anterior
let cerrarActivo = null

const claseOpcion =
  'block w-full px-3 py-2 text-left text-sm font-semibold hover:bg-superficie focus:bg-superficie focus:outline-none disabled:opacity-40 disabled:hover:bg-transparent'

// Botón "Acciones" con menú desplegable. opciones: [{ etiqueta, onClick, deshabilitada?, peligrosa? }]
// Las peligrosas van al final, separadas y en rojo. El menú se dibuja en un portal con
// position: fixed para que el overflow de la tabla no lo corte.
export default function MenuAcciones({ opciones, etiqueta = 'Acciones' }) {
  const [abierto, setAbierto] = useState(false)
  const [pos, setPos] = useState(null)
  const botonRef = useRef(null)
  const menuRef = useRef(null)
  const idMenu = useId()

  const normales = opciones.filter((o) => !o.peligrosa)
  const peligrosas = opciones.filter((o) => o.peligrosa)

  const cerrar = useCallback(() => {
    setAbierto(false)
    setPos(null)
    if (cerrarActivo === cerrar) cerrarActivo = null
  }, [])

  function alternar() {
    if (abierto) return cerrar()
    if (cerrarActivo) cerrarActivo()
    cerrarActivo = cerrar
    setAbierto(true)
  }

  // Calcula la posición con el tamaño real del menú, antes de pintar
  useLayoutEffect(() => {
    if (!abierto || !menuRef.current || !botonRef.current) return
    const b = botonRef.current.getBoundingClientRect()
    const m = menuRef.current.getBoundingClientRect()
    const abajo = window.innerHeight - b.bottom - MARGEN
    const arriba = b.top - MARGEN
    const haciaArriba = m.height > abajo && arriba > abajo
    const top = haciaArriba ? Math.max(MARGEN, b.top - m.height - HUECO) : b.bottom + HUECO
    const left = Math.min(Math.max(MARGEN, b.right - m.width), window.innerWidth - m.width - MARGEN)
    setPos({ top, left, origen: haciaArriba ? 'bottom right' : 'top right' })
  }, [abierto])

  useEffect(() => {
    if (!abierto) return
    const items = () => [...menuRef.current.querySelectorAll('[role="menuitem"]:not(:disabled)')]
    items()[0]?.focus()

    function alPulsar(e) {
      if (!menuRef.current?.contains(e.target) && !botonRef.current?.contains(e.target)) cerrar()
    }
    function alScroll(e) {
      if (menuRef.current?.contains(e.target)) return
      cerrar()
    }
    function alTeclear(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        cerrar()
        botonRef.current?.focus()
      } else if (e.key === 'Tab') {
        cerrar()
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const lista = items()
        if (lista.length === 0) return
        e.preventDefault()
        const i = lista.indexOf(document.activeElement)
        const sig = e.key === 'ArrowDown' ? (i + 1) % lista.length : (i <= 0 ? lista.length - 1 : i - 1)
        lista[sig].focus()
      }
    }

    document.addEventListener('mousedown', alPulsar)
    document.addEventListener('keydown', alTeclear)
    window.addEventListener('scroll', alScroll, true)
    window.addEventListener('resize', cerrar)
    return () => {
      document.removeEventListener('mousedown', alPulsar)
      document.removeEventListener('keydown', alTeclear)
      window.removeEventListener('scroll', alScroll, true)
      window.removeEventListener('resize', cerrar)
    }
  }, [abierto, cerrar])

  // Si la fila desaparece con el menú abierto, no dejar la referencia global colgada
  useEffect(
    () => () => {
      if (cerrarActivo === cerrar) cerrarActivo = null
    },
    [cerrar],
  )

  function elegir(o) {
    cerrar()
    botonRef.current?.focus()
    o.onClick()
  }

  function renderOpcion(o) {
    return (
      <button
        key={o.etiqueta}
        type="button"
        role="menuitem"
        disabled={o.deshabilitada}
        onClick={() => elegir(o)}
        className={`${claseOpcion} ${o.peligrosa ? 'text-estado-error' : ''}`}
      >
        {o.etiqueta}
      </button>
    )
  }

  return (
    <>
      <button
        ref={botonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? idMenu : undefined}
        aria-label={etiqueta}
        onClick={alternar}
        className="inline-flex h-10 w-10 items-center justify-center whitespace-nowrap rounded-lg border border-borde hover:bg-superficie"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
          <circle cx="12" cy="5" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="12" cy="19" r="1.75" />
        </svg>
      </button>
      {abierto &&
        createPortal(
          <div
            ref={menuRef}
            id={idMenu}
            role="menu"
            aria-label={etiqueta}
            style={{
              position: 'fixed',
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              transformOrigin: pos?.origen,
              visibility: pos ? 'visible' : 'hidden',
            }}
            className="z-50 min-w-40 max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg border border-borde bg-white py-1 shadow-lg"
          >
            {normales.map(renderOpcion)}
            {peligrosas.length > 0 && normales.length > 0 && <div role="separator" className="my-1 border-t border-borde" />}
            {peligrosas.map(renderOpcion)}
          </div>,
          document.body,
        )}
    </>
  )
}
