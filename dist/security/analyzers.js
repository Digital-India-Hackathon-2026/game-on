"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultSecurityAnalyzers = exports.OfficialDomainVerifier = exports.DownloadAnalyzer = exports.RedirectAnalyzer = exports.PrivacyAnalyzer = exports.PermissionAnalyzer = exports.TyposquattingDetector = exports.DomainReputationAnalyzer = exports.SSLVerifier = exports.PhishingDetector = exports.ScamDetector = void 0;
const SecurityConfiguration_1 = require("./SecurityConfiguration");
class ScamDetector {
    key = "scam";
    async analyze(request) {
        return /gift card|wire transfer|urgent payment|account suspended/i.test(request.html ?? "")
            ? [{ type: "scam", severity: "high", title: "Scam language detected", description: "The page uses language commonly found in scams." }]
            : [];
    }
}
exports.ScamDetector = ScamDetector;
class PhishingDetector {
    key = "phishing";
    async analyze(request) {
        const hasPassword = request.forms?.some((form) => JSON.stringify(form).toLowerCase().includes("password"));
        return hasPassword && request.url.startsWith("http:")
            ? [{ type: "phishing", severity: "critical", title: "Password form on insecure page", description: "Passwords must not be entered on insecure pages." }]
            : [];
    }
}
exports.PhishingDetector = PhishingDetector;
class SSLVerifier {
    key = "ssl";
    async analyze(request) {
        return request.url.startsWith("https:")
            ? []
            : [{ type: "ssl", severity: "medium", title: "HTTP page", description: "This page is not using HTTPS." }];
    }
}
exports.SSLVerifier = SSLVerifier;
class DomainReputationAnalyzer {
    key = "domain_reputation";
    async analyze(request) {
        return /malware|phish|scam/.test(new URL(request.url).hostname)
            ? [{ type: "reputation", severity: "critical", title: "Suspicious domain reputation", description: "The domain name contains high-risk indicators." }]
            : [];
    }
}
exports.DomainReputationAnalyzer = DomainReputationAnalyzer;
class TyposquattingDetector {
    key = "typosquatting";
    async analyze(request) {
        return /(g00gle|paypa1|micros0ft)/i.test(new URL(request.url).hostname)
            ? [{ type: "typosquatting", severity: "high", title: "Possible impersonation domain", description: "The domain resembles a trusted brand." }]
            : [];
    }
}
exports.TyposquattingDetector = TyposquattingDetector;
class PermissionAnalyzer {
    key = "permission";
    async analyze(request) {
        return /camera|microphone|location|clipboard/i.test(request.html ?? "")
            ? [{ type: "permission", severity: "medium", title: "Permission request mentioned", description: "The page may ask for sensitive browser permissions." }]
            : [];
    }
}
exports.PermissionAnalyzer = PermissionAnalyzer;
class PrivacyAnalyzer {
    key = "privacy";
    async analyze(request) {
        return /social security|credit card|health information|date of birth/i.test(request.html ?? "")
            ? [{ type: "privacy", severity: "high", title: "Sensitive data request", description: "The page appears to ask for sensitive personal information." }]
            : [];
    }
}
exports.PrivacyAnalyzer = PrivacyAnalyzer;
class RedirectAnalyzer {
    key = "redirect";
    async analyze(request) {
        return (request.redirects?.length ?? 0) > SecurityConfiguration_1.SecurityConfiguration.maxRedirects
            ? [{ type: "redirect", severity: "high", title: "Too many redirects", description: "The redirect chain exceeds Saralo policy." }]
            : [];
    }
}
exports.RedirectAnalyzer = RedirectAnalyzer;
class DownloadAnalyzer {
    key = "download";
    async analyze(request) {
        const risky = request.links?.find((link) => SecurityConfiguration_1.SecurityConfiguration.blockedDownloadExtensions.some((ext) => link.toLowerCase().endsWith(ext)));
        return risky ? [{ type: "download", severity: "high", title: "Risky download link", description: "Executable downloads are restricted by default.", evidence: { link: risky } }] : [];
    }
}
exports.DownloadAnalyzer = DownloadAnalyzer;
class OfficialDomainVerifier {
    key = "official_domain";
    async analyze(request) {
        const host = new URL(request.url).hostname;
        return /\.(gov|edu)$/i.test(host) ? [] : [];
    }
}
exports.OfficialDomainVerifier = OfficialDomainVerifier;
exports.defaultSecurityAnalyzers = [
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
