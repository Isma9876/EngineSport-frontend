// Foto de cada categoría (en public/img), elegida por el nombre.
// Sin coincidencia devuelve undefined y el mosaico se muestra sin foto.
const FOTOS = [
  { claves: ['calzado', 'tenis', 'zapat', 'bota'], src: '/img/cat-calzado.webp' },
  { claves: ['ropa', 'camis', 'playera', 'short', 'pantal', 'chama'], src: '/img/cat-ropa.webp' },
  { claves: ['accesor', 'guante', 'mochila', 'bolso'], src: '/img/cat-accesorios.webp' },
  { claves: ['equip', 'fitness', 'gimnas', 'pesa', 'entren'], src: '/img/cat-equipamiento.webp' },
  { claves: ['natac', 'piscina', 'nado'], src: '/img/cat-natacion.webp' },
]

function normalizar(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

export function fotoCategoria(nombre) {
  const n = normalizar(nombre)
  return FOTOS.find((f) => f.claves.some((k) => n.includes(k)))?.src
}

// Foto del mosaico "Todas" (opcional): si el archivo no existe, el mosaico queda en verde liso.
export const FOTO_TODAS = '/img/cat-todas.webp'
