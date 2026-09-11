export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-gray-400">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500" />
      <span className="text-sm">{label ?? "Cargando..."}</span>
    </div>
  );
}