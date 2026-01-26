import { useMemo } from 'react';
import Anser from 'anser';
import { clsx } from 'clsx';

interface TerminalLineProps {
  content: string;
  className?: string;
}

export function TerminalLine({ content, className }: TerminalLineProps) {
  const bundles = useMemo(() => {
    // Anser parses ANSI escape codes into objects with style info
    return Anser.ansiToJson(content, {
      use_classes: true, // Use CSS classes instead of inline styles for better CSP/cleanliness
    });
  }, [content]);

  // Accessibility: Screen readers handle broken up spans poorly sometimes.
  // We can provide a hidden full text version or just rely on the spans flowing together.
  // For specialized accessibility, we might render a visually hidden clean text node.
  
  return (
    <div className={clsx("font-mono whitespace-pre-wrap break-words leading-snug", className)} role="presentation">
      {bundles.map((bundle, index) => (
        <span
          key={index}
          className={clsx(
            bundle.fg && `ansi-${bundle.fg}-fg`,
            bundle.bg && `ansi-${bundle.bg}-bg`,
            bundle.decoration && `ansi-${bundle.decoration}`
          )}
        >
          {bundle.content}
        </span>
      ))}
    </div>
  );
}
