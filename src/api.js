// Cliente único para la API. Nadie más usa fetch suelto.
const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const RUTA_LOGIN = '/api/auth/login'

let onSessionExpired = null

// AuthContext registra aquí el manejador que cierra la sesión.
export function setOnSessionExpired(fn) {
  onSessionExpired = fn
}

function cabeceras(conJson) {
  const h = {}
  if (conJson) h['Content-Type'] = 'application/json'
  let token = null
  try {
    token = localStorage.getItem('token')
  } catch {
    // localStorage no disponible
  }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

async function leerError(res) {
  let datos = null
  try {
    datos = await res.json()
  } catch {
    // respuesta sin JSON
  }
  return {
    status: res.status,
    message: datos?.message || 'Ocurrió un error inesperado.',
    code: datos?.code,
  }
}

function manejarSesion(ruta, error) {
  const vencida =
    (error.status === 401 && ruta !== RUTA_LOGIN) ||
    (error.status === 403 && error.code === 'CUENTA_DESACTIVADA' && ruta !== RUTA_LOGIN)
  if (vencida && onSessionExpired) onSessionExpired(error)
}

async function pedir(ruta, opciones) {
  let res
  try {
    res = await fetch(`${BASE_URL}${ruta}`, opciones)
  } catch {
    throw { status: 0, message: 'No se pudo conectar con el servidor.', code: 'RED' }
  }
  if (!res.ok) {
    const error = await leerError(res)
    manejarSesion(ruta, error)
    throw error
  }
  return res
}

async function enviar(metodo, ruta, cuerpo) {
  const res = await pedir(ruta, {
    method: metodo,
    headers: cabeceras(cuerpo !== undefined),
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
  })
  if (res.status === 204) return null
  try {
    return await res.json()
  } catch {
    return null
  }
}

export const get = (ruta) => enviar('GET', ruta)
export const post = (ruta, cuerpo = {}) => enviar('POST', ruta, cuerpo)
export const put = (ruta, cuerpo = {}) => enviar('PUT', ruta, cuerpo)
export const del = (ruta) => enviar('DELETE', ruta)

// Descarga un archivo (p. ej. comprobante PDF) con el token y devuelve un Blob.
export async function descargar(ruta) {
  const res = await pedir(ruta, { headers: cabeceras(false) })
  return res.blob()
}

export default { get, post, put, delete: del, descargar, setOnSessionExpired }
