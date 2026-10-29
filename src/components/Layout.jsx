import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const enlace = ({ isActive }) =>
  `rounded px-2 py-1 hover:text-primario ${isActive ? 'font-semibold text-primario' : ''}`

const ANIO = new Date().getFullYear()

export default function Layout() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const cerrar = () => setAbierto(false)

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

            <NavLink to="/carrito" className={enlace} aria-label="Carrito" title="Carrito">
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
            </NavLink>

            {usuario ? (
              <>
                {usuario.tipo === 'empleado' && (
                  <NavLink to="/admin" className={enlace}>Admin</NavLink>
                )}
                {usuario.tipo === 'cliente' && (
                  <NavLink to="/mi-cuenta" className={enlace}>Mi cuenta</NavLink>
                )}
                <span className="hidden text-sm text-texto-claro lg:inline">{usuario.email}</span>
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
      <footer className="bg-secundario py-4 text-center text-sm text-texto-claro">
        © {ANIO} EngineSport. Todos los derechos reservados.
      </footer>
    </div>
  )
}