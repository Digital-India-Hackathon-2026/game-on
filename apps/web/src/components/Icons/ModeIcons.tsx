import React from "react";

type Props = { id: string; className?: string };

export function ModeIcon({ id, className }: Props) {
  const size = 72;
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 72 72",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
  };

  switch (id) {
    case "adhd":
      return (
        <svg {...common} className={className} aria-hidden>
          <defs>
            <linearGradient id="adhd-bubble-gradient" x1="14" y1="14" x2="58" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9B74FF" />
              <stop offset="0.56" stopColor="#7B58FF" />
              <stop offset="1" stopColor="#6EA0FF" />
            </linearGradient>
          </defs>
          <path d="M16 35.5C16 24.7 25.4 16 37 16s21 8.7 21 19.5S48.6 55 37 55c-2.8 0-5.5-.5-7.9-1.5L18 58l4.4-9.4A18.6 18.6 0 0 1 16 35.5Z" fill="url(#adhd-bubble-gradient)" />
          <path d="M51.8 49.4 60 52.7l-3.2-7a15.8 15.8 0 0 0 3.5-9.8c0-5.4-3.2-10.2-8-13.1" fill="#7C66FF" opacity="0.72" />
          <circle cx="28" cy="36" r="3" fill="#F4F0FF" />
          <circle cx="37" cy="36" r="3" fill="#F4F0FF" />
          <circle cx="46" cy="36" r="3" fill="#F4F0FF" />
        </svg>
      );
    case "dyslexia":
      return (
        <svg {...common} className={className} aria-hidden>
          <defs>
            <linearGradient id="dyslexia-a-gradient" x1="18" y1="13" x2="50" y2="57" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D6B2FF" />
              <stop offset="1" stopColor="#8C63FF" />
            </linearGradient>
          </defs>
          <circle cx="36" cy="36" r="30" stroke="#8B5BFF" strokeWidth="4" opacity="0.78" />
          <circle cx="36" cy="36" r="27" fill="rgba(40, 25, 70, 0.32)" />
          <text x="35.5" y="43" textAnchor="middle" fontSize="34" fontWeight={700} fill="url(#dyslexia-a-gradient)" fontFamily="Georgia, 'Times New Roman', serif">Aa</text>
          <path d="M17 53c6-6 12 6 18 0s12 6 20 0" stroke="#69C9FF" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      );
    case "low-vision":
      return (
        <svg {...common} className={className} aria-hidden>
          <defs>
            <linearGradient id="low-vision-gradient" x1="14" y1="14" x2="58" y2="58" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F2C6FF" />
              <stop offset="1" stopColor="#9B63FF" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="31" r="18" fill="none" stroke="url(#low-vision-gradient)" strokeWidth="7" />
          <path d="M44 45 58 59" stroke="url(#low-vision-gradient)" strokeWidth="8" strokeLinecap="round" />
          <path d="M18 31s5.2-9 14-9 14 9 14 9-5.2 9-14 9-14-9-14-9Z" fill="#0B0814" stroke="#EADFFF" strokeWidth="2.2" />
          <circle cx="32" cy="31" r="6.8" fill="#B987FF" />
          <circle cx="32" cy="31" r="2.8" fill="#0B0814" />
          <circle cx="29.5" cy="27.5" r="2.2" fill="#FFFFFF" opacity="0.9" />
        </svg>
      );
    case "astigmatism":
      return (
        <svg {...common} className={className} aria-hidden>
          <defs>
            <radialGradient id="astig-halo-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#D9A1FF" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#D9A1FF" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="36" cy="36" r="30" fill="rgba(55, 38, 82, 0.34)" stroke="#9F6BFF" strokeWidth="4" />
          <circle cx="36" cy="36" r="24" fill="url(#astig-halo-glow)" />
          <ellipse cx="36" cy="36" rx="18" ry="8" fill="none" stroke="#D9A1FF" strokeWidth="2.5" opacity="0.7" transform="rotate(-15 36 36)" />
          <ellipse cx="36" cy="36" rx="6" ry="18" fill="none" stroke="#B388FF" strokeWidth="2.5" opacity="0.7" transform="rotate(20 36 36)" />
          <circle cx="36" cy="36" r="5" fill="#F6F2FF" opacity="0.9" />
          <path d="M16 54c6-8 14 4 20-4s14 4 20-4" stroke="#69C9FF" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        </svg>
      );
    case "colorblind":
      return (
        <svg {...common} className={className} aria-hidden>
          <g transform="translate(36 36)">
            <path d="M0 0V-27A27 27 0 0 1 19.1-19.1Z" fill="#F04444" />
            <path d="M0 0 19.1-19.1A27 27 0 0 1 27 0Z" fill="#F5A623" />
            <path d="M0 0H27A27 27 0 0 1 19.1 19.1Z" fill="#F7DF45" />
            <path d="M0 0 19.1 19.1A27 27 0 0 1 0 27Z" fill="#59C65D" />
            <path d="M0 0V27A27 27 0 0 1-19.1 19.1Z" fill="#34B6E8" />
            <path d="M0 0-19.1 19.1A27 27 0 0 1-27 0Z" fill="#4C68D7" />
            <path d="M0 0H-27A27 27 0 0 1-19.1-19.1Z" fill="#7A57FF" />
            <path d="M0 0-19.1-19.1A27 27 0 0 1 0-27Z" fill="#F45AB8" />
          </g>
          <circle cx="36" cy="36" r="27" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.5" />
        </svg>
      );
    case "cognitive-overload":
      return (
        <svg {...common} className={className} aria-hidden>
          <defs>
            <radialGradient id="brain-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(31 25) rotate(49) scale(42)">
              <stop stopColor="#F0DCFF" />
              <stop offset="1" stopColor="#8C69E8" />
            </radialGradient>
          </defs>
          <circle cx="36" cy="36" r="31" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.12)" />
          <path d="M24 39c-5-1.7-8-6.1-6.4-10.8 1-3.1 3.8-4.7 7-4.6 1.4-4 5-6.4 9.1-5.6 2.2-2.4 6.3-2.6 9.1-.8 2.8 1.7 4.1 4.8 3.4 7.8 4.9 1.8 8 6.7 6.5 12-1.2 4.3-4.8 6.4-9.2 6.5-.9 3.3-3.4 6.2-7.8 6.2-4.5 0-7-3.2-7.3-7-1.6-.5-3-1.8-4.4-3.7Z" fill="url(#brain-glow)" />
          <path d="M28 26c3.7.1 6.1 2.4 6.2 5.9M43 25.4c-3.8.5-6.7 2.9-7.1 7M25.4 38.4c2.9-2.3 6.2-2.7 9.2-1M41 38c-2.3 1.2-3.9 3.2-4.2 6M47 33c-3.2-.2-5.8 1.1-7.6 3.8" stroke="#C8B3FF" strokeWidth="2.2" strokeLinecap="round" opacity="0.74" />
        </svg>
      );
    default:
      return (
        <svg {...common} className={className} aria-hidden>
          <rect x="12" y="12" width="48" height="48" rx="12" stroke="#EDE7FF" strokeWidth="3" fill="none" />
        </svg>
      );
  }
}

export default ModeIcon;
