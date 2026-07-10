import { useAsyncAction } from "./createAsyncHook";
export function useAnalytics() { return { track: useAsyncAction(async (_event: string) => ({ ok: true })) }; }
