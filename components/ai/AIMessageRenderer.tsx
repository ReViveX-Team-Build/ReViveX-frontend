import React from "react";

interface AIMessageRendererProps {
  content: string;
  variant?: "patient" | "doctor"; // controls accent colors
}

export default function AIMessageRenderer({
  content,
  variant = "patient",
}: AIMessageRendererProps) {
  const teal   = variant === "patient" ? "#2DD4BF" : "#14b8a6";
  const accent = variant === "patient" ? "text-teal-600"  : "text-teal-500";
  const bold   = variant === "patient" ? "text-[#0A2E4C]" : "text-gray-800";
  const quote  = variant === "patient"
    ? "border-[#2DD4BF] bg-teal-50 text-teal-800"
    : "border-teal-500 bg-teal-50/60 text-teal-900";

  // Split the full content into a flat array of typed tokens
  const lines = content.split("\n");

  const elements: React.ReactNode[] = [];
  let keyIdx = 0;

  // Collect consecutive bullet lines into one <ul> block
  let bulletBuffer: string[] = [];
  let numberedBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return;
    elements.push(
      <ul key={`ul-${keyIdx++}`} className="my-2 space-y-1.5 pl-1">
        {bulletBuffer.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            {/* Teal dot */}
            <span
              className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: teal }}
            />
            <span className="text-sm leading-relaxed text-gray-700">
              {renderInline(item.replace(/^[-*]\s+/, ""), bold)}
            </span>
          </li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  };

  const flushNumbered = () => {
    if (numberedBuffer.length === 0) return;
    elements.push(
      <ol key={`ol-${keyIdx++}`} className="my-2 space-y-1.5 pl-1">
        {numberedBuffer.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            {/* Teal number badge */}
            <span
              className="mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: teal }}
            >
              {i + 1}
            </span>
            <span className="text-sm leading-relaxed text-gray-700">
              {renderInline(item.replace(/^\d+\.\s+/, ""), bold)}
            </span>
          </li>
        ))}
      </ol>
    );
    numberedBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ── Skip empty lines (but flush buffers first) ─────────────────────────
    if (line.trim() === "") {
      flushBullets();
      flushNumbered();
      elements.push(<div key={`gap-${keyIdx++}`} className="h-1" />);
      continue;
    }

    // ── ## Header ──────────────────────────────────────────────────────────
    if (/^#{1,3}\s/.test(line)) {
      flushBullets();
      flushNumbered();
      const text = line.replace(/^#{1,3}\s+/, "");
      elements.push(
        <div key={`h-${keyIdx++}`} className="mt-3 mb-1 flex items-center gap-2">
          <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: teal }} />
          <p className={`text-sm font-bold tracking-wide ${accent}`}>
            {text.toUpperCase()}
          </p>
        </div>
      );
      continue;
    }

    // ── > Blockquote ───────────────────────────────────────────────────────
    if (/^>\s/.test(line)) {
      flushBullets();
      flushNumbered();
      const text = line.replace(/^>\s+/, "");
      elements.push(
        <div
          key={`quote-${keyIdx++}`}
          className={`my-2 pl-3 py-2 rounded-r-lg border-l-2 text-sm italic leading-relaxed ${quote}`}
        >
          {renderInline(text, bold)}
        </div>
      );
      continue;
    }

    // ── Bullet point ───────────────────────────────────────────────────────
    if (/^[-*]\s/.test(line)) {
      flushNumbered();
      bulletBuffer.push(line);
      continue;
    }

    // ── Numbered list ──────────────────────────────────────────────────────
    if (/^\d+\.\s/.test(line)) {
      flushBullets();
      numberedBuffer.push(line);
      continue;
    }

    // ── Horizontal rule ────────────────────────────────────────────────────
    if (/^---+$/.test(line.trim())) {
      flushBullets();
      flushNumbered();
      elements.push(
        <div
          key={`hr-${keyIdx++}`}
          className="my-2 h-px w-full"
          style={{ background: `${teal}33` }}
        />
      );
      continue;
    }

    // ── Regular paragraph ──────────────────────────────────────────────────
    flushBullets();
    flushNumbered();
    elements.push(
      <p key={`p-${keyIdx++}`} className="text-sm leading-relaxed text-gray-700">
        {renderInline(line, bold)}
      </p>
    );
  }

  // Flush any remaining buffered lists
  flushBullets();
  flushNumbered();

  return (
    <div className="space-y-0.5 min-w-0">
      {elements}
    </div>
  );
}

// ── Inline markdown: **bold**, *italic*, `code` ───────────────────────────────
function renderInline(text: string, boldClass: string): React.ReactNode[] {
  // Tokenise on **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return parts.map((part, i) => {
    // **bold**
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={i} className={`font-semibold ${boldClass}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    // *italic*
    if (/^\*[^*]+\*$/.test(part)) {
      return (
        <em key={i} className="italic text-gray-600">
          {part.slice(1, -1)}
        </em>
      );
    }
    // `code`
    if (/^`[^`]+`$/.test(part)) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 text-xs font-mono border border-teal-100"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}