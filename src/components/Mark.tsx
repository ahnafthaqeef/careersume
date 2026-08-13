"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The brand device: a marker stroke behind the words that earned it. The stroke swipes in
 * the first time it scrolls into view and then stays put, so nothing on the page is ever
 * animating for its own sake. The styling itself lives in globals.css (`.mark`), which lets
 * the server-rendered surfaces that need a static stroke, such as the wordmark, reuse it
 * without pulling in this client component.
 */
export default function Mark({
  children,
  variant,
}: {
  children: React.ReactNode;
  /** "hero" swaps in the slower, delayed stroke defined by `.mark-swipe-hero`, for the one
   *  above-the-fold instance where the reader's eye needs time to land before it draws. */
  variant?: "hero";
}) {
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

  const swipeClass = variant === "hero" ? "mark-swipe-hero" : "mark-swipe";

  return (
    <span ref={ref} className={`mark ${swipeClass}`} data-revealed={revealed}>
      {children}
    </span>
  );
}
