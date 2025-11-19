import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { StatCard } from './components/StatCard';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { ErrorModal } from './components/ErrorModal';
import { ProductStepper } from './components/ProductStepper';
import { Button } from './components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import * as api from './services/api';
import type { PearsonResponse } from './services/api';

// Métodos de pago fijos
const metodosPago = [
  { id: 'Tarjeta', nombre: "Tarjeta" },
  { id: 'Efectivo', nombre: "Efectivo" },
  { id: 'Transferencia', nombre: "Transferencia" },
];

interface VentaLocal {
  id_venta: number;
  fecha: string;
  id_cliente: number;
  metodo_pago: string;
  total_venta: number;
  productos: { [key: number]: number }; // Mapa de id_producto a cantidad
}

export default function App() {
  // --- Estados principales ---
  const [pearson, setPearson] = useState<PearsonResponse | null>(null);
  const [clientes, setClientes] = useState<api.Cliente[]>([]);
  const [productos, setProductos] = useState<api.Producto[]>([]);
  const [ventas, setVentas] = useState<VentaLocal[]>([]);
  const [pieData, setPieData] = useState<{ name: string; value: number }[]>([]);
  const [scatterData, setScatterData] = useState<{ x: number; y: number; name: string }[]>([]);
  const [lineData, setLineData] = useState<any[]>([]);
  const [desvioMetodosPago, setDesvioMetodosPago] = useState<api.DesvioMetodosPago | null>(null);
  const [promediosCategoria, setPromediosCategoria] = useState<
    { categoria: string; promedio: number }[]
  >([]);

  const [selectedVentaId, setSelectedVentaId] = useState<number | null>(null);
  const [formCliente, setFormCliente] = useState<number | null>(null);
  const [formMetodoPago, setFormMetodoPago] = useState<string | null>(null);
  const [formProductos, setFormProductos] = useState<{ [key: number]: number }>({});

  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [errorModal, setErrorModal] = useState<{ show: boolean; title: string; description: string }>({ show: false, title: "", description: "" });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Carga inicial de datos y coeficiente de Pearson
  useEffect(() => { 
    loadInitialData();
    api.getCorrelacionPearson()
      .then(setPearson)
      .catch((err) => {
        console.error("Error Pearson:", err);
        setPearson(null);
      });
  }, []);

  // Carga todos los datos necesarios para los gráficos y la app
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const backendConnected = await api.checkBackendConnection();
      setUsingMockData(!backendConnected);

      const [
        clientesData,
        productosData,
        ventasData,
        pieChartData,
        scatterChartData,
        metodosPagoData
      ] = await Promise.all([
        api.getClientes(),
        api.getProductos(),
        api.getVentas(),
        api.getUnidadesVendidasCategoria(),
        api.getVentasPorProductos(),
        api.getMetodosPagoTiempo()
      ]);
      // tendencia para el gráfico
      setLineData(metodosPagoData.tendencia);
      setDesvioMetodosPago(metodosPagoData.desvio);
      console.log("Desvío estándar:", metodosPagoData.desvio);

      setClientes(clientesData);
      // Asegurar que el precio sea tipo Number si viene como string
      setProductos(productosData.map(p => ({ ...p, precio: Number(p.precio) })));

      const ventasLocales: VentaLocal[] = ventasData.map(v => ({
        id_venta: v.id_venta,
        // Usar la fecha del backend y formatearla
        fecha: new Date(v.fecha).toLocaleDateString('es-ES'),
        id_cliente: v.id_cliente,
        metodo_pago: v.metodo_pago,
        // Usar total_venta directamente del backend/mock
        total_venta: Number(v.total_venta),
        // Mapear los detalles a la estructura local { [id_producto]: cantidad }
        productos: (v.detalles || []).reduce((acc, d) => ({ ...acc, [d.id_producto]: d.cantidad }), {})
      }));

      setVentas(ventasLocales);

      setPieData(pieChartData.map(item => ({ name: item.categoria, value: item.unidades_vendidas })));
      setPromediosCategoria(
        pieChartData.map(item => ({
          categoria: item.categoria,
          promedio: item.promedio
        }))
      );

      setScatterData(
        scatterChartData.map((item, index) => ({
          x: Number(item.precio),
          y: Number(item.cantidad_vendida),
          name: `Producto ${index + 1}`
        }))
      );

    } catch (error) {
      console.error(error);
    } finally { setLoading(false); }
  };

  // Selecciona una venta para editar
  const handleSelectVenta = (ventaId: number) => {
    const venta = ventas.find(v => v.id_venta === ventaId);
    if (!venta) return;

    setSelectedVentaId(ventaId);
    setFormCliente(venta.id_cliente);
    setFormMetodoPago(venta.metodo_pago);
    setFormProductos(venta.productos || {});
  };

  // Cambia la cantidad de un producto en el formulario
  const handleProductoChange = (productoId: number, cantidad: number) => {
    // Si la cantidad es 0, se remueve el producto, si no, se actualiza.
    setFormProductos(prev => {
      if (cantidad <= 0) {
        const { [productoId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productoId]: cantidad };
    });
  };

  // Calcula totales para el formulario de venta
  const calcularTotales = () => {
    let totalProductos = 0, montoTotal = 0;
    Object.entries(formProductos).forEach(([prodId, cantidad]) => {
      const producto = productos.find(p => p.id_producto === parseInt(prodId));
      if (producto && cantidad > 0) {
        totalProductos += cantidad;
        montoTotal += producto.precio * cantidad;
      }
    });
    return { totalProductos, montoTotal };
  };
  const { totalProductos, montoTotal } = calcularTotales();

  // Limpia el formulario de venta
  const handleLimpiarFormulario = () => {
    setSelectedVentaId(null);
    setFormCliente(null);
    setFormMetodoPago(null);
    setFormProductos({});
  };

  // Guardar (crear o actualizar) una venta
  const handleGuardar = async () => {
    // Validaciones
    if (!formCliente || !formMetodoPago) {
      setErrorModal({ show: true, title: "Error", description: "Debe seleccionar cliente y método de pago" });
      return;
    }

    const productosConCantidad = Object.entries(formProductos).filter(([_, cantidad]) => cantidad > 0);

    if (productosConCantidad.length === 0) {
      setErrorModal({ show: true, title: "Error", description: "Debe agregar al menos un producto con cantidad mayor a cero." });
      return;
    }

    const ventaToSave: api.VentaCreate = {
      // Usamos la fecha actual para crear o actualizar el registro en la DB
      fecha: new Date().toISOString(),
      id_cliente: formCliente,
      metodo_pago: formMetodoPago,
      detalles: productosConCantidad.map(([id, cantidad]) => ({
        id_producto: parseInt(id),
        cantidad,
        precio_unitario: productos.find(p => p.id_producto === parseInt(id))?.precio || 0
      }))
    };

    try {
      let savedVenta: api.Venta;
      if (selectedVentaId) {
        // --- Actualizar Venta ---
        savedVenta = await api.updateVenta(selectedVentaId, ventaToSave);
        setVentas(prev => prev.map(v => v.id_venta === selectedVentaId ? ({
          ...v,
          // Mantenemos la fecha local (o usamos la del API si es necesario formatearla)
          fecha: new Date(savedVenta.fecha).toLocaleDateString('es-ES'),
          id_cliente: savedVenta.id_cliente,
          metodo_pago: savedVenta.metodo_pago,
          // Mapeamos los detalles a la estructura local
          productos: (savedVenta.detalles || []).reduce((acc, d) => ({ ...acc, [d.id_producto]: d.cantidad }), {}),
          total_venta: Number(savedVenta.total_venta)
        }) : v));

      } else {
        // --- Crear Venta ---
        savedVenta = await api.createVenta(ventaToSave);
        const nuevaVenta: VentaLocal = {
          id_venta: savedVenta.id_venta,
          // Formatear la fecha recibida del API
          fecha: new Date(savedVenta.fecha).toLocaleDateString('es-ES'),
          id_cliente: savedVenta.id_cliente,
          metodo_pago: savedVenta.metodo_pago,
          productos: (savedVenta.detalles || []).reduce((acc, d) => ({ ...acc, [d.id_producto]: d.cantidad }), {}),
          total_venta: Number(savedVenta.total_venta)
        };
        setVentas(prev => [...prev, nuevaVenta]);
      }

      handleLimpiarFormulario();
      // Recargar datos de gráficos si se modificaron ventas
      loadInitialData();

    } catch (error) {
      setErrorModal({ show: true, title: "Error", description: "No se pudo guardar la venta" });
    }
  };

  // Borrar una venta seleccionada
  const handleBorrar = () => selectedVentaId ? setShowConfirmDelete(true) : null;
  const confirmBorrar = async () => {
    if (!selectedVentaId) return;
    try {
      await api.deleteVenta(selectedVentaId);
      setVentas(prev => prev.filter(v => v.id_venta !== selectedVentaId));
      handleLimpiarFormulario();
      setShowConfirmDelete(false);
      // Recargar datos de gráficos
      loadInitialData();
    } catch (error) {
      setErrorModal({ show: true, title: "Error", description: "No se pudo eliminar la venta" });
    }
  };

  // Obtiene los datos a mostrar en la tabla de ventas
  const getVentaDisplay = (venta: VentaLocal) => {
    const cliente = clientes.find(c => c.id_cliente === venta.id_cliente);
    const metodo = metodosPago.find(m => m.id === venta.metodo_pago);
    const cantidadProductos = Object.values(venta.productos).reduce((sum, val) => sum + val, 0);
    return {
      cliente: cliente?.nombre || "N/A",
      metodo: metodo?.nombre || "N/A",
      cantidadProductos,
      monto: venta.total_venta // Usar la propiedad ya calculada/retornada del API
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner de conexión */}
      {usingMockData && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-yellow-800">Modo Demostración</span>
              </div>
              <span className="text-yellow-700 text-sm">Backend no disponible - usando datos de prueba</span>
            </div>
            <button onClick={loadInitialData} className="text-yellow-800 hover:text-yellow-900 text-sm underline">Reintentar conexión</button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6 py-12 px-4 sm:px-6 lg:px-8">

        {/* --- Gráficos --- */}
        <StatCard>
          <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-6">
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center">
              <h2 className="text-lg font-semibold text-teal-600 mb-3 border border-teal-400 px-4 py-2 rounded-lg bg-teal-50">
                Ventas por Categoría
              </h2>
              <p className="text-gray-600 text-sm">Proporción de unidades vendidas por categoría.</p>
            </div>
          </div>

          {/* === PROMEDIO POR CATEGORÍA === */}
          {promediosCategoria.length > 0 && (
            <div className="max-w-md mx-auto mt-8 p-6 bg-white border border-gray-200 rounded-lg">
              <h2 className="text-gray-900 text-lg font-semibold mb-6">
                Promedio por Categoría
              </h2>
              <div className="space-y-5">
                {promediosCategoria.map((cat, index) => (
                  <div
                    key={cat.categoria}
                    className={`flex justify-between items-center ${index < promediosCategoria.length - 1 ? 'pb-3 border-b border-gray-100' : ''
                      }`}
                  >
                    <span className="text-gray-600">{cat.categoria}</span>
                    <span className="text-xl font-semibold text-gray-900">
                      {cat.promedio.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </StatCard>

        <StatCard>
          <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
            <div className="flex flex-col justify-center order-2 lg:order-1">
              <h2 className="text-lg font-semibold text-teal-600 mb-3 border border-teal-400 px-4 py-2 rounded-lg bg-teal-50">Precio vs Cantidad Vendida</h2>
              <p className="text-gray-600">Cada punto representa un producto.</p>
              {pearson && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <span className="text-sm text-blue-900 font-semibold">
                    Coeficiente de Pearson: <span className="font-mono">{pearson.coeficiente}</span>
                  </span>
                  <span className="ml-2 text-sm text-blue-700">
                    ({pearson.interpretacion})
                  </span>
                </div>
              )}
            </div>
            <div className="h-64 flex items-center justify-center order-1 lg:order-2">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid />
                  <XAxis type="number" dataKey="x" name="precio" unit="$" />
                  <YAxis type="number" dataKey="y" name="cantidad_vendida" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Productos" data={scatterData} fill="#3b82f6" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </StatCard>

        <StatCard>
          <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-6">
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Tarjeta" stroke="#3b82f6" name="Tarjeta" />
                  <Line type="monotone" dataKey="Efectivo" stroke="#10b981" name="Efectivo" />
                  <Line type="monotone" dataKey="Transferencia" stroke="#f59e0b" name="Transferencia" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col justify-center">
              <h2 className="text-teal-600 mb-3 border border-teal-400 px-4 py-2 rounded-lg bg-teal-50">
                Tendencia de Métodos de Pago
              </h2>
              <p className="text-gray-600">Evolución de ventas por método de pago.</p>
            </div>
          </div>

          {desvioMetodosPago && (
            <div className="max-w-md mx-auto mt-8 p-6 bg-white border border-gray-200 rounded-lg">
              <h2 className="text-gray-900 text-lg font-semibold mb-6">
                Desvío Estándar
              </h2>

              <div className="space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Tarjeta</span>
                  <span className="text-xl font-semibold text-gray-900">
                    {desvioMetodosPago.Tarjeta.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-gray-600">Efectivo</span>
                  <span className="text-xl font-semibold text-gray-900">
                    {desvioMetodosPago.Efectivo.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Transferencia</span>
                  <span className="text-xl font-semibold text-gray-900">
                    {desvioMetodosPago.Transferencia.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

        </StatCard>

        {/* --- Gestión de Ventas --- */}
        <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6">

          {/* Tabla de ventas */}
          <StatCard>
            <h2 className="text-gray-900 mb-4">Historial de Ventas</h2>
            <div className="overflow-auto max-h-[600px] border rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-700">Fecha</th>
                    <th className="px-4 py-3 text-left text-gray-700">Cliente</th>
                    <th className="px-4 py-3 text-left text-gray-700">Método</th>
                    <th className="px-4 py-3 text-left text-gray-700">Cant. Productos</th>
                    <th className="px-4 py-3 text-left text-gray-700">Monto Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map(v => {
                    const d = getVentaDisplay(v);
                    return (
                      <tr key={v.id_venta} onClick={() => handleSelectVenta(v.id_venta)} className={`cursor-pointer hover:bg-gray-50 transition-colors ${selectedVentaId === v.id_venta ? 'bg-blue-100' : ''}`}>
                        <td className="px-4 py-3 border-t text-gray-900">{v.fecha}</td>
                        <td className="px-4 py-3 border-t text-gray-900">{d.cliente}</td>
                        <td className="px-4 py-3 border-t text-gray-900">{d.metodo}</td>
                        <td className="px-4 py-3 border-t text-gray-900">{d.cantidadProductos}</td>
                        <td className="px-4 py-3 border-t text-gray-900">${d.monto.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </StatCard>

          {/* Formulario de ventas */}
          <StatCard>
            <h2 className="text-gray-900 mb-4">Formulario de Venta</h2>
            <div className="space-y-4">

              {/* Cliente */}
              <div>
                <label className="block text-gray-700 mb-2">Cliente</label>
                <Select
                  value={formCliente?.toString() || ""}
                  onValueChange={(v: string) => setFormCliente(parseInt(v))}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccionar Cliente..." /></SelectTrigger>
                  <SelectContent>{clientes.map(c => <SelectItem key={c.id_cliente} value={c.id_cliente.toString()}>{c.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {/* Método de Pago */}
              <div>
                <label className="block text-gray-700 mb-2">Método de Pago</label>
                <Select value={formMetodoPago || ""} onValueChange={setFormMetodoPago}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar Método..." /></SelectTrigger>
                  <SelectContent>{metodosPago.map(m => <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {/* Productos */}
              <div>
                <h3 className="text-gray-900 mb-2">Productos</h3>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-auto max-h-[250px]">
                    <table className="w-full table-fixed">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="w-[30%] px-2 py-2 text-left text-gray-700 text-xs sm:text-sm">Producto</th>
                          <th className="w-[20%] px-2 py-2 text-left text-gray-700 text-xs sm:text-sm">Categoría</th>
                          <th className="w-[20%] px-2 py-2 text-left text-gray-700 text-xs sm:text-sm">Precio</th>
                          <th className="w-[30%] px-2 py-2 text-left text-gray-700 text-xs sm:text-sm">Cantidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productos.map(p => (
                          <tr key={p.id_producto} className="hover:bg-gray-50">
                            <td className="px-2 py-1 border-t">{p.nombre}</td>
                            <td className="px-2 py-1 border-t">{p.categoria}</td>
                            <td className="px-2 py-1 border-t">${p.precio.toFixed(2)}</td>
                            <td className="px-2 py-1 border-t">
                              <ProductStepper value={formProductos[p.id_producto] || 0} onChange={(val) => handleProductoChange(p.id_producto, val)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Totales */}
              <div className="flex justify-between">
                <span>Total Productos: **{totalProductos}**</span>
                <span>Monto Total: **${montoTotal.toFixed(2)}**</span>
              </div>

              {/* Botones */}
              <div className="flex gap-2 justify-end mt-2">
                <Button onClick={handleLimpiarFormulario} variant="secondary">Nuevo</Button>
                <Button onClick={handleGuardar} variant="default">Guardar</Button>
                {selectedVentaId && <Button onClick={handleBorrar} variant="destructive">Borrar</Button>}
                <Button onClick={handleLimpiarFormulario} variant="outline">Descartar</Button>
              </div>

            </div>
          </StatCard>

        </div>
      </div>

      {/* Modales */}
      <ConfirmDeleteModal open={showConfirmDelete} onOpenChange={setShowConfirmDelete} onConfirm={confirmBorrar} />
      <ErrorModal open={errorModal.show} onOpenChange={(show) => setErrorModal({ ...errorModal, show })} title={errorModal.title} description={errorModal.description} />
    </div>
  );
}