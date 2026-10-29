import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import useApi from '../hooks/useApi.js'
import Cargando from '../components/Cargando.jsx'
import TarjetaProducto from '../components/TarjetaProducto.jsx'

const subtitulo = 'font-titulo text-2xl font-extrabold uppercase'
const MAX_CATEGORIAS = 6

const BENEFICIOS = [
  { titulo: 'Pago seguro', texto: 'Con tarjeta, vía Stripe', trazo: 'M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 15h3' },
  { titulo: 'Sigue tu pedido', texto: 'Estado en tiempo real desde tu cuenta', trazo: 'M12 3v9l5 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  { titulo: 'Comprobante en PDF', texto: 'Descárgalo cuando lo necesites', trazo: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6' },
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
      className="h-7 w-7 text-primario"
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
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {principales.map((c) => (
            <li key={c.id}>
              <Link
                to={`/productos?categoria=${c.id}`}
                className="t-card flex h-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-borde bg-superficie p-2 text-center font-titulo text-lg font-bold uppercase leading-tight hover:border-primario hover:text-primario-oscuro focus-visible:outline-2 focus-visible:outline-primario"
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
  const { datos, error, cargando, recargar } = useApi('/api/productos?limit=8&disponible=true')
  const lista = datos?.productos ?? []

  if (!cargando && !error && lista.length === 0) return null

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <h2 className={subtitulo}>Disponibles ahora</h2>
        <Link to="/productos" className="shrink-0 whitespace-nowrap text-sm underline">
          Ver todos
        </Link>
      </div>
      {cargando && <Cargando texto="Cargando productos..." />}
      {error && <ErrorReintento mensaje={error.message} onReintentar={recargar} />}
      {lista.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {lista.map((p, i) => (
            <li key={p.id}>
              <TarjetaProducto producto={p} indice={i} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Beneficios() {
  return (
    <ul className="grid divide-y divide-borde rounded-xl border border-borde sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {BENEFICIOS.map((b) => (
        <li key={b.titulo} className="flex items-center gap-3 px-5 py-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 shrink-0 text-primario-oscuro" aria-hidden="true">
            <path d={b.trazo} />
          </svg>
          <div>
            <p className="font-titulo text-lg font-bold uppercase leading-none">{b.titulo}</p>
            <p className="mt-1 text-sm text-texto-suave">{b.texto}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function Home() {
  const { usuario } = useAuth()
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Los empleados entran directo al panel de administración
  if (usuario?.tipo === 'empleado') return <Navigate to="/admin" replace />

  return (
    <div className="space-y-10">
      <section className="grid items-center gap-6 rounded-xl bg-secundario px-6 py-10 text-texto-claro sm:px-10 sm:py-12 md:grid-cols-2">
        <div className={`t-stagger ${visible ? 'is-shown' : ''}`}>
          <h1 className="t-stagger-line t-stagger-line--1 font-titulo text-4xl font-extrabold uppercase leading-tight text-white sm:text-6xl">
            Equípate para <span className="text-primario">rendir</span>
          </h1>
          <p className="t-stagger-line t-stagger-line--2 mt-4 max-w-xl text-lg">
            Artículos deportivos para entrenar, competir y disfrutar. Encuentra lo que necesitas y págalo en línea.
          </p>
          <span className="t-stagger-line t-stagger-line--3">
            <Link
              to="/productos"
              className="mt-6 inline-block rounded bg-primario px-6 py-3 font-semibold text-secundario hover:bg-primario-oscuro hover:text-white focus-visible:outline-2 focus-visible:outline-white"
            >
              Ver productos
            </Link>
          </span>
        </div>
        <div className="hidden justify-center md:flex">
          <IlustracionHero />
        </div>
      </section>

      <Beneficios />
      <Categorias />
      <Disponibles />

      <section className="flex flex-col items-start justify-between gap-4 rounded-xl bg-superficie px-6 py-8 sm:flex-row sm:items-center sm:px-10">
        <div>
          <h2 className={subtitulo}>¿Buscas algo en específico?</h2>
          <p className="mt-1 text-texto-suave">Filtra por categoría, marca, talla, color o precio.</p>
        </div>
        <Link
          to="/productos"
          className="shrink-0 rounded bg-secundario px-6 py-3 font-semibold text-white hover:bg-primario-oscuro focus-visible:outline-2 focus-visible:outline-primario"
        >
          Explorar el catálogo
        </Link>
      </section>
    </div>
  )
}
