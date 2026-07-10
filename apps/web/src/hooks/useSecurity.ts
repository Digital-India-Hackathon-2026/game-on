import { saraloService } from "../services/saraloService";
import { useAsyncAction } from "./createAsyncHook";
export function useSecurity() { return { scan: useAsyncAction(saraloService.securityScan) }; }
