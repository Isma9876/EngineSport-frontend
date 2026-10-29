import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import useApi from '../hooks/useApi.js'
import Cargando from '../components/Cargando.jsx'
import TarjetaProducto from '../components/TarjetaProducto.jsx'

const subtitulo = 'font-titulo text-2xl font-extrabold uppercase'
const MAX_CATEGORIAS = 6

const BENEFICIOS = [
  { titulo: 'Pago con tarjeta', texto: 'Paga en línea de forma segura con Stripe.' },
  { titulo: 'Seguimiento de pedidos', texto: 'Revisa el estado de cada pedido desde tu cuenta.' },
  { titulo: 'Comprobante en PDF', texto: 'Descarga el comprobante de tus compras cuando lo necesites.' },
]

function ErrorReintento({ mensaje, onReintentar }) {
  return (
    <p role="alert" className="mt-3 text-sm text-primario-oscuro">
      {mensaje}{' '}
      <button onClick={onReintentar} className="underline">
        Reintentar
      </button>
    </p>
  )
}

function Categorias() {
  const { datos, error, cargando, recargar } = useApi('/api/categorias')
  const principales = (Array.isArray(datos) ? datos : [])
    .filter((c) => c.id_categoria_padre == null)
    .slice(0, MAX_CATEGORIAS)

  if (!cargando && !error && principales.length === 0) return null

  return (
    <section>
      <h2 className={subtitulo}>Categorías</h2>
      {cargando && <Cargando texto="Cargando categorías..." />}
      {error && <ErrorReintento mensaje={error.message} onReintentar={recargar} />}
      {principales.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {principales.map((c) => (
            <li key={c.id}>
              <Link
                to={`/productos?categoria=${c.id}`}
                className="flex h-24 items-center justify-center rounded-lg border border-borde bg-superficie p-3 text-center font-titulo text-xl font-bold uppercase hover:border-primario hover:text-primario focus-visible:outline-2 focus-visible:outline-primario"
              >
                {c.nombre}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Disponibles() {
  const { datos, error, cargando, recargar } = useApi('/api/productos?limit=4&disponible=true')
  const lista = datos?.productos ?? []

  if (!cargando && !error && lista.length === 0) return null

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <h2 className={subtitulo}>Productos disponibles</h2>
        <Link to="/productos" className="shrink-0 whitespace-nowrap text-sm underline">
          Ver todos
        </Link>
      </div>
      {cargando && <Cargando texto="Cargando productos..." />}
      {error && <ErrorReintento mensaje={error.message} onReintentar={recargar} />}
      {lista.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {lista.map((p) => (
            <li key={p.id}>
              <TarjetaProducto producto={p} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function Home() {
  const { usuario } = useAuth()

  // Los empleados entran directo al panel de administración
  if (usuario?.tipo === 'empleado') return <Navigate to="/admin" replace />

  return (
    <div className="space-y-12">
      <section className="rounded-lg bg-secundario px-6 py-12 text-texto-claro sm:px-10 sm:py-16">
        <h1 className="font-titulo text-4xl font-extrabold uppercase leading-tight text-white sm:text-6xl">
          Equípate para <span className="text-primario">rendir</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg">
          Artículos deportivos para entrenar, competir y disfrutar. Encuentra lo que necesitas y págalo en línea.
        </p>
        <Link
          to="/productos"
          className="mt-6 inline-block rounded bg-primario px-6 py-3 font-semibold text-secundario hover:bg-primario-oscuro hover:text-white focus-visible:outline-2 focus-visible:outline-white"
        >
          Ver productos
        </Link>
      </section>

      <Categorias />
      <Disponibles />

      <section>
        <h2 className={subtitulo}>Compra con confianza</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          {BENEFICIOS.map((b) => (
            <li key={b.titulo} className="rounded-lg bg-superficie p-4">
              <h3 className="font-titulo text-lg font-bold uppercase">{b.titulo}</h3>
              <p className="mt-1 text-sm text-texto-suave">{b.texto}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
