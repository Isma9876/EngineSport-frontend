import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import useApi from '../../hooks/useApi.js'
import Cargando from '../../components/Cargando.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatoPrecio } from '../../utils/formato.js'
import Resumen, { ErrorFuente } from './inicio/Resumen.jsx'
import RequiereAtencion from './inicio/RequiereAtencion.jsx'

const GraficoVentas = lazy(() => import('./inicio/GraficoVentas.jsx'))

const MESES_LARGO = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

const HOY = new Date()

function VentasDelMes({ fuente }) {
  const mes = HOY.getMonth() + 1
  return (
    <Resumen titulo="Ventas del mes" fuente={fuente}>
      {(datos) => {
        // Postgres devuelve SUM/COUNT como texto y solo los meses con ventas
        const fila = (datos?.ventas_por_mes ?? []).find((r) => Number(r.mes) === mes)
        const pedidos = Number(fila?.cantidad_pedidos ?? 0)
        return (
          <>
            <p className="font-titulo text-3xl font-extrabold">{formatoPrecio(fila?.total_vendido ?? 0)}</p>
            <p className="mt-1 text-xs text-texto-suave">
              {pedidos} {pedidos === 1 ? 'pedido' : 'pedidos'} en {MESES_LARGO[mes - 1]} (pagados y enviados)
            </p>
          </>
        )
      }}
    </Resumen>
  )
}

function PedidosPorAtender({ fuente }) {
  return (
    <Resumen titulo="Pedidos por atender" fuente={fuente} esValido={Array.isArray}>
      {(pedidos) => {
        const pagados = pedidos.filter((p) => p.estado === 'pagado').length
        const pendientes = pedidos.filter((p) => p.estado === 'pendiente').length
        return (
          <>
            <p className="font-titulo text-3xl font-extrabold">{pagados}</p>
            <p className="mt-1 text-xs text-texto-suave">
              {pagados === 1 ? 'pedido pagado, por enviar' : 'pedidos pagados, por enviar'}
              {' · '}
              {pendientes} esperando pago
            </p>
            <Link to="/admin/pedidos" className="mt-2 inline-block text-sm font-semibold text-primario-oscuro underline">
              Ver pedidos
            </Link>
          </>
        )
      }}
    </Resumen>
  )
}

function Existencias({ fuente }) {
  return (
    <Resumen titulo="Pocas unidades o agotados" fuente={fuente}>
      {(datos) => {
        const bajo = Number(datos?.variantes_bajo_stock_minimo ?? 0)
        const agotadas = (datos?.inventario_completo ?? []).filter((v) => Number(v.stock) <= 0).length
        return (
          <>
            <p className="font-titulo text-3xl font-extrabold">{bajo}</p>
            <p className="mt-1 text-xs text-texto-suave">
              {bajo === 1 ? 'variante en o bajo su stock mínimo' : 'variantes en o bajo su stock mínimo'}
              {' · '}
              {agotadas} {agotadas === 1 ? 'agotada' : 'agotadas'}
            </p>
            <Link to="/admin/reportes?seccion=existencias" className="mt-2 inline-block text-sm font-semibold text-primario-oscuro underline">
              Ver detalle
            </Link>
          </>
        )
      }}
    </Resumen>
  )
}

function VentasPorMes({ fuente }) {
  const { datos, cargando, error, recargar } = fuente
  return (
    <section aria-labelledby="ventas-anio" className="rounded-xl border border-borde bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="ventas-anio" className="font-titulo text-xl font-extrabold uppercase">
          Ventas de {HOY.getFullYear()}
        </h2>
        <Link to="/admin/reportes" className="text-sm font-semibold text-primario-oscuro underline">
          Ver reportes
        </Link>
      </div>
      <div className="mt-3">
        {cargando ? (
          <Cargando texto="Cargando..." />
        ) : error ? (
          <ErrorFuente error={error} recargar={recargar} />
        ) : (
          <Suspense fallback={<Cargando texto="Cargando gráfico..." />}>
            <GraficoVentas filas={datos?.ventas_por_mes ?? []} />
          </Suspense>
        )}
      </div>
    </section>
  )
}

export default function Admin() {
  const { usuario } = useAuth()
  const nombre = usuario?.nombre?.split(' ')[0]
  const fechaLarga = HOY.toLocaleDateString('es-GT', { dateStyle: 'full' })
  const fechaHoy = fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1)

  // Cada fuente se pide una sola vez y se comparte entre tarjetas, lista y gráfico
  const ventas = useApi(`/api/reportes/ventas-mensuales?anio=${HOY.getFullYear()}`)
  const pedidos = useApi('/api/pedidos')
  const existencias = useApi('/api/reportes/estado-existencias')
  const cupones = useApi('/api/cupones')

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-titulo text-3xl font-extrabold uppercase">{nombre ? `Hola, ${nombre}` : 'Hola de nuevo'}</h1>
        <p className="mt-1 text-sm text-texto-suave">{fechaHoy}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <VentasDelMes fuente={ventas} />
        <PedidosPorAtender fuente={pedidos} />
        <Existencias fuente={existencias} />
      </div>

      <RequiereAtencion pedidos={pedidos} existencias={existencias} cupones={cupones} />

      <VentasPorMes fuente={ventas} />
    </div>
  )
}
