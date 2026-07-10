import { saraloService } from "../services/saraloService";
import { useAsyncAction } from "./createAsyncHook";
export function useAI() { return { chat: useAsyncAction(saraloService.aiChat) }; }
