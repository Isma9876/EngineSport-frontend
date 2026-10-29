import { useEffect, useRef, useState } from 'react'
import { formatoPrecio } from '../utils/formato.js'

const ANCHO_CONTROL = '1.25rem'
const limitar = (n, min, max) => Math.min(max, Math.max(min, n))

// Barra de precio de dos extremos (dos <input type="range"> apilados; estilos en
// index.css, clase t-rango). Mientras se arrastra solo cambia lo mostrado: el
// filtro se confirma (onConfirmar) al soltar el control.
export default function RangoPrecio({ min, max, valorMin, valorMax, onConfirmar }) {
  const desde = limitar(valorMin ?? min, min, max)
  const hasta = limitar(valorMax ?? max, min, max)
  const [rango, setRango] = useState({ desde, hasta })
  const [previo, setPrevio] = useState({ desde, hasta })
  if (previo.desde !== desde || previo.hasta !== hasta) {
    // el valor cambió por fuera (quitar filtro, limpiar, atrás/adelante)
    setPrevio({ desde, hasta })
    setRango({ desde, hasta })
  }

  const actual = useRef(rango)
  useEffect(() => {
    actual.current = rango
  }, [rango])
  const confirmar = () => {
    const { desde: d, hasta: h } = actual.current
    if (d !== desde || h !== hasta) onConfirmar(d, h)
  }

  const fraccion = (n) => (n - min) / (max - min)
  // Si ambos extremos coinciden, el de arriba debe ser el que sí puede moverse.
  const minArriba = rango.desde === rango.hasta && rango.desde >= max
  const eventos = { onPointerUp: confirmar, onKeyUp: confirmar, onTouchEnd: confirmar, onBlur: confirmar }

  return (
    <div>
      <p className="text-sm font-medium">
        Precio: {formatoPrecio(rango.desde)} – {formatoPrecio(rango.hasta)}
      </p>
      <div className="t-rango relative mx-auto mt-2 h-5">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-borde" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primario"
          style={{
            left: `calc(${ANCHO_CONTROL} / 2 + ${fraccion(rango.desde)} * (100% - ${ANCHO_CONTROL}))`,
            right: `calc(${ANCHO_CONTROL} / 2 + ${1 - fraccion(rango.hasta)} * (100% - ${ANCHO_CONTROL}))`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={rango.desde}
          aria-label="Precio mínimo"
          aria-valuetext={formatoPrecio(rango.desde)}
          style={{ zIndex: minArriba ? 2 : 1 }}
          onChange={(e) => setRango((r) => ({ ...r, desde: Math.min(Number(e.target.value), r.hasta) }))}
          {...eventos}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={rango.hasta}
          aria-label="Precio máximo"
          aria-valuetext={formatoPrecio(rango.hasta)}
          style={{ zIndex: 1 }}
          onChange={(e) => setRango((r) => ({ ...r, hasta: Math.max(Number(e.target.value), r.desde) }))}
          {...eventos}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-texto-suave">
        <span>{formatoPrecio(min)}</span>
        <span>{formatoPrecio(max)}</span>
      </div>
    </div>
  )
}
