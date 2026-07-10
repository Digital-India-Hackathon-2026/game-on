import type { PaginationQuery } from "./APIModels";

export function parsePagination(query: PaginationQuery): { limit: number; cursor?: string } {
  const limit = Math.min(Number(query.limit ?? 20), 100);
  return { limit: Number.isFinite(limit) && limit > 0 ? limit : 20, cursor: query.cursor };
}

export function createAccepted(id: string, resource: string) {
  return { id, status: "queued", status_url: `/v1/${resource}/${id}`, events_url: `/v1/${resource}/${id}/events` };
}
