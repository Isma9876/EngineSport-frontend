import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const enlace = ({ isActive }) =>
  `rounded px-2 py-1 hover:text-primario ${isActive ? 'font-semibold text-primario' : ''}`

const ANIO = new Date().getFullYear()

export default function Layout() {
  const { usuario, logout } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const cerrar = () => setAbierto(false)

  return (
    <div className="flex min-h-screen flex-col">
      <header className="relative bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-titulo text-xl font-bold text-primario" onClick={cerrar}>
            EngineSport
          </Link>
          <button
            type="button"
            className="rounded border px-3 py-1 md:hidden"
            aria-expanded={abierto}
            aria-label="Menú"
            onClick={() => setAbierto((a) => !a)}
          >
            ☰
          </button>
          <nav
            className={`${abierto ? 'flex' : 'hidden'} absolute left-0 right-0 top-full z-10 flex-col gap-2 bg-white px-4 py-3 shadow md:static md:flex md:flex-row md:items-center md:gap-4 md:p-0 md:shadow-none`}
            onClick={cerrar}
          >
            <NavLink to="/productos" className={enlace}>Productos</NavLink>
            <NavLink to="/carrito" className={enlace}>Carrito</NavLink>
            {usuario ? (
              <>
                {usuario.tipo === 'empleado' && (
                  <NavLink to="/admin" className={enlace}>Admin</NavLink>
                )}
                <span className="text-sm text-secundario">{usuario.email}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded bg-secundario px-3 py-1 text-white hover:opacity-90"
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
      <footer className="bg-secundario py-4 text-center text-sm text-white">
        © {ANIO} EngineSport. Todos los derechos reservados.
      </footer>
    </div>
  )
}
