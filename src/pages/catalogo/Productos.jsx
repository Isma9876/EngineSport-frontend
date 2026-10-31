import { useMemo, useState, useEffect, useRef } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import Cargando from '../../components/Cargando.jsx'
import RangoPrecio from '../../components/RangoPrecio.jsx'
import TarjetaProducto from '../../components/TarjetaProducto.jsx'
import useApi from '../../hooks/useApi.js'
import useMediaQuery from '../../hooks/useMediaQuery.js'
import { FOTO_TODAS, fotoCategoria } from '../../utils/fotosCategoria.js'
import { formatoPrecio } from '../../utils/formato.js'

const RETARDO_BUSQUEDA = 400
// Filtros que viven en la URL (además de `page`).
const FILTROS = [
  'q', 'categoria', 'genero', 'marca', 'precio_min', 'precio_max', 'talla', 'color', 'disponible', 'orden',
]
// Los que se editan en el panel "Filtros" (en móvil, con "Aplicar"). Categoría y
// género se eligen fuera del panel: mosaicos, subcategorías y selector de género.
const FILTROS_PANEL = ['marca', 'talla', 'color', 'precio_min', 'precio_max', 'disponible']
const nombreGenero = (g) => g.charAt(0).toUpperCase() + g.slice(1)
// Selector de género: [valor de ?genero=, texto]; '' = todos. Hombre y Mujer incluyen unisex.
const GENEROS = [
  ['', 'Todos'],
  ['hombre', 'Hombre'],
  ['mujer', 'Mujer'],
]
const ORDENES = [
  ['nombre_asc', 'Nombre (A-Z)'],
  ['nombre_desc', 'Nombre (Z-A)'],
  ['precio_asc', 'Precio: menor a mayor'],
  ['precio_desc', 'Precio: mayor a menor'],
]

const campo =
  'w-full rounded-lg border border-borde bg-fondo px-3 py-2 focus-visible:outline-2 focus-visible:outline-primario'
const boton = 'rounded-lg border border-borde px-3 py-1 text-sm font-semibold hover:bg-superficie disabled:opacity-40'
// Las listas desplegables nativas dibujan sus opciones con la fuente del sistema; así se igualan.
const opcion = 'font-sans text-base text-texto'
const pildora = (activo) =>
  `rounded-full border px-3 py-1 text-sm ${
    activo ? 'border-secundario bg-secundario text-white' : 'border-borde bg-superficie hover:border-primario'
  }`
const botonPrimario =
  'rounded bg-primario px-4 py-2 font-semibold text-secundario hover:bg-primario-oscuro hover:text-white'

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

// Lista desplegable de valores de /api/productos/filtros. El valor de la URL se
// compara sin distinguir mayúsculas (igual que el backend) y, si no está en la
// lista, se conserva como opción para no perderlo.
function SelectFiltro({ valor, opciones, todas, onCambio, deshabilitado = false }) {
  const coincide = opciones.find((o) => o.toLowerCase() === valor.toLowerCase())
  return (
    <select
      className={`${campo} disabled:opacity-60`}
      value={coincide ?? valor}
      disabled={deshabilitado}
      onChange={(e) => onCambio(e.target.value)}
    >
      <option value="" className={opcion}>{todas}</option>
      {valor && !coincide && <option value={valor} className={opcion}>{valor}</option>}
      {opciones.map((o) => (
        <option key={o} value={o} className={opcion}>
          {o}
        </option>
      ))}
    </select>
  )
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

// Mosaico de categoría con foto (Todas y las de primer nivel). Si la foto no existe,
// queda el fondo verde con el nombre.
function Mosaico({ nombre, foto, activo, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`group relative flex h-16 w-28 items-end overflow-hidden rounded-xl bg-secundario p-2.5 text-left font-titulo text-sm font-bold uppercase leading-tight text-white lg:h-24 lg:w-full lg:text-base ${
        activo ? 'ring-2 ring-primario ring-offset-2' : ''
      }`}
    >
      {foto && (
        <img
          src={foto}
          alt=""
          aria-hidden="true"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
          className="absolute inset-0 h-full w-full object-cover saturate-[0.85] transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <span className="absolute inset-0 bg-linear-to-t from-secundario via-secundario/25 to-transparent" />
      <span className="relative">{nombre}</span>
    </button>
  )
}

function Etiqueta({ texto, children }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {texto}
      {children}
    </label>
  )
}

// Los precios de la URL se leen como número; texto vacío o inválido = sin límite.
const aNumero = (v) => (v !== '' && Number.isFinite(Number(v)) ? Number(v) : null)

export default function Productos() {
  const [params, setParams] = useSearchParams()
  const esEscritorio = useMediaQuery('(min-width: 1024px)')

  const pagina = Math.max(1, parseInt(params.get('page'), 10) || 1)
  const valores = Object.fromEntries(FILTROS.map((f) => [f, params.get(f) ?? '']))

  // Cambiar filtros vuelve a la página 1. `cambios` es { clave: valor }; '' quita la clave.
  const aplicar = (cambios) =>
    setParams((prev) => {
      const sig = new URLSearchParams(prev)
      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor) sig.set(clave, valor)
        else sig.delete(clave)
      }
      sig.delete('page')
      return sig
    })
  const cambiar = (clave, valor) => aplicar({ [clave]: valor })
  // Cambiar de categoría o género cambia las opciones de Marca/Talla/Color/Precio, así que
  // esos filtros se limpian (Solo disponibles se conserva).
  const elegirSeccion = (clave, valor) =>
    aplicar({ [clave]: valor, marca: '', talla: '', color: '', precio_min: '', precio_max: '' })
  const irAPagina = (n) =>
    setParams((prev) => {
      const sig = new URLSearchParams(prev)
      if (n > 1) sig.set('page', String(n))
      else sig.delete('page')
      return sig
    })
  // Quita solo lo que vive en el panel Filtros.
  const limpiarPanel = () => aplicar(Object.fromEntries(FILTROS_PANEL.map((f) => [f, ''])))
  // Quita todos los filtros con chip (también categoría y género); conserva búsqueda y orden.
  const limpiarFiltros = () =>
    aplicar(Object.fromEntries([...FILTROS_PANEL, 'categoria', 'genero'].map((f) => [f, ''])))

  const alCambiar = Object.fromEntries(FILTROS.map((f) => [f, (v) => cambiar(f, v.trim())]))

  const consulta = new URLSearchParams()
  for (const f of FILTROS) if (valores[f] !== '') consulta.set(f, valores[f])
  if (pagina > 1) consulta.set('page', String(pagina))
  const qs = consulta.toString()
  const productos = useApi(`/api/productos${qs ? `?${qs}` : ''}`)
  const categorias = useApi('/api/categorias')
  // Las opciones de Marca/Talla/Color/Precio salen solo de los productos de la categoría y
  // género elegidos (así no hay tallas de ropa en calzado). Mientras llega la nueva lista
  // se conserva la anterior para que el panel no parpadee.
  const consultaFiltros = new URLSearchParams()
  if (valores.categoria) consultaFiltros.set('categoria', valores.categoria)
  if (valores.genero) consultaFiltros.set('genero', valores.genero)
  const qsFiltros = consultaFiltros.toString()
  const filtros = useApi(`/api/productos/filtros${qsFiltros ? `?${qsFiltros}` : ''}`)
  const [ultimosFiltros, setUltimosFiltros] = useState(null)
  if (filtros.datos && filtros.datos !== ultimosFiltros) setUltimosFiltros(filtros.datos)
  const datosFiltros = filtros.datos ?? ultimosFiltros
  const opciones = useMemo(() => opcionesCategorias(categorias.datos), [categorias.datos])

  // Mosaicos = categorías de primer nivel. La rama de la categoría elegida decide qué
  // mosaico se resalta y qué subcategorías se muestran como píldoras.
  const todasCategorias = Array.isArray(categorias.datos) ? categorias.datos : []
  const raices = todasCategorias.filter((c) => c.id_categoria_padre == null)
  const porId = new Map(todasCategorias.map((c) => [String(c.id), c]))
  const hijasDe = (c) => (c ? todasCategorias.filter((x) => String(x.id_categoria_padre) === String(c.id)) : [])
  const elegida = porId.get(valores.categoria)
  let raizElegida = elegida
  for (let i = 0; raizElegida?.id_categoria_padre != null && i < 10; i++) {
    raizElegida = porId.get(String(raizElegida.id_categoria_padre))
  }
  // Con una subcategoría elegida se siguen viendo sus hermanas.
  const baseSub = hijasDe(elegida).length > 0 ? elegida : porId.get(String(elegida?.id_categoria_padre))
  const subcategorias = hijasDe(baseSub)

  // Valores de /api/productos/filtros; si la llamada falla, marca/talla/color
  // vuelven a ser campos de texto y la barra de precio se oculta.
  const listaTexto = (v) => (Array.isArray(v) ? v.map(String).filter(Boolean) : [])
  const marcas = listaTexto(datosFiltros?.marcas)
  // Sin categoría elegida no se ofrecen tallas: mezclarían números (calzado) con letras (ropa).
  const tallas = valores.categoria ? listaTexto(datosFiltros?.tallas) : []
  const colores = listaTexto(datosFiltros?.colores)
  const limiteMin = datosFiltros?.precio_min == null ? null : Math.floor(Number(datosFiltros.precio_min))
  const limiteMax = datosFiltros?.precio_max == null ? null : Math.ceil(Number(datosFiltros.precio_max))
  const hayBarraPrecio = Number.isFinite(limiteMin) && Number.isFinite(limiteMax) && limiteMin < limiteMax

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

  // Panel de filtros: en escritorio se despliega bajo la barra y edita la URL
  // directamente; en móvil es un cajón que trabaja sobre un borrador y solo toca
  // la URL con "Aplicar".
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const [borrador, setBorrador] = useState({})
  const enCajon = !esEscritorio
  const fuente = enCajon ? borrador : valores
  const poner = (cambios) => {
    if (enCajon) setBorrador((b) => ({ ...b, ...cambios }))
    else aplicar(cambios)
  }
  const abrirCajon = () => {
    setBorrador(Object.fromEntries(FILTROS_PANEL.map((f) => [f, valores[f]])))
    setFiltrosAbiertos(true)
  }
  const cerrarCajon = () => setFiltrosAbiertos(false)
  const alternarFiltros = () => (enCajon ? abrirCajon() : setFiltrosAbiertos((v) => !v))
  const aplicarCajon = () => {
    aplicar(Object.fromEntries(FILTROS_PANEL.map((f) => [f, (borrador[f] ?? '').trim()])))
    cerrarCajon()
  }
  const limpiarCajon = () => {
    limpiarPanel()
    cerrarCajon()
  }

  const cajonVisible = filtrosAbiertos && enCajon
  useEffect(() => {
    if (!cajonVisible) return undefined
    const alTeclear = (e) => e.key === 'Escape' && setFiltrosAbiertos(false)
    document.addEventListener('keydown', alTeclear)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = overflow
    }
  }, [cajonVisible])

  const nombreCategoria = (id) => opciones.find((o) => String(o.id) === String(id))?.etiqueta.replace(/^(— )+/, '')
  const precioMin = aNumero(valores.precio_min)
  const precioMax = aNumero(valores.precio_max)
  const textoPrecio =
    precioMin !== null && precioMax !== null
      ? `${formatoPrecio(precioMin)} – ${formatoPrecio(precioMax)}`
      : precioMin !== null
        ? `desde ${formatoPrecio(precioMin)}`
        : precioMax !== null
          ? `hasta ${formatoPrecio(precioMax)}`
          : ''
  // Filtros activos del panel: texto del chip y claves que limpia.
  const chips = [
    valores.categoria && {
      clave: 'categoria',
      texto: `Categoría: ${nombreCategoria(valores.categoria) ?? valores.categoria}`,
    },
    valores.genero && { clave: 'genero', texto: `Género: ${nombreGenero(valores.genero)}` },
    valores.marca && { clave: 'marca', texto: `Marca: ${valores.marca}` },
    valores.talla && { clave: 'talla', texto: `Talla: ${valores.talla}` },
    valores.color && { clave: 'color', texto: `Color: ${valores.color}` },
    textoPrecio && {
      clave: 'precio',
      texto: `Precio: ${textoPrecio}`,
      claves: ['precio_min', 'precio_max'],
    },
    valores.disponible === 'true' && {
      clave: 'disponible',
      texto: 'Solo disponibles',
    },
  ].filter(Boolean)
  const quitarChip = (chip) =>
    chip.clave === 'categoria' || chip.clave === 'genero'
      ? elegirSeccion(chip.clave, '')
      : aplicar(Object.fromEntries((chip.claves ?? [chip.clave]).map((k) => [k, ''])))
  // El botón Filtros cuenta solo lo que está dentro del panel.
  const filtrosPanel = chips.filter((c) => c.clave !== 'categoria' && c.clave !== 'genero').length

  // Mensaje del estado vacío: nombra la búsqueda y los filtros activos.
  const partesFiltro = [
    valores.q && `que coincidan con "${valores.q}"`,
    valores.categoria &&
      `en la categoría ${nombreCategoria(valores.categoria) ? `"${nombreCategoria(valores.categoria)}"` : 'seleccionada'}`,
    valores.genero && `para el género "${valores.genero}"`,
    valores.marca && `de la marca "${valores.marca}"`,
    valores.talla && `en talla "${valores.talla}"`,
    valores.color && `de color "${valores.color}"`,
    textoPrecio &&
      (precioMin !== null && precioMax !== null
        ? `con precio entre ${textoPrecio}`
        : `con precio ${textoPrecio}`),
    valores.disponible === 'true' && 'que estén disponibles',
  ].filter(Boolean)
  const mensajeSinResultados =
    partesFiltro.length > 0 ? `No hay productos ${partesFiltro.join(' ')}.` : 'Aún no hay productos en el catálogo.'

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

      <nav aria-label="Categorías" className="mt-4">
        <ul className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 py-1 lg:mx-0 lg:grid lg:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] lg:overflow-visible lg:px-0">
          <li className="shrink-0 snap-start lg:shrink">
            <Mosaico nombre="Todas" foto={FOTO_TODAS} activo={!valores.categoria} onClick={() => elegirSeccion('categoria', '')} />
          </li>
          {raices.map((c) => (
            <li key={c.id} className="shrink-0 snap-start lg:shrink">
              <Mosaico
                nombre={c.nombre}
                foto={fotoCategoria(c.nombre)}
                activo={String(raizElegida?.id) === String(c.id)}
                onClick={() => elegirSeccion('categoria', String(c.id))}
              />
            </li>
          ))}
        </ul>
      </nav>

      {subcategorias.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Subcategorías">
          <li>
            <button
              type="button"
              onClick={() => elegirSeccion('categoria', String(baseSub.id))}
              aria-pressed={valores.categoria === String(baseSub.id)}
              className={pildora(valores.categoria === String(baseSub.id))}
            >
              Todo en {baseSub.nombre}
            </button>
          </li>
          {subcategorias.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => elegirSeccion('categoria', String(c.id))}
                aria-pressed={valores.categoria === String(c.id)}
                className={pildora(valores.categoria === String(c.id))}
              >
                {c.nombre}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Género"
          className="flex w-full divide-x divide-borde overflow-hidden rounded-lg border border-borde sm:w-auto"
        >
          {GENEROS.map(([valor, texto]) => (
            <button
              key={valor}
              type="button"
              onClick={() => elegirSeccion('genero', valor)}
              aria-pressed={valores.genero.toLowerCase() === valor}
              className={`flex-1 px-4 py-2 text-sm font-semibold sm:flex-none ${
                valores.genero.toLowerCase() === valor ? 'bg-secundario text-white' : 'bg-fondo hover:bg-superficie'
              }`}
            >
              {texto}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={alternarFiltros}
          aria-expanded={filtrosAbiertos}
          aria-controls="panel-filtros"
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold ${
            filtrosAbiertos ? 'border-secundario bg-secundario text-white' : 'border-borde bg-fondo hover:bg-superficie'
          }`}
        >
          Filtros{filtrosPanel > 0 && ` (${filtrosPanel})`}
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 4h12M4 8h8M6 12h4" />
          </svg>
        </button>
        <div className="flex w-full items-center gap-3 sm:ml-auto sm:w-auto">
          <form className="min-w-0 flex-1 sm:w-64 sm:flex-none" onSubmit={(e) => e.preventDefault()} aria-label="Búsqueda">
            <label className="sr-only" htmlFor="buscar">Buscar</label>
            <CampoTexto
              id="buscar"
              type="search"
              placeholder="Buscar productos..."
              valor={valores.q}
              onCambio={alCambiar.q}
            />
          </form>
          <label className="sr-only" htmlFor="orden">Ordenar por</label>
          <select id="orden" className={`${campo} !w-auto`} value={valores.orden} onChange={(e) => cambiar('orden', e.target.value)}>
            <option value="" className={opcion}>Ordenar por</option>
            {ORDENES.map(([valor, texto]) => (
              <option key={valor} value={valor} className={opcion}>
                {texto}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className={filtrosAbiertos ? 'fixed inset-0 z-50 lg:static lg:z-auto' : 'hidden'}>
          <div className="absolute inset-0 bg-secundario/50 lg:hidden" onClick={cerrarCajon} aria-hidden="true" />
          <form
            id="panel-filtros"
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-fondo lg:static lg:mt-3 lg:inset-y-auto lg:right-auto lg:w-auto lg:max-w-none lg:rounded-xl lg:border lg:border-borde lg:bg-superficie"
            onSubmit={(e) => e.preventDefault()}
            aria-label="Filtros"
            role={cajonVisible ? 'dialog' : undefined}
            aria-modal={cajonVisible ? 'true' : undefined}
          >
            <div className="flex items-center justify-between border-b border-borde px-4 py-3 lg:hidden">
              <h2 className="font-titulo text-lg font-bold uppercase">
                Filtros{filtrosPanel > 0 && ` (${filtrosPanel})`}
              </h2>
              <button
                type="button"
                onClick={cerrarCajon}
                aria-label="Cerrar filtros"
                className="rounded p-1 text-2xl leading-none hover:bg-superficie lg:hidden"
              >
                ×
              </button>
            </div>
            <div className="grid flex-1 content-start gap-3 overflow-y-auto px-4 pb-4 pt-3 lg:flex-none lg:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] lg:items-end lg:gap-4 lg:overflow-visible lg:p-4">
              <Etiqueta texto="Marca">
                <SelectFiltro
                  valor={fuente.marca ?? ''}
                  opciones={marcas}
                  todas="Todas"
                  deshabilitado={filtros.error}
                  onCambio={(v) => poner({ marca: v })}
                />
              </Etiqueta>
              <Etiqueta texto="Talla">
                <SelectFiltro
                  valor={fuente.talla ?? ''}
                  opciones={tallas}
                  todas="Todas"
                  deshabilitado={filtros.error}
                  onCambio={(v) => poner({ talla: v })}
                />
              </Etiqueta>
              <Etiqueta texto="Color">
                <SelectFiltro
                  valor={fuente.color ?? ''}
                  opciones={colores}
                  todas="Todos"
                  deshabilitado={filtros.error}
                  onCambio={(v) => poner({ color: v })}
                />
              </Etiqueta>
              {hayBarraPrecio && (
                <RangoPrecio
                  min={limiteMin}
                  max={limiteMax}
                  valorMin={aNumero(fuente.precio_min ?? '')}
                  valorMax={aNumero(fuente.precio_max ?? '')}
                  onConfirmar={(desde, hasta) =>
                    poner({
                      precio_min: desde <= limiteMin ? '' : String(desde),
                      precio_max: hasta >= limiteMax ? '' : String(hasta),
                    })
                  }
                />
              )}
              {filtros.error && (
                <p role="alert" className="col-span-full text-sm text-estado-error">
                  No se pudieron cargar las opciones de filtro.{' '}
                  <button type="button" onClick={filtros.recargar} className="underline">
                    Reintentar
                  </button>
                </p>
              )}
              <div className="grid gap-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primario"
                    checked={fuente.disponible === 'true'}
                    onChange={(e) => poner({ disponible: e.target.checked ? 'true' : '' })}
                  />
                  Solo disponibles
                </label>
                {filtrosPanel > 0 && (
                  <button
                    type="button"
                    onClick={limpiarPanel}
                    className="hidden text-left text-sm text-primario-oscuro underline hover:opacity-80 lg:block"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-3 border-t border-borde px-4 py-3 lg:hidden">
              <button type="button" onClick={limpiarCajon} className={`${boton} flex-1 py-2`}>
                Limpiar
              </button>
              <button type="button" onClick={aplicarCajon} className={`${botonPrimario} flex-1`}>
                Aplicar
              </button>
            </div>
          </form>
        </div>

        <div className="min-w-0">
          <div className="mt-4 empty:hidden">
            <ul className="flex flex-wrap gap-2 empty:hidden" aria-label="Filtros aplicados">
              {chips.map((chip) => (
                <li key={chip.clave}>
                  <button
                    type="button"
                    onClick={() => quitarChip(chip)}
                    className="flex items-center gap-1.5 rounded-full border border-borde bg-superficie px-3 py-1 text-sm hover:border-primario"
                    aria-label={`Quitar filtro ${chip.texto}`}
                  >
                    {chip.texto} <span aria-hidden="true">×</span>
                  </button>
                </li>
              ))}
            </ul>
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
                <button type="button" onClick={productos.recargar} className={`mt-3 ${botonPrimario}`}>
                  Reintentar
                </button>
              </div>
            ) : lista.length === 0 ? (
              <div className="space-y-3 rounded-xl bg-superficie p-6 text-center">
                <p>{mensajeSinResultados}</p>
                {chips.length > 0 ? (
                  <button type="button" onClick={limpiarFiltros} className={botonPrimario}>
                    Limpiar filtros
                  </button>
                ) : (
                  valores.q && (
                    <button type="button" onClick={() => cambiar('q', '')} className={botonPrimario}>
                      Quitar búsqueda
                    </button>
                  )
                )}
              </div>
            ) : (
              <>
                <ul
                  className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
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
