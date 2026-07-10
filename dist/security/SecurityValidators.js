"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityValidators = exports.URLValidator = void 0;
const SecurityConfiguration_1 = require("./SecurityConfiguration");
const SecurityUtilities_1 = require("./SecurityUtilities");
class URLValidator {
    validate(input) {
        const url = (0, SecurityUtilities_1.normalizeUrl)(input);
        if (!SecurityConfiguration_1.SecurityConfiguration.allowedSchemes.includes(url.protocol))
            throw new Error("Unsupported URL scheme.");
        if (url.username || url.password)
            throw new Error("Embedded credentials are not allowed.");
        if ((0, SecurityUtilities_1.isPrivateOrLocalHost)(url.hostname))
            throw new Error("Private or local network targets are blocked.");
        return url;
    }
}
exports.URLValidator = URLValidator;
class SecurityValidators {
    url = new URLValidator();
}
exports.SecurityValidators = SecurityValidators;
