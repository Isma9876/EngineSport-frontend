import api from '../api.js'

// Agrega una variante al carrito. El backend exige enteros (no texto).
export async function agregarAlCarrito(idVariante, cantidad = 1) {
  const id_variante = Number(idVariante)
  const cant = Number(cantidad)
  if (!Number.isInteger(id_variante) || !Number.isInteger(cant) || cant < 1) {
    throw { status: 400, message: 'Selecciona una talla y color válidos.' }
  }
  return api.post('/api/carrito/items', { id_variante, cantidad: cant })
}