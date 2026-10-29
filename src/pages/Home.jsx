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

// Icono de cada categoría según su nombre; si no se reconoce, una etiqueta genérica.
const ICONOS = [
  { claves: ['calzado', 'tenis', 'zapat', 'bota'], trazos: ['M3 17h18v-3a2 2 0 0 0-1.4-1.9L15 10l-1.5-3H10v4.5L7 12H3z', 'M3 17v2h18v-2'] },
  { claves: ['ropa', 'camis', 'playera', 'short', 'pantal', 'chama'], trazos: ['M8 3 3 6l2 4 3-1.5V21h8V8.5L19 10l2-4-5-3a4 4 0 0 1-8 0z'] },
  { claves: ['equip', 'fitness', 'gimnas', 'pesa', 'entren'], trazos: ['M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12'] },
  { claves: ['balon', 'pelota', 'futbol', 'basquet', 'deporte'], trazos: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18'] },
]
const ICONO_GENERICO = ['M3 12V4h8l10 10-8 8z', 'M7.5 8.5h.01']

function normalizar(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function IconoCategoria({ nombre }) {
  const n = normalizar(nombre)
  const trazos = ICONOS.find((i) => i.claves.some((c) => n.includes(c)))?.trazos ?? ICONO_GENERICO
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-9 w-9 text-primario"
      aria-hidden="true"
    >
      {trazos.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

// Ilustración decorativa del hero (sin imágenes externas).
function IlustracionHero() {
  return (
    <svg viewBox="0 0 320 320" className="h-full w-full max-w-sm" aria-hidden="true">
      <circle cx="170" cy="150" r="118" fill="#f45124" />
      <g fill="none" stroke="#181a18" strokeWidth="6" strokeLinecap="round">
        <circle cx="170" cy="150" r="118" />
        <path d="M52 150h236" />
        <path d="M170 32c-52 46-52 190 0 236" />
        <path d="M170 32c52 46 52 190 0 236" />
        <path d="M88 66c40 28 40 156 0 184" />
        <path d="M252 66c-40 28-40 156 0 184" />
      </g>
      <g stroke="#d7dad3" strokeWidth="5" strokeLinecap="round" opacity="0.7">
        <path d="M10 262h120" />
        <path d="M40 286h150" />
        <path d="M20 238h70" />
      </g>
    </svg>
  )
}

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
                className="flex h-28 flex-col items-center justify-center gap-2 rounded-lg border border-borde bg-superficie p-3 text-center font-titulo text-xl font-bold uppercase hover:border-primario hover:text-primario focus-visible:outline-2 focus-visible:outline-primario"
              >
                <IconoCategoria nombre={c.nombre} />
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
      <section className="grid items-center gap-6 rounded-lg bg-secundario px-6 py-12 text-texto-claro sm:px-10 sm:py-16 md:grid-cols-2">
        <div>
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
        </div>
        <div className="hidden justify-center md:flex">
          <IlustracionHero />
        </div>
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
