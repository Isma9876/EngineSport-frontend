import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { setOnSessionExpired } from '../api.js'

const AuthContext = createContext(null)

function leerSesion() {
  try {
    const token = localStorage.getItem('token')
    const usuario = JSON.parse(localStorage.getItem('usuario'))
    if (token && usuario) return { token, usuario }
  } catch {
    // datos corruptos o localStorage no disponible
  }
  return { token: null, usuario: null }
}

function borrarSesion() {
  try {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
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
      setSesion({ token: null, usuario: null })
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
    localStorage.setItem('token', datos.token)
    localStorage.setItem('usuario', JSON.stringify(datos.usuario))
    setSesion({ token: datos.token, usuario: datos.usuario })
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
    setSesion({ token: null, usuario: null })
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
