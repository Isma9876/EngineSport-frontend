# EngineSport Frontend

Frontend en React de EngineSport (tienda de artículos deportivos). Proyecto final de Desarrollo Web, UMG. Consume la API del repo `EngineSport` (backend).

## Stack

- Node 24 LTS, Vite, React, React Router, Tailwind CSS.
- Sesión con Context API. Una sola forma de llamar a la API: `api.js`.
- Despliegue: Render Static Site.

## Puesta en marcha

```
npm install
copy .env.example .env
npm run dev
```

Completa `.env` con los valores de `.env.example`. El `.env` no se sube a GitHub.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `VITE_API_URL` | URL base de la API |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe (`pk_test_...`), nunca la secreta |

## Reglas del equipo

- Todos llamamos a la API con `api.js`; nadie usa `fetch` suelto. `api.js` agrega `Authorization: Bearer <token>` y manda al login ante un 401.
- El token se guarda en `localStorage` con la clave `token`.
- No usar `dangerouslySetInnerHTML`.
- Los DECIMAL llegan como texto (`"150.00"`): convertir con `Number()` para mostrar y operar.
- La disponibilidad se muestra con el campo `estado` (`disponible`, `pocas_unidades`, `agotado`), nunca con el stock exacto.
- El `id` de la variante es el que se envía al comprar.
- Toda página que pide datos muestra un indicador de carga y maneja el error (el backend en Render free tarda en despertar).
- Colores y tipografías se definen una sola vez en `tailwind.config`.
- Archivos compartidos (`App.jsx`, layout): solo agregar líneas propias, con cambios mínimos. `git pull` de `main` seguido y PR pequeños.
- Cambios al stack o a estas reglas: avisar al grupo antes.

## Estructura de carpetas

```
src/
  pages/
    auth/
    catalogo/
    ventas/
    admin/
  components/   (lo compartido: Cargando, botones, tarjeta de producto)
```

## Flujo de trabajo

Cada persona trabaja en una rama `feature/...` y se integra a `main` con Pull Request y revisión de otra persona.