import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { setOnSessionExpired } from '../api.js'

const AuthContext = createContext(null)

const SIN_SESION = { token: null, usuario: null, cliente: null }

function leerSesion() {
  try {
    const token = localStorage.getItem('token')
    const usuario = JSON.parse(localStorage.getItem('usuario'))
    const cliente = JSON.parse(localStorage.getItem('cliente'))
    if (token && usuario) {
      // Una sesión de cliente guardada antes de que existiera 'cliente' no sirve para
      // el checkout (falta su id): se descarta para que vuelva a iniciar sesión.
      if (usuario.tipo === 'cliente' && !cliente?.id) {
        borrarSesion()
        return SIN_SESION
      }
      return { token, usuario, cliente: cliente ?? null }
    }
  } catch {
    // datos corruptos o localStorage no disponible
  }
  return SIN_SESION
}

function borrarSesion() {
  try {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    localStorage.removeItem('cliente')
  } catch {
    // ignorar
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  // La sesión se restaura de forma síncrona desde localStorage al iniciar,
  // por eso "cargando" ya nace en false (se mantiene en el contrato por si
  // algún día la restauración pasa a ser asíncrona).
  const [sesion, setSesion] = useState(leerSesion)
  const [cargando] = useState(false)
  const [aviso, setAviso] = useState('')

  // Manejador de sesión vencida / cuenta desactivada
  useEffect(() => {
    setOnSessionExpired((error) => {
      borrarSesion()
      setSesion(SIN_SESION)
      setAviso(
        error.code === 'CUENTA_DESACTIVADA'
          ? 'Esta cuenta está desactivada.'
          : 'Tu sesión expiró, inicia sesión de nuevo.',
      )
      navigate('/login', { replace: true })
    })
    return () => setOnSessionExpired(null)
  }, [navigate])

  const guardarSesion = useCallback((datos) => {
    // El login y el registro devuelven 'cliente' para clientes; los empleados no lo traen.
    const cliente = datos.cliente
      ? { id: datos.cliente.id, nombre: datos.cliente.nombre, apellido: datos.cliente.apellido }
      : null
    localStorage.setItem('token', datos.token)
    localStorage.setItem('usuario', JSON.stringify(datos.usuario))
    if (cliente) {
      localStorage.setItem('cliente', JSON.stringify(cliente))
    } else {
      localStorage.removeItem('cliente')
    }
    setSesion({ token: datos.token, usuario: datos.usuario, cliente })
    setAviso('')
  }, [])

  const login = useCallback(
    async (email, password) => {
      const datos = await api.post('/api/auth/login', { email, password })
      guardarSesion(datos)
      return datos.usuario
    },
    [guardarSesion],
  )

  const registrar = useCallback(
    async (campos) => {
      const datos = await api.post('/api/auth/register', campos)
      guardarSesion(datos)
      return datos.usuario
    },
    [guardarSesion],
  )

  const logout = useCallback(() => {
    borrarSesion()
    setSesion(SIN_SESION)
    setAviso('')
    navigate('/login', { replace: true })
  }, [navigate])

  const valor = useMemo(
    () => ({ ...sesion, login, registrar, logout, cargando, aviso }),
    [sesion, login, registrar, logout, cargando, aviso],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
