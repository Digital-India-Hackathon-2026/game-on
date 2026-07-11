import type { FormEvent } from "react";
import { useState } from "react";
import type { useAuth } from "../../hooks/useAuth";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  auth: ReturnType<typeof useAuth>;
};

export function AuthModal({ isOpen, onClose, auth }: AuthModalProps) {
  const [email, setEmail] = useState("builder@saralo.ai");
  const [password, setPassword] = useState("saralo-demo");

  if (!isOpen) return null;

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await auth.loginWithEmail(email, password);
    onClose();
  }

  return (
    <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="auth-modal__panel">
        <button
          className="icon-button auth-modal__close"
          onClick={onClose}
          aria-label="Close login dialog"
        >
          ✕
        </button>
        <p className="eyebrow">Session layer</p>
        <h2 id="auth-title">Choose how Saralo should remember you</h2>

        <div className="auth-modal__actions">
          <button
            onClick={() => void auth.loginWithGoogle().then(onClose)}
            type="button"
            disabled={auth.authLoading}
          >
            {auth.authLoading ? "Connecting..." : "Continue with Google"}
          </button>
          <button
            onClick={() => void auth.loginAsGuest().then(onClose)}
            type="button"
            disabled={auth.authLoading}
          >
            {auth.authLoading ? "Opening..." : "Continue as Guest"}
          </button>
        </div>

        <form className="auth-form" onSubmit={(event) => void submitEmail(event)}>
          <label>
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
            />
          </label>
          <button disabled={auth.authLoading} type="submit">
            {auth.authLoading ? "Connecting..." : "Log in with email"}
          </button>
        </form>
      </div>
    </div>
  );
}
