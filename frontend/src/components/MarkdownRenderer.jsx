import React from "react";
import { Check, Copy, Download, Loader2 } from "lucide-react";
import AstraLogo from "./AstraLogo";

const WatermarkedImage = ({ src, alt }) => {
  const [downloading, setDownloading] = React.useState(false);

  const handleDownload = () => {
    setDownloading(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx.drawImage(img, 0, 0);
      
      // Draw watermark logo at bottom-right
      const fontSize = Math.max(16, Math.floor(img.width * 0.035)); // Responsive base size
      ctx.textAlign = "right";
      
      const textX = canvas.width - Math.max(15, Math.floor(img.width * 0.025));
      const textY = canvas.height - Math.max(15, Math.floor(img.height * 0.025));
      
      /* 
      // Watermark text commented out as requested
      ctx.strokeText("Astra AI", textX, textY);
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillText("Astra AI", textX, textY);
      */
      
      // Draw Logo at the bottom-right corner (no text label)
      ctx.save();
      const logoSize = fontSize * 1.8; // Increased logo size multiplier
      const scale = logoSize / 100;
      
      const logoX = textX - logoSize;
      const logoY = textY - logoSize + (fontSize * 0.35); // Alignment adjustment
      
      ctx.translate(logoX, logoY);
      ctx.scale(scale, scale);
      
      // Set shadow for the logo paths
      ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
      ctx.shadowBlur = 6;
      
      // Draw paths (Astra Logo SVG paths)
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.fill(new Path2D("M50 15L15 85H32L50 48L68 85H85L50 15Z"));
      ctx.fill(new Path2D("M50 32L53 42H63L55 48L58 58L50 52L42 58L45 48L37 42H47L50 32Z"));
      ctx.restore();
      
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${alt ? alt.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 20) : "image"}_astra_ai.png`;
      link.click();
      setDownloading(false);
    };

    img.onerror = () => {
      console.error("Failed to load image for watermarking");
      setDownloading(false);
      // Fallback direct download in case of CORS errors
      const link = document.createElement("a");
      link.href = src;
      link.target = "_blank";
      link.download = "image.png";
      link.click();
    };
  };

  return (
    <div className="relative group my-4 max-w-md mx-auto rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-md">
      <img
        src={src}
        alt={alt}
        className="w-full h-auto max-h-[450px] object-contain block bg-slate-900"
        loading="lazy"
      />
      
      {/* CSS overlay watermark (professional bottom-right watermark in chat UI) */}
      <div className="absolute bottom-3 right-3 bg-black/55 dark:bg-black/65 backdrop-blur-md p-1.5 rounded-lg border border-white/10 pointer-events-none select-none flex items-center shadow-lg">
        <AstraLogo size={20} className="text-white/95" />
        {/* <span className="text-[10px] tracking-wider uppercase font-semibold text-white/90">Astra AI</span> */}
      </div>

      {/* Hover download button */}
      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="pointer-events-auto flex items-center gap-2 bg-white/90 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-900 text-slate-800 dark:text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-2xl backdrop-blur-sm transition-all transform translate-y-2 group-hover:translate-y-0"
        >
          {downloading ? (
            <>
              <Loader2 className="animate-spin text-slate-500 dark:text-white" size={14} />
              <span>Applying Watermark...</span>
            </>
          ) : (
            <>
              <Download size={14} />
              <span>Download Image</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export const MarkdownRenderer = ({ content }) => {
  if (!content) return null;

  // Split content by fenced code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  const copyToClipboard = (text, btnId) => {
    navigator.clipboard.writeText(text);
    const btn = document.getElementById(btnId);
    if (btn) {
      const originalHtml = btn.innerHTML;
      btn.innerHTML = `<span class="text-emerald-400 flex items-center gap-1 text-xs"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg> Copied!</span>`;
      setTimeout(() => {
        btn.innerHTML = originalHtml;
      }, 1500);
    }
  };

  const renderTextWithFormatting = (text) => {
    // Replace newlines with <br/>, bold (**text**), lists, etc.
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let trimmed = line.trim();

      // Heading 3
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-lg font-medium text-slate-800 dark:text-slate-100 mt-4 mb-2">
            {trimmed.slice(4)}
          </h3>
        );
      }
      // Heading 2
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-xl font-medium text-slate-800 dark:text-slate-100 mt-5 mb-2 border-b border-slate-200 dark:border-white/5 pb-1">
            {trimmed.slice(3)}
          </h2>
        );
      }
      // Heading 1
      if (trimmed.startsWith("# ")) {
        return (
          <h1 key={idx} className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-6 mb-3">
            {trimmed.slice(2)}
          </h1>
        );
      }
      // Blockquotes
      if (trimmed.startsWith("> ")) {
        return (
          <blockquote key={idx} className="border-l-4 border-slate-300 dark:border-white/25 bg-slate-50 dark:bg-white/5 pl-4 py-2 pr-2 my-2 rounded-r italic text-slate-800 dark:text-white">
            {trimmed.slice(2)}
          </blockquote>
        );
      }
      // Unordered lists
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        const itemContent = trimmed.slice(2);
        return (
          <li key={idx} className="list-disc list-inside ml-4 text-slate-800 dark:text-white my-1">
            {parseInlineFormatting(itemContent)}
          </li>
        );
      }
      // Numbered lists
      if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^(\d+\.\s)(.*)/);
        return (
          <li key={idx} className="list-decimal list-inside ml-4 text-slate-800 dark:text-white my-1">
            {parseInlineFormatting(match[2])}
          </li>
        );
      }

      // Empty line
      if (trimmed === "") {
        return <div key={idx} className="h-2" />;
      }

      // Default paragraph
      return (
        <div key={idx} className="text-slate-850 dark:text-white leading-relaxed my-1">
          {parseInlineFormatting(line)}
        </div>
      );
    });
  };

  const parseInlineFormatting = (text) => {
    // Matches images, links, bold, italic, code
    const regex = /(!\[.*?\]\(.*?\)|\[.*?\]\(.*?\)(?!!\[)|\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    const segments = text.split(regex);

    return segments.map((seg, sIdx) => {
      if (seg.startsWith("![") && seg.endsWith(")")) {
        const match = seg.match(/!\[(.*?)\]\((.*?)\)/);
        if (match) {
          const [, alt, url] = match;
          return <WatermarkedImage key={sIdx} src={url} alt={alt} />;
        }
      }
      if (seg.startsWith("[") && seg.endsWith(")")) {
        const match = seg.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
          const [, linkText, url] = match;
          return (
            <a
              key={sIdx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-500 hover:underline font-medium animate-fade-in"
            >
              {linkText}
            </a>
          );
        }
      }
      if (seg.startsWith("**") && seg.endsWith("**")) {
        return <strong key={sIdx} className="font-semibold text-slate-850 dark:text-white">{seg.slice(2, -2)}</strong>;
      }
      if (seg.startsWith("*") && seg.endsWith("*")) {
        return <em key={sIdx} className="italic text-slate-800 dark:text-white">{seg.slice(1, -1)}</em>;
      }
      if (seg.startsWith("`") && seg.endsWith("`")) {
        return (
          <code key={sIdx} className="bg-slate-100 dark:bg-white/5 text-pink-650 dark:text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono border border-slate-200 dark:border-white/5">
            {seg.slice(1, -1)}
          </code>
        );
      }
      return seg;
    });
  };

  return (
    <div className="prose max-w-none text-slate-800 dark:text-white text-[15px] space-y-1.5">
      {parts.map((part, pIdx) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          // It's a code block
          const lines = part.split("\n");
          // Extract language from first line, e.g. "```python"
          const lang = lines[0].replace("```", "").trim() || "code";
          const codeText = lines.slice(1, -1).join("\n");
          const btnId = `copy-btn-${pIdx}`;

          return (
            <div key={pIdx} className="my-4 rounded-lg overflow-hidden border border-white/5 shadow-2xl font-mono text-sm bg-darkCard/90 backdrop-blur-md">
              <div className="flex items-center justify-between px-4 py-2.5 bg-darkCard border-b border-white/5 text-xs text-slate-400 select-none">
                <span>{lang.toUpperCase()}</span>
                <button
                  id={btnId}
                  onClick={() => copyToClipboard(codeText, btnId)}
                  className="flex items-center gap-1 hover:text-slate-200 transition-colors py-0.5 px-1 rounded hover:bg-white/5"
                >
                  <Copy size={12} />
                  <span>Copy</span>
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-white leading-relaxed font-mono whitespace-pre text-xs">
                <code>{codeText}</code>
              </pre>
            </div>
          );
        } else {
          // Regular text
          return <div key={pIdx}>{renderTextWithFormatting(part)}</div>;
        }
      })}
    </div>
  );
};
export default MarkdownRenderer;
