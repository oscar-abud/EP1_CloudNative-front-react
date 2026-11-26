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
  origen: string;
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

// ============================ Kafka (EP5) ============================

export const CLEANUP_POLICIES = ["delete", "compact", "compact,delete"] as const;
export type CleanupPolicy = (typeof CLEANUP_POLICIES)[number];

export interface KafkaBroker {
  nodeId: number;
  host: string;
  port: number;
  esController: boolean;
}

export interface KafkaCluster {
  clusterId: string;
  controllerId: number;
  brokers: KafkaBroker[];
}

export interface KafkaTopic {
  name: string;
  numPartitions: number;
  replicationFactor: number;
  cleanupPolicy: string;
  // Kafka devuelve las configuraciones como texto (y -1 = sin retencion).
  retentionMs: string | null;
  minInsyncReplicas: string | null;
  particionesSincronizadas: boolean;
  protected: boolean;
}

export interface KafkaTopicInput {
  name: string;
  numPartitions: number;
  replicationFactor: number;
  cleanupPolicy: CleanupPolicy;
  retentionMs?: number;
  minInsyncReplicas?: number;
}

export interface KafkaConsumerGroupResumen {
  groupId: string;
  state: string;
  miembros: number;
  protected: boolean;
}

export interface KafkaParticionLag {
  particion: number;
  offsetCommitteado: number;
  highWatermark: number;
  lag: number;
}

export interface KafkaConsumerGroupTopic {
  topic: string;
  particiones: KafkaParticionLag[];
  lagTotal: number;
}

export interface KafkaConsumerGroupMiembro {
  memberId: string;
  clientId: string;
  clientHost: string;
}

export interface KafkaConsumerGroup extends KafkaConsumerGroupResumen {
  protocol: string;
  members: KafkaConsumerGroupMiembro[];
  topics: KafkaConsumerGroupTopic[];
  lagTotal: number;
}

// Acumulado de ventas por producto (lo calcula el grupo pedidos360-analitica).
export interface MetricaVenta {
  productoId: string;
  nombre: string;
  unidades: number;
  monto: number;
  actualizadoEn: string;
}

// Contador en vivo del grupo pedidos360-back-cache (back-principal).
export interface KafkaResumenEventos {
  total: number;
  porTipo: Record<string, number>;
  particiones: Record<string, number>;
  ultimoEvento: {
    id: string;
    tipo: string;
    ocurridoEn: string;
    partition: number;
    offset: string;
    leidoEn: string;
  } | null;
}
