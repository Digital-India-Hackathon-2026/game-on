import { useEffect, useMemo, useState } from "react";

export function useTypewriter(text: string, intervalMs = 35, delayMs = 400) {
  const [length, setLength] = useState(0);

  useEffect(() => {
    setLength(0);
    const startTimer = window.setTimeout(() => {
      const typingTimer = window.setInterval(() => {
        setLength((current) => {
          if (current >= text.length) {
            window.clearInterval(typingTimer);
            return current;
          }
          return current + 1;
        });
      }, intervalMs);
    }, delayMs);

    return () => {
      window.clearTimeout(startTimer);
    };
  }, [delayMs, intervalMs, text]);

  return useMemo(
    () => ({
      visibleText: text.slice(0, length),
      isComplete: length >= text.length
    }),
    [length, text]
  );
}
