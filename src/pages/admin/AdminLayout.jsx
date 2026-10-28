import { NavLink, Outlet } from 'react-router-dom'
import { menuAdmin } from './menu.js'

const enlace = ({ isActive }) =>
  `whitespace-nowrap rounded px-2 py-1 hover:text-primario ${isActive ? 'font-semibold text-primario' : ''}`

export default function AdminLayout() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:gap-6">
      <aside className="md:w-48 md:shrink-0">
        <nav
          aria-label="Menú de administración"
          className="flex gap-2 overflow-x-auto rounded bg-secundario px-3 py-2 text-texto-claro md:flex-col md:overflow-visible md:py-3"
        >
          <h2 className="hidden font-titulo text-lg font-extrabold uppercase text-primario md:block">
            Panel
          </h2>
          {menuAdmin.map(({ ruta, texto, fin }) => (
            <NavLink key={ruta} to={ruta} end={fin} className={enlace}>
              {texto}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="min-w-0 flex-1">
        <Outlet />
      </section>
    </div>
  )
}
