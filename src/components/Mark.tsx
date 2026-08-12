"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The brand device: a marker stroke behind the words that earned it. The stroke swipes in
 * the first time it scrolls into view and then stays put, so nothing on the page is ever
 * animating for its own sake. The styling itself lives in globals.css (`.mark`), which lets
 * the server-rendered surfaces that need a static stroke, such as the wordmark, reuse it
 * without pulling in this client component.
 */
export default function Mark({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setRevealed(true);
        observer.disconnect();
      },
      { threshold: 0.6 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className="mark mark-swipe" data-revealed={revealed}>
      {children}
    </span>
  );
}
