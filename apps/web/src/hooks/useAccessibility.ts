import { saraloService } from "../services/saraloService";
import { useAsyncAction } from "./createAsyncHook";
export function useAccessibility() { return { capabilities: useAsyncAction(saraloService.capabilities) }; }
