import { env } from "@/config/env";

// Rutas del backend (a través del API Gateway). Centralizadas acá para no
// repetir los strings literales en cada página (DRY).
export const ENDPOINT_PRODUCTOS: string = "/productos";
export const ENDPOINT_PEDIDOS: string = "/pedidos";
export const ENDPOINT_USUARIOS: string = "/usuarios";
export const ENDPOINT_MENSAJERIA: string = "/mensajeria";

// Microservicio pedidos360-rabbit-admin: URL absoluta (puede ser otro host
// que el back; axios ignora baseURL cuando la URL es absoluta).
export const ENDPOINT_RABBIT_QUEUES: string = `${env.rabbitAdminUrl}/rabbit/queues`;
export const ENDPOINT_RABBIT_EXCHANGES: string = `${env.rabbitAdminUrl}/rabbit/exchanges`;
export const ENDPOINT_RABBIT_BINDINGS: string = `${env.rabbitAdminUrl}/rabbit/bindings`;

// Microservicio pedidos360-kafka-admin: URL absoluta, igual que el de Rabbit.
export const ENDPOINT_KAFKA_CLUSTER: string = `${env.kafkaAdminUrl}/kafka/cluster`;
export const ENDPOINT_KAFKA_TOPICS: string = `${env.kafkaAdminUrl}/kafka/topics`;
export const ENDPOINT_KAFKA_GROUPS: string = `${env.kafkaAdminUrl}/kafka/consumer-groups`;
