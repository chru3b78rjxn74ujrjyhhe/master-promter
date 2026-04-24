import { CopyButton } from "@/components/CopyButton";
import { Heart, Download } from "lucide-react";

export default function PromptResult({ result, onSaveFavorite, onExport, isFavorited }) {
  if (!result) return null;

  return (
    <div
      className="animate-fade-up flex flex-col gap-10"
      data-testid="result-section"
    >
      <div className="mp-rule" />

      {/* IV. The Engineered Prompt */}
      <section className="flex flex-col gap-5">
        <div className="mp-section-label">
          <span className="num">IV.</span>
          <span className="title">The Engineered Prompt</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="mp-chip">{result.target_ai}</span>
            <span className="mp-chip">{result.style}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSaveFavorite}
              disabled={isFavorited}
              className="mp-btn-ghost"
              data-testid="save-favorite-btn"
            >
              <Heart
                size={14}
                fill={isFavorited ? "#C9A84C" : "none"}
                stroke={isFavorited ? "#C9A84C" : "currentColor"}
              />
              <span>{isFavorited ? "Saved" : "Save"}</span>
            </button>
            <button
              type="button"
              onClick={onExport}
              className="mp-btn-ghost"
              data-testid="export-btn"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
            <CopyButton
              text={result.prompt}
              label="Copy prompt"
              testId="copy-main-prompt-btn"
            />
          </div>
        </div>

        <div className="mp-result" data-testid="main-prompt-box">
          <pre className="mp-mono">{result.prompt}</pre>
        </div>
      </section>

      <div className="mp-rule" />

      {/* V. Pro Tips */}
      <section className="flex flex-col gap-5">
        <div className="mp-section-label">
          <span className="num">V.</span>
          <span className="title">Three Pro Tips</span>
        </div>
        <div className="flex flex-col gap-3" data-testid="tips-list">
          {result.tips.map((tip, i) => (
            <div
              key={i}
              className="mp-tip"
              data-testid={`tip-${i}`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="mp-tip-num">{romanize(i + 1)}.</span>
              <p className="text-[0.93rem] leading-relaxed text-parchment/85 font-body">
                {tip}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mp-rule" />

      {/* VI. Variations */}
      <section className="flex flex-col gap-5">
        <div className="mp-section-label">
          <span className="num">VI.</span>
          <span className="title">Two Variations</span>
        </div>
        <div className="flex flex-col gap-5" data-testid="variations-list">
          {result.variations.map((v, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="mp-eyebrow">Variation {romanize(i + 1)}</span>
                <CopyButton
                  text={v}
                  label="Copy"
                  testId={`copy-variation-${i}-btn`}
                />
              </div>
              <div className="mp-result" data-testid={`variation-${i}-box`}>
                <pre className="mp-mono">{v}</pre>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function romanize(n) {
  const map = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  return map[n - 1] || String(n);
}
