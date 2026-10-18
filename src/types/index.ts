import type { AppRole } from "@/auth/roles";

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

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
  roles: AppRole[];
}

export interface UsuarioInput {
  nombre: string;
  email: string;
  password: string;
  rol: AppRole;
}

// ---------------------------------------------------------- Mensajería

export interface MensajeDlq {
  id: string;
  eventoId: string | null;
  tipo: string | null;
  colaOrigen: string | null;
  motivo: string;
  intentos: number;
  error: string | null;
  payload: unknown;
  createdAt: string;
}

export interface EventoAuditoria {
  id: string;
  eventoId: string;
  tipo: string;
  routingKey: string | null;
  data: unknown;
  ocurridoEn: string | null;
  registradoEn: string;
}

export interface Ticket {
  id: string;
  numero: string;
  pedidoId: string;
  clienteNombre: string;
  total: number;
  createdAt: string;
}

export type ExchangeType = "direct" | "topic" | "fanout" | "headers";

export const EXCHANGE_TYPES: ExchangeType[] = ["direct", "topic", "fanout", "headers"];

export interface RabbitQueue {
  name: string;
  durable: boolean;
  autoDelete: boolean;
  arguments: Record<string, unknown>;
  messages: number;
  messagesReady: number;
  messagesUnacked: number;
  consumers: number;
  protected: boolean;
}

export interface RabbitQueueInput {
  name: string;
  durable: boolean;
  messageTtlMs?: number;
  maxLength?: number;
  deadLetterExchange?: string;
}

export interface RabbitExchange {
  name: string;
  type: ExchangeType;
  durable: boolean;
  autoDelete: boolean;
  protected: boolean;
}

export interface RabbitExchangeInput {
  name: string;
  type: ExchangeType;
  durable: boolean;
}

export interface RabbitBinding {
  source: string;
  destination: string;
  destinationType: "queue" | "exchange";
  routingKey: string;
  arguments: Record<string, unknown>;
  protected: boolean;
}

export type RabbitBindingInput = Pick<RabbitBinding, "source" | "destination" | "destinationType" | "routingKey">;
