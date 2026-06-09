import { useEffect, useRef, useState } from "react";

interface TypewriterProps {
  text: string;
  /** Milliseconds per character. */
  speed?: number;
  /** Keep a blinking cursor after typing finishes. */
  cursor?: boolean;
  className?: string;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Types `text` out character-by-character on mount. Honors
 * prefers-reduced-motion by rendering the full string instantly.
 */
export function Typewriter({
  text,
  speed = 26,
  cursor = true,
  className,
}: TypewriterProps) {
  const reduced = prefersReducedMotion();
  const [shown, setShown] = useState(reduced ? text : "");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (reduced) {
      setShown(text);
      return;
    }

    setShown("");
    let index = 0;

    timer.current = window.setInterval(() => {
      index += 1;
      setShown(text.slice(0, index));
      if (index >= text.length && timer.current) {
        window.clearInterval(timer.current);
      }
    }, speed);

    return () => {
      if (timer.current) {
        window.clearInterval(timer.current);
      }
    };
  }, [text, speed, reduced]);

  return (
    <span className={className}>
      {shown}
      {cursor ? <span className="term-cursor" aria-hidden="true" /> : null}
    </span>
  );
}
