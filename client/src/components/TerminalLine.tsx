import { useMemo } from 'react';
import Anser from 'anser';
import { clsx } from 'clsx';
import { stripSymbolsForScreenReader } from '@/lib/text-utils';

interface TerminalLineProps {
  content: string;
  className?: string;
  stripSymbols?: boolean;
}

export function TerminalLine({ content, className, stripSymbols }: TerminalLineProps) {
  const bundles = useMemo(() => {
    return Anser.ansiToJson(content, {
      use_classes: true,
    });
  }, [content]);

  const processedBundles = useMemo(() => {
    if (!stripSymbols) return bundles;
    return bundles.map(bundle => ({
      ...bundle,
      content: stripSymbolsForScreenReader(bundle.content),
    })).filter(bundle => bundle.content.length > 0);
  }, [bundles, stripSymbols]);
  
  return (
    <div className={clsx("font-mono whitespace-pre-wrap break-words leading-snug", className)} role="presentation">
      {processedBundles.map((bundle, index) => (
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
