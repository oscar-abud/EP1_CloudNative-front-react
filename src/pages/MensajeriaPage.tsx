import { useState } from "react";
import { ROLES } from "@/auth/roles";
import { RoleGate } from "@/components/RoleGate";
import { MonitoreoPanel } from "@/components/mensajeria/MonitoreoPanel";
import { ColasPanel } from "@/components/mensajeria/ColasPanel";
import { ExchangesPanel } from "@/components/mensajeria/ExchangesPanel";
import { BindingsPanel } from "@/components/mensajeria/BindingsPanel";

const TABS = [
  { id: "monitoreo", label: "Monitoreo y DLQ" },
  { id: "colas", label: "Colas" },
  { id: "exchanges", label: "Exchanges" },
  { id: "bindings", label: "Bindings" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function MensajeriaPage() {
  const [tab, setTab] = useState<TabId>("monitoreo");

  return (
    <RoleGate roles={[ROLES.ADMIN]}>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Mensajería (RabbitMQ)</h1>
          <p className="text-sm text-gray-400">
            Eventos asíncronos de Pedidos360: notificaciones, tickets, reintentos con backoff y
            Dead Letter Queue. La administración de colas, exchanges y bindings la atiende el
            microservicio pedidos360-rabbit-admin.
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
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "monitoreo" && <MonitoreoPanel />}
        {tab === "colas" && <ColasPanel />}
        {tab === "exchanges" && <ExchangesPanel />}
        {tab === "bindings" && <BindingsPanel />}
      </div>
    </RoleGate>
  );
}
