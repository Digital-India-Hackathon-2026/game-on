"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOpenApiDocument = generateOpenApiDocument;
const APIRoutes_1 = require("./APIRoutes");
function generateOpenApiDocument() {
    return {
        openapi: "3.1.0",
        info: { title: "Saralo REST API", version: "v1" },
        paths: Object.fromEntries(APIRoutes_1.apiRoutes.map((route) => [
            route.path.replace(/\{([^}]+)\}/g, "{$1}"),
            {
                [route.method.toLowerCase()]: {
                    summary: route.summary,
                    tags: route.tags,
                    security: route.auth === "public" ? [] : [{ bearerAuth: [] }],
                    responses: {
                        "200": { description: "Success" },
                        "202": { description: "Accepted" },
                        default: { description: "Shared Saralo error envelope" }
                    }
                }
            }
        ])),
        components: {
            securitySchemes: {
                bearerAuth: { type: "http", scheme: "bearer" }
            }
        }
    };
}
