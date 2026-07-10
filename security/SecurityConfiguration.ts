export const SecurityConfiguration = {
  allowedSchemes: ["http:", "https:"],
  blockedHosts: ["localhost", "127.0.0.1", "::1"],
  maxRedirects: 5,
  trustBands: {
    allow: 80,
    warn: 60,
    restrict: 20
  },
  officialDomains: ["gov", "edu", "org"],
  blockedDownloadExtensions: [".exe", ".bat", ".cmd", ".scr", ".js", ".msi"]
};
