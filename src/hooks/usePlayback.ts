import { useCallback, useEffect, useState } from "react";

export interface PlaybackOptions {
  totalSteps: number;
  resetKey?: string | number;
  initialSpeed?: number;
  baseDelayMs?: number;
  stepDelayMs?: number;
  enableKeyboard?: boolean;
}

export function usePlayback({
  totalSteps,
  resetKey,
  initialSpeed = 5,
  baseDelayMs = 1150,
  stepDelayMs = 95,
  enableKeyboard = true,
}: PlaybackOptions) {
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(initialSpeed);
  const [prevResetKey, setPrevResetKey] = useState(resetKey);

  // Render-time reset avoids cascading setState-in-effect renders
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setStepIdx(0);
    setPlaying(false);
  }

  const safeStep = Math.min(stepIdx, Math.max(0, totalSteps));

  useEffect(() => {
    if (!playing) return;
    if (safeStep >= totalSteps) {
      const doneTimer = window.setTimeout(() => setPlaying(false), 0);
      return () => window.clearTimeout(doneTimer);
    }
    const delay = Math.max(120, baseDelayMs - speed * stepDelayMs);
    const id = window.setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= totalSteps) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, delay);
    return () => window.clearInterval(id);
  }, [playing, speed, totalSteps, safeStep, baseDelayMs, stepDelayMs]);

  const reset = useCallback(() => {
    setPlaying(false);
    setStepIdx(0);
  }, []);

  const stepBack = useCallback(() => {
    setPlaying(false);
    setStepIdx((s) => Math.max(0, s - 1));
  }, []);

  const stepForward = useCallback(() => {
    setPlaying(false);
    setStepIdx((s) => Math.min(totalSteps, s + 1));
  }, [totalSteps]);

  const togglePlay = useCallback(() => {
    if (safeStep >= totalSteps) {
      setStepIdx(0);
      setPlaying(true);
    } else {
      setPlaying((p) => !p);
    }
  }, [safeStep, totalSteps]);

  const jumpTo = useCallback(
    (idx: number, autoPlay = false) => {
      setStepIdx(Math.max(0, Math.min(totalSteps, idx)));
      setPlaying(autoPlay);
    },
    [totalSteps]
  );

  // Global keyboard shortcuts when focus is not inside an editable input
  useEffect(() => {
    if (!enableKeyboard) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepBack();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        stepForward();
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        reset();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enableKeyboard, togglePlay, stepBack, stepForward, reset]);

  return {
    stepIdx: safeStep,
    setStepIdx,
    playing,
    setPlaying,
    speed,
    setSpeed,
    reset,
    stepBack,
    stepForward,
    togglePlay,
    jumpTo,
    canStepBack: safeStep > 0,
    canStepForward: safeStep < totalSteps,
  };
}
