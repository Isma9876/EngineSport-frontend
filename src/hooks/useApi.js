import { useCallback, useEffect, useState } from 'react'
import api from '../api.js'

// GET con estados de cargando / error / datos. Pasar ruta null para no pedir nada.
// Siempre pasa por api.js. Devuelve { datos, error, cargando, recargar }.
export default function useApi(ruta) {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState({ clave: null, datos: null, error: null })
  const clave = ruta ? `${ruta}#${intento}` : null

  useEffect(() => {
    if (!clave) return undefined
    let vigente = true
    api
      .get(ruta)
      .then((datos) => vigente && setResultado({ clave, datos, error: null }))
      .catch((error) => vigente && setResultado({ clave, datos: null, error }))
    return () => {
      vigente = false
    }
  }, [clave, ruta])

  const recargar = useCallback(() => setIntento((n) => n + 1), [])

  // Mientras la respuesta guardada no corresponda a la petición actual, se está cargando.
  const actual = resultado.clave === clave
  return {
    datos: actual ? resultado.datos : null,
    error: actual ? resultado.error : null,
    cargando: Boolean(clave) && !actual,
    recargar,
  }
}
