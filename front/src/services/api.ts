
const API_BASE_URL = 'http://localhost:3001/api';

// Variable para rastrear si el backend está disponible
let backendAvailable: boolean | null = null;

//  Funcion para verificar si el backend está disponible
export const checkBackendConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/productos`, { method: 'HEAD' });
    backendAvailable = response.ok;
    return backendAvailable;
  } catch {
    backendAvailable = false;
    return false;
  }
};

// Función para obtener el estado del backend
export const isUsingMockData = (): boolean => {
  return backendAvailable === false;
};

// Datos mock para cuando el backend no esté disponible
const MOCK_CLIENTES: Cliente[] = [
  { id_cliente: 1, nombre: "Juan Pérez", sexo: "M", edad: 28, codigo_postal: "28001", correo: "juan@example.com" },
  { id_cliente: 2, nombre: "María García", sexo: "F", edad: 34, codigo_postal: "28002", correo: "maria@example.com" },
  { id_cliente: 3, nombre: "Carlos López", sexo: "M", edad: 45, codigo_postal: "28003", correo: "carlos@example.com" },
  { id_cliente: 4, nombre: "Ana Martínez", sexo: "F", edad: 29, codigo_postal: "28004", correo: "ana@example.com" },
  { id_cliente: 5, nombre: "Luis Rodríguez", sexo: "M", edad: 52, codigo_postal: "28005", correo: "luis@example.com" },
];

const MOCK_PRODUCTOS: Producto[] = [
  { id_producto: 1, nombre: "Papas Fritas", precio: 2.50, marca: "Lays", categoria: "Snacks", stock: 100, descripcion: "Papas fritas clásicas", saludable: false },
  { id_producto: 2, nombre: "Galletas Oreo", precio: 3.80, marca: "Nabisco", categoria: "Snacks", stock: 80, descripcion: "Galletas de chocolate", saludable: false },
  { id_producto: 3, nombre: "Coca Cola 2L", precio: 2.90, marca: "Coca Cola", categoria: "Bebidas", stock: 150, descripcion: "Bebida gaseosa", saludable: false },
  { id_producto: 4, nombre: "Agua Mineral 1.5L", precio: 1.20, marca: "Evian", categoria: "Bebidas", stock: 200, descripcion: "Agua natural", saludable: true },
  { id_producto: 5, nombre: "Detergente", precio: 5.50, marca: "Ariel", categoria: "Limpieza", stock: 60, descripcion: "Detergente líquido", saludable: false },
  { id_producto: 6, nombre: "Arroz 1kg", precio: 1.80, marca: "Diana", categoria: "Alimentos", stock: 120, descripcion: "Arroz blanco", saludable: true },
  { id_producto: 7, nombre: "Yogur Natural", precio: 3.20, marca: "Danone", categoria: "Alimentos", stock: 90, descripcion: "Yogur sin azúcar", saludable: true },
  { id_producto: 8, nombre: "Cerveza Lata", precio: 1.50, marca: "Heineken", categoria: "Bebidas", stock: 180, descripcion: "Cerveza premium", saludable: false },
];

const MOCK_VENTAS: Venta[] = [
  { id_venta: 1, fecha: "2025-11-01T10:30:00Z", id_cliente: 1, metodo_pago: "Tarjeta", total_venta: 15.40 },
  { id_venta: 2, fecha: "2025-11-02T14:20:00Z", id_cliente: 2, metodo_pago: "Efectivo", total_venta: 8.70 },
  { id_venta: 3, fecha: "2025-11-03T09:15:00Z", id_cliente: 3, metodo_pago: "Transferencia", total_venta: 22.50 },
  { id_venta: 4, fecha: "2025-11-05T16:45:00Z", id_cliente: 4, metodo_pago: "Tarjeta", total_venta: 12.30 },
  { id_venta: 5, fecha: "2025-11-07T11:00:00Z", id_cliente: 5, metodo_pago: "Efectivo", total_venta: 18.90 },
];

const MOCK_PIE_DATA: UnidadesVendidasCategoria[] = [
  { categoria: "Snacks", unidades_vendidas: 45 },
  { categoria: "Bebidas", unidades_vendidas: 78 },
  { categoria: "Limpieza", unidades_vendidas: 23 },
  { categoria: "Alimentos", unidades_vendidas: 56 },
];


const MOCK_LINE_DATA: MetodoPagoTiempo[] = [
  { fecha: "2025-11-01", Tarjeta: 450, Transferencia: 320, Efectivo: 180 },
  { fecha: "2025-11-02", Tarjeta: 520, Transferencia: 280, Efectivo: 220 },
  { fecha: "2025-11-03", Tarjeta: 480, Transferencia: 390, Efectivo: 150 },
  { fecha: "2025-11-04", Tarjeta: 610, Transferencia: 340, Efectivo: 200 },
  { fecha: "2025-11-05", Tarjeta: 550, Transferencia: 420, Efectivo: 170 },
  { fecha: "2025-11-06", Tarjeta: 590, Transferencia: 380, Efectivo: 190 },
  { fecha: "2025-11-07", Tarjeta: 640, Transferencia: 450, Efectivo: 210 },
];

// Interfaces basadas en la estructura de la base de datos
export interface Cliente {
  id_cliente: number;
  nombre: string;
  sexo: string;
  edad: number;
  codigo_postal: string;
  correo: string;
}

export interface Producto {
  id_producto: number;
  nombre: string;
  precio: number;
  marca: string;
  categoria: string;
  stock: number;
  descripcion: string;
  saludable: boolean;
}

export interface DetalleVenta {
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
}

export interface Venta {
  id_venta: number;
  fecha: string;
  id_cliente: number;
  metodo_pago: string;
  total_venta: number;
  detalles?: DetalleVenta[];
}

export interface VentaCreate {
  fecha: string;
  id_cliente: number;
  metodo_pago: string;
  detalles: DetalleVenta[];
}

// Interfaces para estadísticas
export interface UnidadesVendidasCategoria {
  categoria: string;
  unidades_vendidas: number;
}

export interface VentaPorProducto {
  precio: string;            // viene como "1500.00"
  cantidad_vendida: string;  // viene como "21"
}

export interface MetodoPagoTiempo {
  fecha: string;
  Tarjeta: number;
  Transferencia: number;
  Efectivo: number;
}

export interface DesvioMetodosPago {
  Tarjeta: number;
  Efectivo: number;
  Transferencia: number;
}

export interface RespuestaMetodosPago {
  tendencia: MetodoPagoTiempo[];
  desvio: DesvioMetodosPago;
}


// ==================== CRUD ENDPOINTS ====================

// Clientes
export const getClientes = async (): Promise<Cliente[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/clientes`);
    if (!response.ok) throw new Error('Error al obtener clientes');

    const data = await response.json(); 
    console.log(data); 
    return data;
  } catch (error) {
    console.warn('Backend no disponible, usando datos mock para clientes');
    return MOCK_CLIENTES;
  }
};


// Productos
export const getProductos = async (): Promise<Producto[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/productos`);
    if (!response.ok) throw new Error('Error al obtener productos');
    return response.json();
  } catch (error) {
    console.warn('Backend no disponible, usando datos mock para productos');
    return MOCK_PRODUCTOS;
  }
};

// Ventas
export const getVentas = async (): Promise<Venta[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ventas`);
    if (!response.ok) throw new Error('Error al obtener ventas');
    return response.json();
  } catch (error) {
    console.warn('Backend no disponible, usando datos mock para ventas');
    return MOCK_VENTAS;
  }
};

export const createVenta = async (venta: VentaCreate): Promise<Venta> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ventas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(venta),
    });
    if (!response.ok) throw new Error('Error al crear venta');
    return response.json();
  } catch (error) {
    console.warn('Backend no disponible, simulando creación de venta');
    // Simular creación de venta
    const nuevaVenta: Venta = {
      id_venta: Math.floor(Math.random() * 10000),
      fecha: venta.fecha,
      id_cliente: venta.id_cliente,
      metodo_pago: venta.metodo_pago,
      total_venta: venta.detalles.reduce((sum, d) => sum + (d.cantidad * d.precio_unitario), 0),
    };
    return nuevaVenta;
  }
};

export const updateVenta = async (id: number, venta: Partial<VentaCreate>): Promise<Venta> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ventas/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(venta),
    });
    if (!response.ok) throw new Error('Error al actualizar venta');
    return response.json();
  } catch (error) {
    console.warn('Backend no disponible, simulando actualización de venta');
    // Simular actualización de venta
    const ventaActualizada: Venta = {
      id_venta: id,
      fecha: venta.fecha || new Date().toISOString(),
      id_cliente: venta.id_cliente || 1,
      metodo_pago: venta.metodo_pago || 'Tarjeta',
      total_venta: venta.detalles ? venta.detalles.reduce((sum, d) => sum + (d.cantidad * d.precio_unitario), 0) : 0,
    };
    return ventaActualizada;
  }
};

export const deleteVenta = async (id: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ventas/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Error al eliminar venta');
  } catch (error) {
    console.warn('Backend no disponible, simulando eliminación de venta');
    // Simular eliminación
  }
};

// ==================== ENDPOINTS DE ESTADÍSTICAS ====================

export const getUnidadesVendidasCategoria = async (): Promise<UnidadesVendidasCategoria[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/estadisticas/unidades-vendidas-categoria`);
    if (!response.ok) throw new Error('Error al obtener estadísticas por categoría');

    const data = await response.json();
    return data.map((r: any) => ({
      categoria: String(r.categoria),
      unidades_vendidas: Number(r.unidades_vendidas)
    }));

  } catch (error) {
    console.warn('Backend no disponible, usando datos mock para estadísticas de categoría');
    return MOCK_PIE_DATA;
  }
};


export const getVentasPorProductos = async (): Promise<VentaPorProducto[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/estadisticas/ventas-por-productos`);
    if (!response.ok) throw new Error('Error al obtener ventas por productos');
    return response.json();
  } catch (error) {
    console.warn('Backend no disponible, usando datos mock para ventas por productos');
    return MOCK_SCATTER_DATA;
  }
};

export const getMetodosPagoTiempo = async (): Promise<RespuestaMetodosPago> => {
  try {
    const response = await fetch(`${API_BASE_URL}/estadisticas/metodos-pago-tiempo`);
    if (!response.ok) throw new Error('Error al obtener métodos de pago por tiempo');
    return response.json();
  } catch (error) {
    console.warn('Backend no disponible, usando datos mock para métodos de pago');
    return {
      tendencia: MOCK_LINE_DATA,
      desvio: {
        Tarjeta: 0,
        Efectivo: 0,
        Transferencia: 0
      }
    };
  }
};
