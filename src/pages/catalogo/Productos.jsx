import { useMemo, useState, useEffect, useRef } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import Cargando from '../../components/Cargando.jsx'
import TarjetaProducto from '../../components/TarjetaProducto.jsx'
import useApi from '../../hooks/useApi.js'

const RETARDO_BUSQUEDA = 400
// Filtros que viven en la URL (además de `page`).
const FILTROS = [
  'q', 'categoria', 'marca', 'precio_min', 'precio_max', 'talla', 'color', 'disponible', 'orden',
]
const ORDENES = [
  ['nombre_asc', 'Nombre (A-Z)'],
  ['nombre_desc', 'Nombre (Z-A)'],
  ['precio_asc', 'Precio: menor a mayor'],
  ['precio_desc', 'Precio: mayor a menor'],
]

const campo =
  'w-full rounded border border-borde bg-fondo px-3 py-2 focus-visible:outline-2 focus-visible:outline-primario'

// /api/categorias devuelve una lista plana (con id_categoria_padre); se ordena
// en árbol y se aplana con sangría para el selector.
function opcionesCategorias(lista) {
  if (!Array.isArray(lista)) return []
  const hijas = new Map()
  for (const c of lista) {
    const padre = c.id_categoria_padre ?? null
    if (!hijas.has(padre)) hijas.set(padre, [])
    hijas.get(padre).push(c)
  }
  const opciones = []
  const vistas = new Set()
  const recorrer = (padre, nivel) => {
    for (const c of hijas.get(padre) ?? []) {
      if (vistas.has(c.id)) continue
      vistas.add(c.id)
      opciones.push({ id: c.id, etiqueta: `${nivel ? '— '.repeat(nivel) : ''}${c.nombre}` })
      recorrer(c.id, nivel + 1)
    }
  }
  recorrer(null, 0)
  return opciones
}

// Campo de texto que aplica el cambio a la URL tras una pausa al escribir.
function CampoTexto({ valor, onCambio, ...props }) {
  const [texto, setTexto] = useState(valor)
  const [previo, setPrevio] = useState(valor)
  if (valor !== previo) {
    // la URL cambió por fuera (limpiar filtros, atrás/adelante)
    setPrevio(valor)
    setTexto(valor)
  }

  useEffect(() => {
    if (texto === valor) return undefined
    const id = setTimeout(() => onCambio(texto), RETARDO_BUSQUEDA)
    return () => clearTimeout(id)
  }, [texto, valor, onCambio])

  return <input {...props} value={texto} onChange={(e) => setTexto(e.target.value)} className={campo} />
}

// El scroll del listado se guarda por filtros+página (location.search) para
// recuperarlo al volver desde el detalle. sessionStorage puede no estar disponible.
const claveScroll = (search) => `scroll:${search}`
function guardarScroll(search) {
  try {
    sessionStorage.setItem(claveScroll(search), String(window.scrollY))
  } catch {
    // sin sessionStorage: se vuelve arriba
  }
}
function tomarScroll(search) {
  try {
    const guardado = sessionStorage.getItem(claveScroll(search))
    sessionStorage.removeItem(claveScroll(search))
    const y = Number(guardado)
    return guardado !== null && Number.isFinite(y) ? y : null
  } catch {
    return null
  }
}

function Etiqueta({ texto, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {texto}
      {children}
    </label>
  )
}

export default function Productos() {
  const [params, setParams] = useSearchParams()

  const pagina = Math.max(1, parseInt(params.get('page'), 10) || 1)
  const valores = Object.fromEntries(FILTROS.map((f) => [f, params.get(f) ?? '']))
  const hayFiltros = FILTROS.some((f) => valores[f] !== '')

  // Cambiar un filtro vuelve a la página 1.
  const cambiar = (clave, valor) =>
    setParams((prev) => {
      const sig = new URLSearchParams(prev)
      if (valor) sig.set(clave, valor)
      else sig.delete(clave)
      sig.delete('page')
      return sig
    })
  const irAPagina = (n) =>
    setParams((prev) => {
      const sig = new URLSearchParams(prev)
      if (n > 1) sig.set('page', String(n))
      else sig.delete('page')
      return sig
    })
  const limpiar = () => setParams({})

  const alCambiar = Object.fromEntries(FILTROS.map((f) => [f, (v) => cambiar(f, v.trim())]))

  const consulta = new URLSearchParams()
  for (const f of FILTROS) if (valores[f] !== '') consulta.set(f, valores[f])
  if (pagina > 1) consulta.set('page', String(pagina))
  const qs = consulta.toString()
  const productos = useApi(`/api/productos${qs ? `?${qs}` : ''}`)
  const categorias = useApi('/api/categorias')
  const opciones = useMemo(() => opcionesCategorias(categorias.datos), [categorias.datos])

  const lista = productos.datos?.productos ?? []
  const totalPaginas = Math.max(1, productos.datos?.total_pages ?? 1)

  // Tras cada carga: restaura el scroll guardado (volver del detalle) o, si es una
  // navegación nueva (filtro, página, entrada directa), empieza arriba. Se espera a
  // que termine la carga: antes no hay altura y el scroll se perdería.
  const { search } = useLocation()
  const aplicadoPara = useRef(null)
  useEffect(() => {
    if (productos.cargando || aplicadoPara.current === search) return
    aplicadoPara.current = search
    window.scrollTo(0, tomarScroll(search) ?? 0)
  }, [productos.cargando, search])

  return (
    <section>
      <h1 className="font-titulo text-2xl font-extrabold uppercase">Productos</h1>

      <form
        className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-superficie p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(e) => e.preventDefault()}
        aria-label="Filtros"
      >
        <div className="sm:col-span-2 lg:col-span-4">
          <Etiqueta texto="Buscar">
            <CampoTexto
              type="search"
              placeholder="Buscar productos..."
              valor={valores.q}
              onCambio={alCambiar.q}
            />
          </Etiqueta>
        </div>
        <Etiqueta texto="Categoría">
          <select
            className={campo}
            value={valores.categoria}
            onChange={(e) => cambiar('categoria', e.target.value)}
          >
            <option value="">Todas</option>
            {opciones.map((o) => (
              <option key={o.id} value={o.id}>
                {o.etiqueta}
              </option>
            ))}
          </select>
        </Etiqueta>
        <Etiqueta texto="Marca">
          <CampoTexto valor={valores.marca} onCambio={alCambiar.marca} />
        </Etiqueta>
        <Etiqueta texto="Talla">
          <CampoTexto valor={valores.talla} onCambio={alCambiar.talla} />
        </Etiqueta>
        <Etiqueta texto="Color">
          <CampoTexto valor={valores.color} onCambio={alCambiar.color} />
        </Etiqueta>
        <Etiqueta texto="Precio mínimo">
          <CampoTexto
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            valor={valores.precio_min}
            onCambio={alCambiar.precio_min}
          />
        </Etiqueta>
        <Etiqueta texto="Precio máximo">
          <CampoTexto
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            valor={valores.precio_max}
            onCambio={alCambiar.precio_max}
          />
        </Etiqueta>
        <Etiqueta texto="Ordenar por">
          <select
            className={campo}
            value={valores.orden}
            onChange={(e) => cambiar('orden', e.target.value)}
          >
            <option value="">Predeterminado</option>
            {ORDENES.map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </Etiqueta>
        <div className="flex items-end justify-between gap-3 lg:justify-start">
          <label className="flex items-center gap-2 pb-2 text-sm font-medium">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primario"
              checked={valores.disponible === 'true'}
              onChange={(e) => cambiar('disponible', e.target.checked ? 'true' : '')}
            />
            Solo disponibles
          </label>
          {hayFiltros && (
            <button
              type="button"
              onClick={limpiar}
              className="pb-2 text-sm text-primario-oscuro underline hover:opacity-80"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </form>
      {categorias.error && (
        <p className="mt-2 text-sm text-texto-suave">
          No se pudieron cargar las categorías; el resto de filtros sigue disponible.
        </p>
      )}

      <div className="mt-6">
        {productos.cargando ? (
          <Cargando texto="Cargando productos... (si el servidor estaba dormido puede tardar unos segundos)" />
        ) : productos.error ? (
          <div role="alert" className="rounded-lg bg-superficie p-6 text-center shadow-sm">
            <p>{productos.error.message}</p>
            <button
              type="button"
              onClick={productos.recargar}
              className="mt-3 rounded bg-primario px-4 py-2 font-semibold text-secundario hover:bg-primario-oscuro hover:text-white"
            >
              Reintentar
            </button>
          </div>
        ) : lista.length === 0 ? (
          <div className="rounded-lg bg-superficie p-6 text-center shadow-sm">
            <p>No encontramos productos con esos filtros</p>
            <button
              type="button"
              onClick={limpiar}
              className="mt-3 rounded bg-primario px-4 py-2 font-semibold text-secundario hover:bg-primario-oscuro hover:text-white"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-texto-suave">
              {productos.datos.total} {productos.datos.total === 1 ? 'producto' : 'productos'}
            </p>
            <ul
              className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
              onClick={() => guardarScroll(search)}
            >
              {lista.map((p) => (
                <li key={p.id}>
                  <TarjetaProducto producto={p} />
                </li>
              ))}
            </ul>
            <nav className="mt-6 flex items-center justify-center gap-4" aria-label="Paginación">
              <button
                type="button"
                disabled={pagina <= 1}
                onClick={() => irAPagina(pagina - 1)}
                className="rounded border border-borde bg-fondo px-4 py-2 disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-sm">
                Página {pagina} de {totalPaginas}
              </span>
              <button
                type="button"
                disabled={pagina >= totalPaginas}
                onClick={() => irAPagina(pagina + 1)}
                className="rounded border border-borde bg-fondo px-4 py-2 disabled:opacity-40"
              >
                Siguiente
              </button>
            </nav>
          </>
        )}
      </div>
    </section>
  )
}
