import { SecurityConfiguration } from "./SecurityConfiguration";
import type { SecurityAnalyzer, SecurityFinding, SecurityScanRequest } from "./SecurityTypes";

export class ScamDetector implements SecurityAnalyzer {
  readonly key = "scam";
  async analyze(request: SecurityScanRequest): Promise<SecurityFinding[]> {
    return /gift card|wire transfer|urgent payment|account suspended/i.test(request.html ?? "")
      ? [{ type: "scam", severity: "high", title: "Scam language detected", description: "The page uses language commonly found in scams." }]
      : [];
  }
}

export class PhishingDetector implements SecurityAnalyzer {
  readonly key = "phishing";
  async analyze(request: SecurityScanRequest): Promise<SecurityFinding[]> {
    const hasPassword = request.forms?.some((form) => JSON.stringify(form).toLowerCase().includes("password"));
    return hasPassword && request.url.startsWith("http:")
      ? [{ type: "phishing", severity: "critical", title: "Password form on insecure page", description: "Passwords must not be entered on insecure pages." }]
      : [];
  }
}

export class SSLVerifier implements SecurityAnalyzer {
  readonly key = "ssl";
  async analyze(request: SecurityScanRequest): Promise<SecurityFinding[]> {
    return request.url.startsWith("https:")
      ? []
      : [{ type: "ssl", severity: "medium", title: "HTTP page", description: "This page is not using HTTPS." }];
  }
}

export class DomainReputationAnalyzer implements SecurityAnalyzer {
  readonly key = "domain_reputation";
  async analyze(request: SecurityScanRequest): Promise<SecurityFinding[]> {
    return /malware|phish|scam/.test(new URL(request.url).hostname)
      ? [{ type: "reputation", severity: "critical", title: "Suspicious domain reputation", description: "The domain name contains high-risk indicators." }]
      : [];
  }
}

export class TyposquattingDetector implements SecurityAnalyzer {
  readonly key = "typosquatting";
  async analyze(request: SecurityScanRequest): Promise<SecurityFinding[]> {
    return /(g00gle|paypa1|micros0ft)/i.test(new URL(request.url).hostname)
      ? [{ type: "typosquatting", severity: "high", title: "Possible impersonation domain", description: "The domain resembles a trusted brand." }]
      : [];
  }
}

export class PermissionAnalyzer implements SecurityAnalyzer {
  readonly key = "permission";
  async analyze(request: SecurityScanRequest): Promise<SecurityFinding[]> {
    return /camera|microphone|location|clipboard/i.test(request.html ?? "")
      ? [{ type: "permission", severity: "medium", title: "Permission request mentioned", description: "The page may ask for sensitive browser permissions." }]
      : [];
  }
}

export class PrivacyAnalyzer implements SecurityAnalyzer {
  readonly key = "privacy";
  async analyze(request: SecurityScanRequest): Promise<SecurityFinding[]> {
    return /social security|credit card|health information|date of birth/i.test(request.html ?? "")
      ? [{ type: "privacy", severity: "high", title: "Sensitive data request", description: "The page appears to ask for sensitive personal information." }]
      : [];
  }
}

export class RedirectAnalyzer implements SecurityAnalyzer {
  readonly key = "redirect";
  async analyze(request: SecurityScanRequest): Promise<SecurityFinding[]> {
    return (request.redirects?.length ?? 0) > SecurityConfiguration.maxRedirects
      ? [{ type: "redirect", severity: "high", title: "Too many redirects", description: "The redirect chain exceeds Saralo policy." }]
      : [];
  }
}

export class DownloadAnalyzer implements SecurityAnalyzer {
  readonly key = "download";
  async analyze(request: SecurityScanRequest): Promise<SecurityFinding[]> {
    const risky = request.links?.find((link) => SecurityConfiguration.blockedDownloadExtensions.some((ext) => link.toLowerCase().endsWith(ext)));
    return risky ? [{ type: "download", severity: "high", title: "Risky download link", description: "Executable downloads are restricted by default.", evidence: { link: risky } }] : [];
  }
}

export class OfficialDomainVerifier implements SecurityAnalyzer {
  readonly key = "official_domain";
  async analyze(request: SecurityScanRequest): Promise<SecurityFinding[]> {
    const host = new URL(request.url).hostname;
    return /\.(gov|edu)$/i.test(host) ? [] : [];
  }
}

export const defaultSecurityAnalyzers = [
  new SSLVerifier(),
  new DomainReputationAnalyzer(),
  new ScamDetector(),
  new PhishingDetector(),
  new TyposquattingDetector(),
  new PermissionAnalyzer(),
  new PrivacyAnalyzer(),
  new RedirectAnalyzer(),
  new DownloadAnalyzer(),
  new OfficialDomainVerifier()
];
