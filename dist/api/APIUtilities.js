"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = parsePagination;
exports.createAccepted = createAccepted;
function parsePagination(query) {
    const limit = Math.min(Number(query.limit ?? 20), 100);
    return { limit: Number.isFinite(limit) && limit > 0 ? limit : 20, cursor: query.cursor };
}
function createAccepted(id, resource) {
    return { id, status: "queued", status_url: `/v1/${resource}/${id}`, events_url: `/v1/${resource}/${id}/events` };
}
