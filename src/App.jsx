import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import RutaProtegida from './components/RutaProtegida.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/auth/Login.jsx'
import Registro from './pages/auth/Registro.jsx'
import Productos from './pages/catalogo/Productos.jsx'
import ProductoDetalle from './pages/catalogo/ProductoDetalle.jsx'
import Carrito from './pages/ventas/Carrito.jsx'
import Checkout from './pages/ventas/Checkout.jsx'
import MisPedidos from './pages/ventas/MisPedidos.jsx'
import Admin from './pages/admin/Admin.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import Confirmacion from './pages/ventas/Confirmacion.jsx'
import PedidosAdmin from './pages/admin/PedidosAdmin.jsx'
import CuponesAdmin from './pages/admin/CuponesAdmin.jsx'
import CategoriasAdmin from './pages/admin/CategoriasAdmin.jsx'
import ProveedoresAdmin from './pages/admin/ProveedoresAdmin.jsx'
import ProductosAdmin from './pages/admin/ProductosAdmin.jsx'
import { lazy, Suspense } from 'react'
import Cargando from './components/Cargando.jsx'

const ReportesAdmin = lazy(() => import('./pages/admin/ReportesAdmin.jsx'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/productos/:id" element={<ProductoDetalle />} />
        <Route path="*" element={<h2>Página no encontrada</h2>} />

        <Route element={<RutaProtegida tipo="cliente" />}>
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/mis-pedidos" element={<MisPedidos />} />
          <Route path="/confirmacion/:id" element={<Confirmacion />} />
        </Route>

        <Route element={<RutaProtegida tipo="empleado" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Admin />} />
            <Route path="/admin/pedidos" element={<PedidosAdmin />} />
            <Route path="/admin/cupones" element={<CuponesAdmin />} />
            <Route path="/admin/categorias" element={<CategoriasAdmin />} />
            <Route path="/admin/proveedores" element={<ProveedoresAdmin />} />
            <Route path="/admin/productos" element={<ProductosAdmin />} />
            <Route
              path="/admin/reportes" element={<Suspense fallback={<Cargando texto="Cargando reportes..." />}>
                  <ReportesAdmin />
                </Suspense>
                }
                />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}
