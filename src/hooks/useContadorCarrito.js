import { useEffect, useState } from 'react'
import api from '../api.js'

// Unidades que tiene en el carrito el cliente con sesión (idCliente) o 0 si no aplica.
// Se mantiene al día solo: api.js emite 'carrito:cambio' con cada respuesta de /api/carrito.
export default function useContadorCarrito(idCliente) {
  const [unidades, setUnidades] = useState(0)

  useEffect(() => {
    if (!idCliente) return undefined
    let vigente = true
    const aplicar = (n) => {
      if (vigente && Number.isInteger(n)) setUnidades(n)
    }
    const alCambiar = (e) => aplicar(e.detail?.resumen?.unidades)
    window.addEventListener('carrito:cambio', alCambiar)
    api
      .get('/api/carrito')
      .then((c) => aplicar(c?.resumen?.unidades))
      .catch(() => {})
    return () => {
      vigente = false
      window.removeEventListener('carrito:cambio', alCambiar)
    }
  }, [idCliente])

  return idCliente ? unidades : 0
}
