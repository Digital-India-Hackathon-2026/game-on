import type { FormEvent } from "react";
import { useState } from "react";
import type { useAuth } from "../hooks/useAuth";
import { logoUrl } from "../data/content";
import "./login.css";

type LoginPageProps = {
  auth: ReturnType<typeof useAuth>;
};

export function LoginPage({ auth }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Please fill in both email and password fields.");
      return;
    }

    const lowerEmail = trimmedEmail.toLowerCase();
    if (
      (lowerEmail === "builder@saralo.ai" && trimmedPassword === "saralo-demo") ||
      (lowerEmail === "admin" && trimmedPassword === "admin") ||
      (lowerEmail === "demo" && trimmedPassword === "demo") ||
      (trimmedEmail.length > 0 && trimmedPassword.length > 0)
    ) {
      await auth.loginWithEmail(trimmedEmail, trimmedPassword);
    } else {
      setError("Invalid email or password. Please use builder@saralo.ai and saralo-demo.");
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    await auth.loginWithGoogle();
  }

  async function handlePhoneLogin() {
    setError(null);
    // Bypasses check and signs in immediately as a guest
    await auth.loginAsGuest();
  }

  return (
    <div className="login-body min-h-screen relative flex flex-col">
      <div className="fixed inset-0 -z-20 bg-[#0b0f14]"></div>
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="aurora-blob w-[500px] h-[500px] bg-purple-600/20 -top-20 -left-20 opacity-40"></div>
        <div className="aurora-blob w-[600px] h-[600px] bg-pink-500/15 top-1/4 -right-40 opacity-30"></div>
        <div className="aurora-blob w-[450px] h-[450px] bg-indigo-900/40 bottom-0 left-1/3 opacity-50"></div>
        <div className="aurora-blob w-[300px] h-[300px] bg-purple-400/30 top-1/2 right-1/4 opacity-40"></div>
        <div 
          className="absolute inset-0 grid-mask" 
          style={{
            backgroundImage: "linear-gradient(rgba(168,85,247,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(244,114,182,0.05) 1px, transparent 1px)", 
            backgroundSize: "64px 64px"
          }}
        ></div>
        <div className="absolute inset-0 film-grain"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f14] via-transparent to-[#0b0f14] opacity-80"></div>
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center">
          <a href="#" id="nav-logo-link" className="flex items-center">
            <img 
              src={logoUrl} 
              alt="Saralo Logo" 
              className="login-logo-img h-14 w-auto drop-shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-transform duration-300 hover:scale-105"
            />
          </a>
        </div>
      </nav>

      <main className="flex-1 flex flex-col justify-center pt-24 pb-12 lg:pt-24 lg:pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-14 lg:gap-10 items-center w-full">
          <div className="order-2 lg:order-1 flex flex-col gap-6">
            <div className="flex">
              <div className="pill flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[10px] uppercase tracking-widest font-bold text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                AI Accessibility Engine v2.0
              </div>
            </div>
            
            <h1 className="display-font text-4xl lg:text-[3.4rem] font-bold leading-[1.05] tracking-tight text-white">
              Browse the web, <br />
              <span className="gradient-text">simplified for you.</span>
            </h1>
            
            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
              Empowering everyone to navigate complex government, banking, and healthcare portals with AI that reorganizes clutter into clarity.
            </p>

            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-3">
                <div className="h-8 w-8 rounded-full border-2 border-[#0b0f14] bg-gradient-to-br from-slate-400 to-slate-600"></div>
                <div className="h-8 w-8 rounded-full border-2 border-[#0b0f14] bg-gradient-to-br from-purple-500 to-indigo-600"></div>
                <div className="h-8 w-8 rounded-full border-2 border-[#0b0f14] bg-gradient-to-br from-pink-500 to-rose-600"></div>
                <div className="h-8 w-8 rounded-full border-2 border-[#0b0f14] bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">9k+</div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:justify-self-end w-full max-w-md relative">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-purple-600/20 blur-3xl -z-10"></div>
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-pink-500/20 blur-3xl -z-10"></div>
            
            <div className="glass rounded-[26px] p-8 lg:p-10 relative overflow-hidden">
              <div className="mb-8">
                <h2 className="display-font text-2xl font-semibold text-white">Welcome back</h2>
                <p className="text-slate-400 text-sm mt-1">Enter your details to access your dashboard.</p>
              </div>

              <div className="mb-6">
                <button 
                  onClick={handlePhoneLogin} 
                  id="phone-login-btn" 
                  type="button" 
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:scale-[1.01] transition-all duration-300 text-sm font-semibold text-slate-200"
                >
                  <iconify-icon icon="ph:user-bold" className="text-lg text-purple-400"></iconify-icon>
                  Explore as Guest
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">or with email</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10"></div>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm leading-snug">
                  {error}
                </div>
              )}

              <form className="space-y-5" onSubmit={(e) => void handleEmailLogin(e)}>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 flex items-center">
                      <iconify-icon icon="ph:envelope-simple"></iconify-icon>
                    </span>
                    <input 
                      type="email" 
                      placeholder="name@service.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07] transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                    <a href="#" id="forgot-pwd-link" className="text-xs text-pink-400 hover:underline">Forgot?</a>
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 flex items-center">
                      <iconify-icon icon="ph:lock-simple-bold"></iconify-icon>
                    </span>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 pl-11 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07] transition-all"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(prev => !prev)}
                      id="toggle-pwd-btn" 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white flex items-center"
                    >
                      <iconify-icon icon={showPassword ? "ph:eye-bold" : "ph:eye-closed-bold"}></iconify-icon>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="relative flex items-center cursor-pointer">
                    <input type="checkbox" className="peer sr-only" defaultChecked />
                    <div className="w-5 h-5 border border-white/20 rounded-md bg-white/5 flex items-center justify-center transition-all peer-checked:bg-purple-600 peer-checked:border-purple-600">
                      <iconify-icon icon="ph:check-bold" className="text-white text-xs"></iconify-icon>
                    </div>
                    <span className="ml-3 text-sm text-slate-300">Remember for 30 days</span>
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={auth.authLoading}
                  id="sign-in-submit" 
                  className="cta-gradient w-full h-14 rounded-xl flex items-center justify-center gap-2 text-white font-bold display-font mt-8"
                >
                  {auth.authLoading ? "Signing in..." : "Sign in to Saralo"}
                  <iconify-icon icon="ph:arrow-right-bold"></iconify-icon>
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-slate-400">New to Saralo? <a href="#" id="signup-link" className="text-pink-400 font-semibold hover:underline">Create an account</a></p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-[#0b0f14] py-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <img 
              src="https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/c8c955f3-8130-4ca9-af94-723b8a34f54f/1783421396666-07ea6d72/image.png" 
              alt="Saralo Logo" 
              className="h-6 w-auto opacity-50 grayscale contrast-125"
            />
            <span className="text-slate-600 text-xs tracking-wider">© 2026</span>
          </div>

          <div className="flex items-center gap-8 text-xs font-medium text-slate-400">
            <a href="#" id="footer-privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" id="footer-terms" className="hover:text-white transition-colors">Terms of Use</a>
            <a href="#" id="footer-accessibility" className="hover:text-white transition-colors">Accessibility</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
