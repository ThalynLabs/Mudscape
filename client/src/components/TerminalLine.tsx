import { useMemo } from 'react';
import Anser from 'anser';
import { clsx } from 'clsx';
import { stripSymbolsForScreenReader } from '@/lib/text-utils';

const URL_REGEX = /(https?:\/\/[^\s<>"')\]}]+[^\s<>"')\]}.,:;!?])/g;

interface TerminalLineProps {
  content: string;
  className?: string;
  stripSymbols?: boolean;
  linkifyUrls?: boolean;
  linkTarget?: 'tab' | 'window';
}

function renderTextWithLinks(text: string, linkTarget: 'tab' | 'window') {
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(URL_REGEX.source, 'g');

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const url = match[1];
    const label = linkTarget === 'window' ? 'Opens in new window' : 'Opens in new tab';

    parts.push(
      <a
        key={`${match.index}-${url}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${url} (${label})`}
        onClick={linkTarget === 'window' ? (e) => {
          e.preventDefault();
          window.open(url, '_blank', 'noopener,noreferrer');
        } : undefined}
        className="underline cursor-pointer"
        style={{ color: 'inherit' }}
        data-testid={`link-url-${match.index}`}
      >
        {url}
      </a>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export function TerminalLine({ content, className, stripSymbols, linkifyUrls = true, linkTarget = 'tab' }: TerminalLineProps) {
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
          {linkifyUrls ? renderTextWithLinks(bundle.content, linkTarget) : bundle.content}
        </span>
      ))}
    </div>
  );
}
