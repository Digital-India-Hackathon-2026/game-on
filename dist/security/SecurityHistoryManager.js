"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityHistoryManager = void 0;
const SecurityRepositories_1 = require("./SecurityRepositories");
class SecurityHistoryManager {
    repository;
    constructor(repository = new SecurityRepositories_1.SecurityHistoryRepository()) {
        this.repository = repository;
    }
    async record(result) {
        await this.repository.save(result);
    }
    list() {
        return this.repository.list();
    }
}
exports.SecurityHistoryManager = SecurityHistoryManager;
