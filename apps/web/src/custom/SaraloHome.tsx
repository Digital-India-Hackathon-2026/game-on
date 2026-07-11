import { useCallback, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { usePipeline } from "../hooks/usePipeline";
import { useSaraloExperience } from "../hooks/useSaraloExperience";
import { useAdaptiveSession } from "../hooks/useAdaptiveSession";

import { Header } from "../components/Header/Header";
import { HeroSection } from "../components/Hero/HeroSection";

import { AccessibilityModes } from "../components/Sections/AccessibilityModes";
import { AICopilot } from "../components/Sections/AICopilot";
// import { VoiceAssistant } from "../components/Sections/VoiceAssistant";
import { SecurityShield } from "../components/Sections/SecurityShield";
import { SystemPipeline } from "../components/Sections/SystemPipeline";
import { DashboardSimulator } from "../components/Sections/DashboardSimulator";
import { FAQAccordion } from "../components/Sections/FAQAccordion";
import { Footer } from "../components/Footer/Footer";
import { ModeSelector } from "../components/Viewer/ModeSelector";
import { AdaptiveViewer } from "../components/Viewer/AdaptiveViewer";
import { LoginPage } from "./LoginPage";
import type { AccessibilityModeId } from "../hooks/useAdaptiveSession";

export function SaraloHome() {
  const auth = useAuth();
  const session = useAdaptiveSession();
  const experience = useSaraloExperience();
  const [url, setUrl] = useState("https://wikipedia.org");

  // When pipeline finishes → open mode selector
  const handlePipelineReady = useCallback(
    (processedUrl: string) => {
      session.openModeSelect(processedUrl);
    },
    [session.openModeSelect]
  );

  const pipeline = usePipeline(handlePipelineReady);

  const normalizeInputUrl = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "https://wikipedia.org";
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }, []);

  const handleModeCardSelect = useCallback(
    (modeId: AccessibilityModeId) => {
      session.openModeSelect(normalizeInputUrl(url));
      session.selectMode(modeId);
    },
    [normalizeInputUrl, session.openModeSelect, session.selectMode, url]
  );

  // Exit viewer → reset pipeline too
  const handleModeSelectBack = useCallback(() => {
    session.exitModeSelect();
    pipeline.reset();
  }, [session.exitModeSelect, pipeline.reset]);

  const handleLogout = useCallback(() => {
    session.exitModeSelect();
    pipeline.reset();
    auth.logout();
  }, [auth, pipeline, session]);

  if (auth.authLoading) {
    return (
      <main className="saralo-app saralo-auth-loading" aria-busy="true">
        <div className="viewer-loading">
          <div className="viewer-loading__spinner" />
          <p>Opening Saralo...</p>
        </div>
      </main>
    );
  }

  // If not authenticated, show the login page
  if (!auth.isAuthenticated) {
    return <LoginPage auth={auth} />;
  }

  /* ── Phase: Adaptive Viewer ── */
  if (session.sessionPhase === "viewing") {
    return <AdaptiveViewer session={session} />;
  }

  /* ── Phase: Mode Selection ── */
  if (session.sessionPhase === "mode-select") {
    return (
      <ModeSelector
        targetUrl={session.targetUrl}
        onSelect={session.selectMode}
          onBack={handleModeSelectBack}
      />
    );
  }

  /* ── Phase: Landing Page ── */
  return (
    <main className="saralo-app" id="home">
      <Header
        isAuthenticated={auth.isAuthenticated}
        onLogout={handleLogout}
        userName={auth.user?.name}
        userEmail={auth.user?.email}
      />

      <HeroSection
        url={url}
        setUrl={setUrl}
        pipeline={pipeline}
      />




      <AccessibilityModes onSelectMode={handleModeCardSelect} />
      <AICopilot experience={experience} />
      {/* <VoiceAssistant experience={experience} /> */}
      <SecurityShield />
      <SystemPipeline />
      <DashboardSimulator pipeline={pipeline} experience={experience} />
      <FAQAccordion experience={experience} />
      <Footer />

    </main>
  );
}
