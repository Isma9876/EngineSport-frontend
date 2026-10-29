import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
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
          <Link to="/" className="font-titulo text-2xl font-extrabold uppercase text-primario" onClick={cerrar}>
            EngineSport
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

            <NavLink to="/productos" className={enlace}>Productos</NavLink>

            {/* Los empleados no tienen carrito */}
            {!esEmpleado && (
              <NavLink
                to="/carrito"
                className={(estado) => `relative ${enlace(estado)}`}
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
                {unidades > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primario px-1 text-xs font-bold text-secundario"
                  >
                    {unidades > 99 ? '99+' : unidades}
                  </span>
                )}
              </NavLink>
            )}

            {usuario ? (
              <>
                {esEmpleado && <NavLink to="/admin" className={enlace}>Admin</NavLink>}
                {esCliente && (
                  <NavLink
                    to="/mi-cuenta"
                    title={usuario.email}
                    className={(estado) => `flex items-center gap-2 ${enlace(estado)}`}
                  >
                    <Avatar texto={iniciales(usuario, cliente)} />
                    <span>Mi cuenta</span>
                  </NavLink>
                )}
                {esEmpleado && (
                  <span title={usuario.email} className="flex items-center">
                    <Avatar texto={iniciales(usuario, cliente)} />
                    <span className="sr-only">{usuario.email}</span>
                  </span>
                )}
                {/* En el menú móvil no hay tooltip: se muestra el correo */}
                <span className="text-sm text-texto-claro md:hidden">{usuario.email}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded bg-primario px-3 py-1 font-semibold text-secundario hover:bg-primario-oscuro hover:text-white"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={enlace}>Iniciar sesión</NavLink>
                <NavLink to="/registro" className={enlace}>Registrarse</NavLink>
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
            <p className="font-titulo text-2xl font-extrabold uppercase text-primario">EngineSport</p>
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
