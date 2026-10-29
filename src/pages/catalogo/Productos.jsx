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
  'w-full rounded-lg border border-borde bg-fondo px-3 py-2 focus-visible:outline-2 focus-visible:outline-primario'

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

  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const nombreCategoria = (id) => opciones.find((o) => String(o.id) === String(id))?.etiqueta.replace(/^(— )+/, '')
  const chips = [
    ['categoria', 'Categoría', nombreCategoria(valores.categoria) ?? valores.categoria],
    ['marca', 'Marca', valores.marca],
    ['talla', 'Talla', valores.talla],
    ['color', 'Color', valores.color],
    ['precio_min', 'Desde Q', valores.precio_min],
    ['precio_max', 'Hasta Q', valores.precio_max],
    ['disponible', 'Solo disponibles', valores.disponible === 'true' ? ' ' : ''],
  ].filter(([, , v]) => v)
  const filtrosActivos = chips.length

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-titulo text-3xl font-extrabold uppercase">Productos</h1>
        {!productos.cargando && !productos.error && lista.length > 0 && (
          <p className="pb-1 text-sm text-texto-suave">
            {productos.datos.total} {productos.datos.total === 1 ? 'producto' : 'productos'}
          </p>
        )}
      </div>

      <form className="mt-4" onSubmit={(e) => e.preventDefault()} aria-label="Búsqueda">
        <label className="sr-only" htmlFor="buscar">Buscar</label>
        <CampoTexto
          id="buscar"
          type="search"
          placeholder="Buscar productos..."
          valor={valores.q}
          onCambio={alCambiar.q}
        />
      </form>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[15rem_1fr]">
        <form
          className={`t-acc t-acc-lg rounded-xl border border-borde bg-superficie lg:sticky lg:top-24`}
          data-open={filtrosAbiertos}
          onSubmit={(e) => e.preventDefault()}
          aria-label="Filtros"
        >
          <button
            type="button"
            aria-expanded={filtrosAbiertos}
            onClick={() => setFiltrosAbiertos((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 font-titulo text-lg font-bold uppercase lg:pointer-events-none"
          >
            <span>Filtros{filtrosActivos > 0 && ` (${filtrosActivos})`}</span>
            <span className="t-acc-chevron lg:hidden">
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 6.5L8 10.5L12 6.5" />
              </svg>
            </span>
          </button>
          <div className="t-acc-panel">
            <div className="t-acc-panel-inner">
              <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-3 lg:grid-cols-1">
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
                  <CampoTexto type="number" min="0" step="any" inputMode="decimal" valor={valores.precio_min} onCambio={alCambiar.precio_min} />
                </Etiqueta>
                <Etiqueta texto="Precio máximo">
                  <CampoTexto type="number" min="0" step="any" inputMode="decimal" valor={valores.precio_max} onCambio={alCambiar.precio_max} />
                </Etiqueta>
                <label className="col-span-2 flex items-center gap-2 text-sm font-medium sm:col-span-3 lg:col-span-1">
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
                    className="col-span-2 text-left text-sm text-primario-oscuro underline hover:opacity-80 sm:col-span-3 lg:col-span-1"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ul className="flex flex-wrap gap-2" aria-label="Filtros aplicados">
              {chips.map(([clave, etiqueta, valor]) => (
                <li key={clave}>
                  <button
                    type="button"
                    onClick={() => cambiar(clave, '')}
                    className="flex items-center gap-1.5 rounded-full border border-borde bg-superficie px-3 py-1 text-sm hover:border-primario"
                    aria-label={`Quitar filtro ${etiqueta}`}
                  >
                    {etiqueta}{valor.trim() ? `: ${valor}` : ''} <span aria-hidden="true">×</span>
                  </button>
                </li>
              ))}
            </ul>
            <label className="ml-auto flex items-center gap-2 text-sm">
              <span className="text-texto-suave">Ordenar</span>
              <select className={`${campo} !w-auto`} value={valores.orden} onChange={(e) => cambiar('orden', e.target.value)}>
                <option value="">Predeterminado</option>
                {ORDENES.map(([valor, texto]) => (
                  <option key={valor} value={valor}>
                    {texto}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {categorias.error && (
            <p className="mt-2 text-sm text-texto-suave">
              No se pudieron cargar las categorías; el resto de filtros sigue disponible.
            </p>
          )}

          <div className="mt-4">
            {productos.cargando ? (
              <Cargando texto="Cargando productos... (si el servidor estaba dormido puede tardar unos segundos)" />
            ) : productos.error ? (
              <div role="alert" className="rounded-xl bg-superficie p-6 text-center">
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
              <div className="rounded-xl bg-superficie p-6 text-center">
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
                <ul
                  className="grid grid-cols-2 gap-4 md:grid-cols-3"
                  onClick={() => guardarScroll(search)}
                >
                  {lista.map((p, i) => (
                    <li key={p.id}>
                      <TarjetaProducto producto={p} indice={i} />
                    </li>
                  ))}
                </ul>
                <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Paginación">
                  <button
                    type="button"
                    disabled={pagina <= 1}
                    onClick={() => irAPagina(pagina - 1)}
                    className="rounded-lg border border-borde bg-fondo px-4 py-2 disabled:opacity-40"
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
                    className="rounded-lg border border-borde bg-fondo px-4 py-2 disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </nav>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
