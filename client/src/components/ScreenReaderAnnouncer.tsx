import { useEffect, useRef, useState } from "react";

function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "").trim();
}

interface ScreenReaderAnnouncerProps {
  lines: string[];
  enabled: boolean;
  maxLines?: number;
}

export function ScreenReaderAnnouncer({ lines, enabled, maxLines = 5 }: ScreenReaderAnnouncerProps) {
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const lastLineCountRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) {
      setAnnouncements([]);
      lastLineCountRef.current = lines.length;
      return;
    }

    const currentCount = lines.length;
    const prevCount = lastLineCountRef.current;

    if (currentCount > prevCount) {
      const newLines = lines.slice(prevCount);
      const cleanLines = newLines.map(line => stripAnsi(line));
      
      setAnnouncements(prev => {
        const updated = [...prev, ...cleanLines];
        return updated.slice(-maxLines);
      });
    }

    lastLineCountRef.current = currentCount;
  }, [lines, enabled, maxLines]);

  useEffect(() => {
    if (announcements.length > 0 && containerRef.current) {
      const timer = setTimeout(() => {
        setAnnouncements([]);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [announcements]);

  if (!enabled) return null;

  return (
    <div
      ref={containerRef}
      role="log"
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions"
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {announcements.map((text, index) => (
        <p key={`${index}-${text.slice(0, 20)}`}>{text}</p>
      ))}
    </div>
  );
}
