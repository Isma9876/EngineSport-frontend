import { Link } from 'react-router-dom'
import Cargando from '../../../components/Cargando.jsx'
import { ErrorFuente } from './Resumen.jsx'
import { RUTAS, itemsCupones, itemsExistencias, itemsPedidos } from './atencion.js'

const MAXIMO = 8
const NOMBRES = { pedido: 'pedidos', existencia: 'existencias', cupon: 'cupones' }
const CLASES = {
  pedido: 'bg-sky-100 text-sky-700',
  existencia: 'bg-red-100 text-red-700',
  cupon: 'bg-amber-100 text-amber-800',
}

// Cada fuente carga y falla por separado: lo que sí llegó se muestra, lo que falló avisa y permite reintentar.
export default function RequiereAtencion({ pedidos, existencias, cupones }) {
  const fuentes = [
    { id: 'pedido', nombre: 'los pedidos', fuente: pedidos, valido: Array.isArray(pedidos.datos), items: () => itemsPedidos(pedidos.datos) },
    { id: 'existencia', nombre: 'las existencias', fuente: existencias, valido: Boolean(existencias.datos), items: () => itemsExistencias(existencias.datos) },
    { id: 'cupon', nombre: 'los cupones', fuente: cupones, valido: Array.isArray(cupones.datos), items: () => itemsCupones(cupones.datos) },
  ]

  const items = []
  const fallos = []
  let cargando = false
  for (const f of fuentes) {
    if (f.fuente.cargando) cargando = true
    else if (f.fuente.error || !f.valido)
      fallos.push({ ...f, error: f.fuente.error ?? { message: 'Respuesta inesperada del servidor.' } })
    else items.push(...f.items())
  }

  const visibles = items.slice(0, MAXIMO)
  const resto = items.slice(MAXIMO)
  // El "y N más" enlaza a la pantalla del tipo con más pendientes (empate: el de mayor prioridad)
  const cuenta = {}
  for (const i of items) cuenta[i.tipo] = (cuenta[i.tipo] ?? 0) + 1
  const destino = Object.keys(cuenta).reduce((a, b) => (cuenta[b] > cuenta[a] ? b : a), items[0]?.tipo)

  return (
    <section aria-labelledby="atencion" className="rounded-xl border border-borde bg-white p-5 shadow-sm">
      <h2 id="atencion" className="font-titulo text-xl font-extrabold uppercase">
        Requiere atención
      </h2>

      <div className="mt-3 space-y-3">
        {fallos.map((f) => (
          <ErrorFuente
            key={f.id}
            error={{ message: `No se pudieron cargar ${f.nombre}. ${f.error.message}` }}
            recargar={f.fuente.recargar}
          />
        ))}

        {visibles.length > 0 && (
          <ul className="divide-y divide-borde">
            {visibles.map((i) => (
              <li key={i.clave}>
                <Link
                  to={i.ruta}
                  className="-mx-2 grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 rounded-lg px-2 py-3 transition-colors duration-150 hover:bg-superficie focus-visible:bg-superficie focus-visible:outline-2 focus-visible:outline-primario sm:grid-cols-[7rem_minmax(0,1fr)_auto]"
                >
                  <span className={`w-fit whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${CLASES[i.tipo]}`}>{i.etiqueta}</span>
                  <span className="col-span-2 min-w-0 break-words sm:col-span-1">
                    <span className="block text-sm font-semibold">{i.texto}</span>
                    <span className="block text-xs text-texto-suave">{i.detalle}</span>
                  </span>
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="col-start-2 row-start-1 h-5 w-5 shrink-0 text-texto-suave sm:col-start-3"
                  >
                    <path d="M7.5 4.5 13 10l-5.5 5.5" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {resto.length > 0 && (
          <Link to={RUTAS[destino]} className="inline-block text-sm font-semibold text-primario-oscuro underline">
            y {resto.length} más (ir a {NOMBRES[destino]})
          </Link>
        )}

        {cargando && <Cargando texto="Cargando..." />}

        {!cargando && fallos.length === 0 && items.length === 0 && (
          <p className="rounded-lg bg-superficie px-4 py-6 text-center text-sm text-texto-suave">
            <span className="block font-semibold text-texto">Todo al día</span>
            No hay pedidos por enviar, existencias bajas ni cupones por vencer.
          </p>
        )}
      </div>
    </section>
  )
}
