import { useEffect } from "react";

// Ejecuta callback cada intervalMs mientras el componente esté montado
// (refresco "en vivo" de colas y DLQ sin WebSocket: el API Gateway corta
// las conexiones largas).
export function usePolling(callback: () => void, intervalMs: number): void {
  useEffect(() => {
    const timer = window.setInterval(callback, intervalMs);
    return () => window.clearInterval(timer);
  }, [callback, intervalMs]);
}
