/**
 * The site's wordmark: "Career" in ink, "sume" on the marker-yellow highlight. Size and
 * weight come from the parent (nav link, footer paragraph, auth heading) exactly as before,
 * so this stays a plain server component with no font-size opinions of its own. The `mark-wm`
 * stroke (globals.css) is a variant of `.mark` with an asymmetric bleed: it starts flush
 * against the trailing "r" instead of overlapping it.
 */
export default function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      Career<span className="mark-wm">sume</span>
    </span>
  );
}
