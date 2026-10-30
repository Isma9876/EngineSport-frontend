import { Link } from 'react-router-dom'
import useApi from '../../hooks/useApi.js'
import Cargando from '../../components/Cargando.jsx'
import { formatoPrecio } from '../../utils/formato.js'
import { menuAdmin } from './menu.js'

const MESES_LARGO = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

// Accesos rápidos: la ruta y el texto salen de menu.js; aquí solo la descripción.
const ACCESOS = [
  ['/admin/productos', 'Catálogo, precios y variantes.'],
  ['/admin/pedidos', 'Revisa y gestiona los pedidos.'],
  ['/admin/cupones', 'Crea y administra descuentos.'],
  ['/admin/reportes', 'Ventas, inventario y más vendidos.'],
]

// Cada tarjeta pide sus datos por separado: si una falla, las demás siguen.
// `esValido` (opcional) revisa la forma de la respuesta; si no cumple, se trata como error.
function Resumen({ titulo, ruta, esValido, children }) {
  const respuesta = useApi(ruta)
  const { datos, cargando, recargar } = respuesta
  const error =
    respuesta.error ??
    (!cargando && esValido && !esValido(datos) ? { message: 'Respuesta inesperada del servidor.' } : null)
  return (
    <section className="rounded-xl border border-borde border-t-4 border-t-primario bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-texto-suave">{titulo}</h2>
      <div className="mt-2">
        {cargando ? (
          <Cargando texto="Cargando..." />
        ) : error ? (
          <p className="rounded-lg border border-primario px-3 py-2 text-sm" role="alert">
            {error.message}{' '}
            <button type="button" onClick={recargar} className="font-semibold underline">
              Reintentar
            </button>
          </p>
        ) : (
          children(datos)
        )}
      </div>
    </section>
  )
}

const HOY = new Date()

function VentasDelMes() {
  const mes = HOY.getMonth() + 1
  return (
    <Resumen titulo="Ventas del mes" ruta={`/api/reportes/ventas-mensuales?anio=${HOY.getFullYear()}`}>
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

function PedidosPorAtender() {
  return (
    <Resumen titulo="Pedidos por atender" ruta="/api/pedidos" esValido={Array.isArray}>
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

function Existencias() {
  return (
    <Resumen titulo="Pocas unidades o agotados" ruta="/api/reportes/estado-existencias">
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

export default function Admin() {
  const accesos = ACCESOS.map(([ruta, descripcion]) => ({
    ...menuAdmin.find((m) => m.ruta === ruta),
    ruta,
    descripcion,
  })).filter((a) => a.texto)

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-titulo text-3xl font-extrabold uppercase">Administración</h1>
        <p className="mt-1 text-sm text-texto-suave">Resumen de la tienda y accesos rápidos.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <VentasDelMes />
        <PedidosPorAtender />
        <Existencias />
      </div>

      <section aria-labelledby="accesos">
        <h2 id="accesos" className="font-titulo text-xl font-extrabold uppercase">
          Accesos rápidos
        </h2>
        <ul className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {accesos.map((a) => (
            <li key={a.ruta}>
              <Link
                to={a.ruta}
                className="block h-full rounded-xl border border-borde bg-white p-5 hover:border-primario focus-visible:outline-2 focus-visible:outline-primario"
              >
                <span className="font-titulo text-lg font-bold uppercase">{a.texto}</span>
                <span className="mt-1 block text-sm text-texto-suave">{a.descripcion}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
