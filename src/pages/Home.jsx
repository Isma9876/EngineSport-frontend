import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Home() {
  const { usuario } = useAuth()

  // Los empleados entran directo al panel de administración
  if (usuario?.tipo === 'empleado') return <Navigate to="/admin" replace />

  return (
    <section>
      <h1 className="font-titulo text-2xl font-extrabold uppercase">Bienvenido a EngineSport</h1>
      <p className="mt-2 text-texto-suave">En construcción</p>
    </section>
  )
}
