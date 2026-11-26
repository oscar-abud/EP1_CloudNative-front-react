import { useState } from "react";
import { ROLES } from "@/auth/roles";
import { RoleGate } from "@/components/RoleGate";
import { MonitoreoPanel } from "@/components/mensajeria/MonitoreoPanel";
import { ColasPanel } from "@/components/mensajeria/ColasPanel";
import { ExchangesPanel } from "@/components/mensajeria/ExchangesPanel";
import { BindingsPanel } from "@/components/mensajeria/BindingsPanel";
import { KafkaMonitorPanel } from "@/components/kafka/KafkaMonitorPanel";
import { TopicsPanel } from "@/components/kafka/TopicsPanel";
import { ConsumerGroupsPanel } from "@/components/kafka/ConsumerGroupsPanel";

// Las 4 primeras son de RabbitMQ (EP3) y las 3 ultimas de Kafka (EP5).
const TABS = [
  { id: "monitoreo", label: "Monitoreo y DLQ", broker: "RabbitMQ" },
  { id: "colas", label: "Colas", broker: "RabbitMQ" },
  { id: "exchanges", label: "Exchanges", broker: "RabbitMQ" },
  { id: "bindings", label: "Bindings", broker: "RabbitMQ" },
  { id: "kafka-monitor", label: "Streaming", broker: "Kafka" },
  { id: "kafka-topics", label: "Topicos", broker: "Kafka" },
  { id: "kafka-groups", label: "Consumer groups", broker: "Kafka" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function MensajeriaPage() {
  const [tab, setTab] = useState<TabId>("monitoreo");

  return (
    <RoleGate roles={[ROLES.ADMIN]}>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Mensajería (RabbitMQ + Kafka)</h1>
          <p className="text-sm text-gray-400">
            Dos brokers con roles distintos. <span className="text-gray-300">RabbitMQ</span> hace el
            trabajo transaccional: notificaciones, tickets, reintentos con backoff y Dead Letter
            Queue; cada mensaje se entrega a un consumidor y desaparece al confirmarse.{" "}
            <span className="text-gray-300">Kafka</span> retiene el stream de eventos para la
            analítica: varios consumer groups leen lo mismo sin competir y pueden reprocesar el
            histórico. Los administran pedidos360-rabbit-admin y pedidos360-kafka-admin.
          </p>
        </div>

        <nav className="flex flex-wrap gap-1 border-b border-gray-800">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "border-blue-500 text-white"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              <span
                className={`mr-2 rounded-full px-2 py-0.5 text-xs ${
                  t.broker === "Kafka"
                    ? "bg-violet-500/15 text-violet-300"
                    : "bg-orange-500/15 text-orange-300"
                }`}
              >
                {t.broker}
              </span>
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "monitoreo" && <MonitoreoPanel />}
        {tab === "colas" && <ColasPanel />}
        {tab === "exchanges" && <ExchangesPanel />}
        {tab === "bindings" && <BindingsPanel />}
        {tab === "kafka-monitor" && <KafkaMonitorPanel />}
        {tab === "kafka-topics" && <TopicsPanel />}
        {tab === "kafka-groups" && <ConsumerGroupsPanel />}
      </div>
    </RoleGate>
  );
}
