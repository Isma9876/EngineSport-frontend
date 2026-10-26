# EngineSport Frontend — reglas del equipo

Vite + React (JavaScript, no TypeScript), React Router, Tailwind CSS v4, Stripe. Node 24 LTS. Textos de la interfaz en español. Detalle completo en README.md.

## Reglas
- Toda llamada a la API pasa por `src/api.js`; nadie usa `fetch` suelto. Agrega `Authorization: Bearer <token>` y, ante 401 (salvo login) o 403 `CUENTA_DESACTIVADA`, cierra sesión y manda a `/login`. `api.js` no importa React.
- El token vive en `localStorage` con la clave `token` (el usuario, en `usuario`). La sesión se maneja con `useAuth()` de `src/context/AuthContext.jsx`.
- Prohibido `dangerouslySetInnerHTML`.
- Los DECIMAL llegan como texto ("150.00"): `Number()` para operar; `formatoPrecio()` de `src/utils/formato.js` para mostrar.
- Disponibilidad: mostrar el campo `estado` (`disponible`, `pocas_unidades`, `agotado`), nunca el stock exacto.
- Al comprar se envía el `id` de la variante.
- Toda página que pide datos muestra `<Cargando />` y maneja el error (el backend en Render tarda en despertar).
- Colores y tipografías se definen una sola vez, en el bloque `@theme` de `src/index.css` (Tailwind v4).
- Archivos compartidos (`App.jsx`, `Layout.jsx`): solo agregar líneas propias, cambios mínimos. PR pequeños, ramas `feature/...`.
- Cambios al stack o a estas reglas: avisar al grupo.
- No subir `.env` ni claves; solo la clave pública de Stripe (`pk_test_...`).

## Estructura
```
src/
  api.js
  context/      AuthContext.jsx
  components/   Layout, RutaProtegida, Cargando, ...
  utils/        formato.js
  pages/        Home.jsx
    auth/ catalogo/ ventas/ admin/
```
