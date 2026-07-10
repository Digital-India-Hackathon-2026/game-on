import { saraloService } from "../services/saraloService";
import { useAsyncAction } from "./createAsyncHook";
export function useVoice() { return { preferences: useAsyncAction(saraloService.voicePreferences) }; }
