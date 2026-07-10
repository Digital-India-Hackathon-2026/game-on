import { saraloService } from "../services/saraloService";
import { useAsyncAction } from "./createAsyncHook";
export function useHistory() { return useAsyncAction(saraloService.history); }
