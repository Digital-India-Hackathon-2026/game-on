import { useAsyncAction } from "./createAsyncHook";
export function useNotes() { return useAsyncAction(async () => [] as unknown[]); }
