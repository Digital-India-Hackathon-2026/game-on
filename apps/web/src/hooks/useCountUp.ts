import { useEffect, useState } from "react";

const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

export function useCountUp(targetValue: number, durationMs: number, delayMs: number) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frameId = 0;
    let startTime = 0;
    const startTimer = window.setTimeout(() => {
      const tick = (time: number) => {
        if (!startTime) startTime = time;
        const progress = Math.min((time - startTime) / durationMs, 1);
        setValue(Math.round(targetValue * easeOutCubic(progress)));
        if (progress < 1) frameId = window.requestAnimationFrame(tick);
      };
      frameId = window.requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      window.clearTimeout(startTimer);
      window.cancelAnimationFrame(frameId);
    };
  }, [delayMs, durationMs, targetValue]);

  return value;
}
