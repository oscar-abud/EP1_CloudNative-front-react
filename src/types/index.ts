export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  activo: boolean;
  createdAt?: string;
}

export interface ProductoInput {
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  activo: boolean;
}

export type PedidoEstado =
  | "pendiente"
  | "en_proceso"
  | "enviado"
  | "entregado"
  | "cancelado";

export interface PedidoItem {
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Pedido {
  id: string;
  clienteNombre: string;
  items: PedidoItem[];
  total: number;
  estado: PedidoEstado;
  createdAt?: string;
}

export interface PedidoItemInput {
  productoId: string;
  cantidad: number;
}

export interface PedidoInput {
  clienteNombre: string;
  items: PedidoItemInput[];
  estado: PedidoEstado;
}

export const PEDIDO_ESTADOS: PedidoEstado[] = [
  "pendiente",
  "en_proceso",
  "enviado",
  "entregado",
  "cancelado",
];