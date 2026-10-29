const PASOS = ['Carrito', 'Envío y pago', 'Confirmación']

// actual: 1 = carrito, 2 = envío y pago, 3 = confirmación en curso, 4 = compra completada.
export default function PasosCompra({ actual }) {
  return (
    <ol className="mt-4 flex items-center gap-2 text-sm" aria-label="Progreso de la compra">
      {PASOS.map((texto, i) => {
        const n = i + 1
        const hecho = n < actual
        const activo = n === actual
        return (
          <li key={texto} className="flex items-center gap-2" aria-current={activo ? 'step' : undefined}>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                hecho
                  ? 'bg-estado-disponible text-white'
                  : activo
                    ? 'bg-primario text-white'
                    : 'border border-borde text-texto-suave'
              }`}
            >
              {hecho ? '✓' : n}
            </span>
            <span className={`${activo ? 'font-semibold' : 'hidden text-texto-suave sm:inline'}`}>{texto}</span>
            {n < PASOS.length && <span className="mx-1 h-px w-6 bg-borde sm:w-10" aria-hidden="true" />}
          </li>
        )
      })}
    </ol>
  )
}