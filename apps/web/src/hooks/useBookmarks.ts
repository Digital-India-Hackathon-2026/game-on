import { saraloService } from "../services/saraloService";
import { useAsyncAction } from "./createAsyncHook";
export function useBookmarks() { return useAsyncAction(saraloService.bookmarks); }
