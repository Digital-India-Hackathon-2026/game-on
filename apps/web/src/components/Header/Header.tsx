import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { logoUrl } from "../../data/content";

type HeaderProps = {
  isAuthenticated: boolean;
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
};

export function Header({ isAuthenticated, userName, userEmail, onLogout }: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const displayName = userName || "Saralo User";
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || "S";

  useEffect(() => {
    if (!profileOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Primary navigation">
        <div className="site-nav__left">
          <a className="brand" href="#home" aria-label="Saralo home">
            <img src={logoUrl} alt="Saralo Logo" onError={(event) => { event.currentTarget.hidden = true; }} />
          </a>
          <div className="nav-links">
            <a href="#home">Home</a>
            <a href="#modes">Accessibility Modes</a>
            <a href="#ai">AI Features</a>
            <a href="#pipeline">How It Works</a>
            <a href="#security">Security</a>
          </div>
        </div>
        <div className="site-nav__right">
          {isAuthenticated && (
            <div className="profile-menu" ref={profileRef}>
              <button
                className="session-chip profile-menu__trigger"
                type="button"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((open) => !open)}
              >
                <span className="profile-avatar" aria-hidden="true">{avatarInitial}</span>
                <span className="profile-menu__name">{displayName}</span>
                <ChevronDown className="profile-menu__chevron" size={15} aria-hidden="true" />
              </button>
              <div className={`profile-dropdown ${profileOpen ? "is-open" : ""}`} role="menu">
                <div className="profile-dropdown__profile">
                  <span className="profile-avatar profile-avatar--large" aria-hidden="true">{avatarInitial}</span>
                  <div>
                    <strong>{displayName}</strong>
                    <span>{userEmail || "Signed in to Saralo"}</span>
                  </div>
                </div>
                <button className="profile-dropdown__action" type="button" role="menuitem" onClick={onLogout}>
                  <LogOut size={16} aria-hidden="true" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
