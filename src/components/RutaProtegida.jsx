import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Cargando from './Cargando.jsx'

export default function RutaProtegida({ tipo }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <Cargando />
  if (!usuario) return <Navigate to="/login" replace />
  if (tipo && usuario.tipo !== tipo) return <Navigate to="/" replace />
  return <Outlet />
}
