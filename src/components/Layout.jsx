import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import useContadorCarrito from '../hooks/useContadorCarrito.js'

const enlace = ({ isActive }) =>
  `rounded px-2 py-1 hover:text-primario ${isActive ? 'font-semibold text-primario' : ''}`

const enlacePie = 'hover:text-primario hover:underline'

const ANIO = new Date().getFullYear()

// Iniciales para el círculo de usuario: nombre y apellido si se conocen, si no la primera letra del correo.
function iniciales(usuario, cliente) {
  const n = `${cliente?.nombre?.[0] ?? ''}${cliente?.apellido?.[0] ?? ''}`
  return (n || usuario?.email?.[0] || '?').toUpperCase()
}

function Avatar({ texto }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primario text-sm font-bold text-secundario"
    >
      {texto}
    </span>
  )
}

const itemMenu =
  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-superficie focus-visible:bg-superficie focus-visible:outline-none'

function IconoMenu({ d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

// Menú del avatar (escritorio): identidad de la persona + sus accesos + cerrar sesión.
function MenuUsuario({ usuario, cliente, esCliente, logout }) {
  const [abierto, setAbierto] = useState(false)
  const raiz = useRef(null)
  const cerrar = () => setAbierto(false)
  const nombre = [cliente?.nombre, cliente?.apellido].filter(Boolean).join(' ')

  useEffect(() => {
    if (!abierto) return undefined
    const fuera = (e) => {
      if (!raiz.current?.contains(e.target)) setAbierto(false)
    }
    const tecla = (e) => {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', tecla)
    }
  }, [abierto])

  return (
    <div ref={raiz} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Menú de usuario"
        onClick={() => setAbierto((a) => !a)}
        className="flex items-center gap-1.5 rounded-full p-0.5 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-primario"
      >
        <Avatar texto={iniciales(usuario, cliente)} />
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="mr-1 h-3.5 w-3.5" aria-hidden="true">
          <path d="M4 6.5L8 10.5L12 6.5" />
        </svg>
      </button>
      <div
        role="menu"
        data-open={abierto}
        className="t-menu absolute right-0 top-full z-20 mt-2 w-64 rounded-xl bg-white p-1.5 text-texto shadow-xl ring-1 ring-black/5"
      >
        <div className="border-b border-borde px-3 py-2.5">
          {nombre && <p className="font-semibold">{nombre}</p>}
          <p className="truncate text-sm text-texto-suave">{usuario.email}</p>
        </div>
        <div className="py-1">
          {esCliente ? (
            <>
              <Link role="menuitem" to="/mi-cuenta" onClick={cerrar} className={itemMenu}>
                <IconoMenu d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />
                Mi cuenta
              </Link>
              <Link role="menuitem" to="/mis-pedidos" onClick={cerrar} className={itemMenu}>
                <IconoMenu d="M6 3h12l1 4H5zM5 7v13h14V7M9 11h6" />
                Mis pedidos
              </Link>
            </>
          ) : (
            <Link role="menuitem" to="/admin" onClick={cerrar} className={itemMenu}>
              <IconoMenu d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
              Panel de administración
            </Link>
          )}
        </div>
        <div className="border-t border-borde pt-1">
          <button type="button" role="menuitem" onClick={logout} className={`${itemMenu} text-red-700`}>
            <IconoMenu d="M9 21H5V3h4M16 17l5-5-5-5M21 12H9" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}

function ColumnaPie({ titulo, children }) {
  return (
    <div>
      <h2 className="font-titulo text-lg font-bold uppercase text-white">{titulo}</h2>
      <ul className="mt-3 space-y-2 text-sm">{children}</ul>
    </div>
  )
}

export default function Layout() {
  const { usuario, cliente, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // El catálogo ya trae su propio buscador: aquí se oculta para no repetirlo.
  const enCatalogo = pathname === '/productos'
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const cerrar = () => setAbierto(false)
  const esCliente = usuario?.tipo === 'cliente'
  const esEmpleado = usuario?.tipo === 'empleado'
  const unidades = useContadorCarrito(esCliente ? usuario.id : null)

  const buscar = (e) => {
    e.preventDefault()
    const q = busqueda.trim()
    if (!q) return
    navigate(`/productos?q=${encodeURIComponent(q)}`)
    setBusqueda('')
    cerrar()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="relative bg-secundario text-texto-claro">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" onClick={cerrar} aria-label="EngineSport, inicio">
            <img src="/logo-horizontal.png" alt="EngineSport" className="h-9 w-auto" />
          </Link>
          <button
            type="button"
            className="rounded border border-texto-claro px-3 py-1 md:hidden"
            aria-expanded={abierto}
            aria-label="Menú"
            onClick={() => setAbierto((a) => !a)}
          >
            ☰
          </button>
          <nav
            className={`${abierto ? 'flex' : 'hidden'} absolute left-0 right-0 top-full z-10 flex-col gap-2 bg-secundario px-4 py-3 shadow md:static md:flex md:flex-row md:items-center md:gap-4 md:p-0 md:shadow-none`}
            onClick={cerrar}
          >
            {!enCatalogo && (
            <form onSubmit={buscar} onClick={(e) => e.stopPropagation()} className="flex">
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar productos"
                aria-label="Buscar productos"
                className="w-full rounded-l bg-white px-3 py-1 text-sm text-secundario placeholder:text-gray-500 md:w-48"
              />
              <button
                type="submit"
                aria-label="Buscar"
                className="rounded-r bg-primario px-3 text-secundario hover:bg-primario-oscuro hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </button>
            </form>
            )}

            {/* "Productos" solo en el menú móvil; en escritorio se llega por la búsqueda, el Home y el pie */}
            <NavLink to="/productos" className={(e) => `${enlace(e)} md:hidden`}>Productos</NavLink>

            {/* Los empleados no tienen carrito */}
            {!esEmpleado && (
              <NavLink
                to="/carrito"
                className={(estado) => `relative flex items-center gap-2 self-start ${enlace(estado)}`}
                aria-label={unidades > 0 ? `Carrito, ${unidades} unidades` : 'Carrito'}
                title="Carrito"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <circle cx="9" cy="20" r="1.5" />
                  <circle cx="18" cy="20" r="1.5" />
                  <path d="M2 3h3l2.6 12.4a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 7H6" />
                </svg>
                <span className="md:hidden">Carrito</span>
                {unidades > 0 && (
                  <span
                    key={unidades}
                    aria-hidden="true"
                    className="t-badge-pop absolute -top-1 left-5 flex md:-right-1 md:left-auto h-5 min-w-5 items-center justify-center rounded-full bg-primario px-1 text-xs font-bold text-secundario"
                  >
                    {unidades > 99 ? '99+' : unidades}
                  </span>
                )}
              </NavLink>
            )}

            {usuario ? (
              <>
                {/* Escritorio: menú del avatar */}
                <div className="hidden md:block">
                  <MenuUsuario usuario={usuario} cliente={cliente} esCliente={esCliente} logout={logout} />
                </div>
                {/* Móvil: lista simple dentro del menú */}
                <div className="flex flex-col gap-2 border-t border-white/10 pt-2 md:hidden">
                  <span className="text-sm text-texto-claro">{usuario.email}</span>
                  {esCliente && <NavLink to="/mi-cuenta" className={enlace}>Mi cuenta</NavLink>}
                  {esCliente && <NavLink to="/mis-pedidos" className={enlace}>Mis pedidos</NavLink>}
                  {esEmpleado && <NavLink to="/admin" className={enlace}>Panel de administración</NavLink>}
                  <button type="button" onClick={logout} className="rounded px-2 py-1 text-left font-semibold text-primario hover:text-white">
                    Cerrar sesión
                  </button>
                </div>
              </>
            ) : (
              <>
                <NavLink to="/login" className={enlace}>Ingresar</NavLink>
                <NavLink
                  to="/registro"
                  className="rounded bg-primario px-3 py-1 font-semibold text-secundario hover:bg-primario-oscuro hover:text-white"
                >
                  Crear cuenta
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <footer className="bg-secundario text-texto-claro">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <img src="/logo-horizontal.png" alt="EngineSport" className="h-9 w-auto" />
            <p className="mt-3 max-w-xs text-sm">
              Artículos deportivos para entrenar, competir y disfrutar, con compra en línea.
            </p>
          </div>
          <ColumnaPie titulo="Tienda">
            <li><Link to="/" className={enlacePie}>Inicio</Link></li>
            <li><Link to="/productos" className={enlacePie}>Productos</Link></li>
            {!esEmpleado && <li><Link to="/carrito" className={enlacePie}>Carrito</Link></li>}
          </ColumnaPie>
          <ColumnaPie titulo="Tu cuenta">
            {esCliente && (
              <>
                <li><Link to="/mi-cuenta" className={enlacePie}>Mi cuenta</Link></li>
                <li><Link to="/mis-pedidos" className={enlacePie}>Mis pedidos</Link></li>
              </>
            )}
            {esEmpleado && <li><Link to="/admin" className={enlacePie}>Panel de administración</Link></li>}
            {!usuario && (
              <>
                <li><Link to="/login" className={enlacePie}>Iniciar sesión</Link></li>
                <li><Link to="/registro" className={enlacePie}>Registrarse</Link></li>
              </>
            )}
          </ColumnaPie>
          <ColumnaPie titulo="Compra segura">
            <li>Pago con tarjeta mediante Stripe</li>
            <li>Seguimiento de tus pedidos</li>
            <li>Comprobante de compra en PDF</li>
          </ColumnaPie>
        </div>
        <div className="border-t border-white/10 py-4 text-center text-sm">
          © {ANIO} EngineSport. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  )
}
