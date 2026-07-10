import { useCallback, useState } from "react";
export function useAsyncAction<TArgs extends unknown[], TResult>(action: (...args: TArgs) => Promise<TResult>) {
  const [data, setData] = useState<TResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const run = useCallback(async (...args: TArgs) => {
    setLoading(true); setError(null);
    try { const result = await action(...args); setData(result); return result; }
    catch (err) { const error = err instanceof Error ? err : new Error(String(err)); setError(error); throw error; }
    finally { setLoading(false); }
  }, [action]);
  return { data, error, loading, run };
}
