"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityHistoryRepository = void 0;
class SecurityHistoryRepository {
    records = [];
    async save(record) {
        this.records.push(record);
    }
    async list() {
        return [...this.records];
    }
}
exports.SecurityHistoryRepository = SecurityHistoryRepository;
