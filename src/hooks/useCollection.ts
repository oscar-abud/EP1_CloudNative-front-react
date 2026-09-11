import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/lib/format";

interface CollectionState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useCollection<T>(fetchFn: () => Promise<T[]>): CollectionState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchFn()
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(errorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fetchFn, version]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    setVersion((current) => current + 1);
  }, []);

  return { data, loading, error, reload };
}