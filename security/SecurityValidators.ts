import { SecurityConfiguration } from "./SecurityConfiguration";
import { isPrivateOrLocalHost, normalizeUrl } from "./SecurityUtilities";

export class URLValidator {
  validate(input: string): URL {
    const url = normalizeUrl(input);
    if (!SecurityConfiguration.allowedSchemes.includes(url.protocol)) throw new Error("Unsupported URL scheme.");
    if (url.username || url.password) throw new Error("Embedded credentials are not allowed.");
    if (isPrivateOrLocalHost(url.hostname)) throw new Error("Private or local network targets are blocked.");
    return url;
  }
}

export class SecurityValidators {
  readonly url = new URLValidator();
}
