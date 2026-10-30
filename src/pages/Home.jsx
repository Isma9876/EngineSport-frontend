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
  { titulo: 'Envío gratis', texto: 'En compras desde Q500', trazo: 'M3 6h11v11H3zM14 10h4l3 3v4h-7M9 17.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM19 17.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z'}]

// Icono de cada categoría según su nombre; si no se reconoce, una etiqueta genérica.
const ICONOS = [
  { claves: ['calzado', 'tenis', 'zapat', 'bota'], trazos: ['M3 17h18v-3a2 2 0 0 0-1.4-1.9L15 10l-1.5-3H10v4.5L7 12H3z', 'M3 17v2h18v-2'] },
  { claves: ['ropa', 'camis', 'playera', 'short', 'pantal', 'chama'], trazos: ['M8 3 3 6l2 4 3-1.5V21h8V8.5L19 10l2-4-5-3a4 4 0 0 1-8 0z'] },
  { claves: ['equip', 'fitness', 'gimnas', 'pesa', 'entren'], trazos: ['M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12'] },
  { claves: ['balon', 'pelota', 'futbol', 'basquet', 'deporte'], trazos: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18'] },
]
const ICONO_GENERICO = ['M3 12V4h8l10 10-8 8z', 'M7.5 8.5h.01']

// Foto de cada categoría (en public/img), elegida por el nombre; sin foto se usa el icono.
const FOTOS = [
  { claves: ['calzado', 'tenis', 'zapat', 'bota'], src: '/img/cat-calzado.webp' },
  { claves: ['ropa', 'camis', 'playera', 'short', 'pantal', 'chama'], src: '/img/cat-ropa.webp' },
  { claves: ['accesor', 'guante', 'mochila', 'bolso'], src: '/img/cat-accesorios.webp' },
  { claves: ['equip', 'fitness', 'gimnas', 'pesa', 'entren'], src: '/img/cat-equipamiento.webp' },
  { claves: ['natac', 'piscina', 'nado'], src: '/img/cat-natacion.webp' },
]

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

function ErrorReintento({ mensaje, onReintentar }) {
  return (
    <p role="alert" className="mt-3 text-sm text-estado-error">
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
        <ul className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-3">
          {principales.map((c) => {
            const n = normalizar(c.nombre)
            const foto = FOTOS.find((f) => f.claves.some((k) => n.includes(k)))?.src
            return (
              <li key={c.id}>
                {foto ? (
                  <Link
                    to={`/productos?categoria=${c.id}`}
                    className="t-card group relative flex aspect-[4/5] items-end overflow-hidden rounded-xl bg-secundario focus-visible:outline-2 focus-visible:outline-primario"
                  >
                    <img
                      src={foto}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover saturate-[0.85] transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 bg-linear-to-t from-secundario via-secundario/25 to-transparent" />
                    <span className="relative p-3 font-titulo text-xl font-bold uppercase leading-tight text-white">
                      {c.nombre}
                    </span>
                  </Link>
                ) : (
                  <Link
                    to={`/productos?categoria=${c.id}`}
                    className="t-card flex aspect-[4/5] flex-col items-center justify-center gap-1.5 rounded-xl border border-borde bg-superficie p-2 text-center font-titulo text-lg font-bold uppercase leading-tight hover:border-primario hover:text-primario-oscuro focus-visible:outline-2 focus-visible:outline-primario"
                  >
                    <IconoCategoria nombre={c.nombre} />
                    {c.nombre}
                  </Link>
                )}
              </li>
            )
          })}
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
      <section className="relative isolate overflow-hidden rounded-xl bg-secundario text-texto-claro">
        {/* Foto de fondo + degradado de la marca para que el texto siempre se lea */}
        <img
          src="/img/hero.webp"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[70%_80%] saturate-[0.8]"
        />
        <div className="absolute inset-0 -z-10 bg-linear-to-r from-secundario via-secundario/80 to-secundario/0 max-md:bg-secundario/70 max-md:bg-none" />
        <div className={`t-stagger px-6 py-14 sm:px-10 sm:py-24 md:max-w-xl ${visible ? 'is-shown' : ''}`}>
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
