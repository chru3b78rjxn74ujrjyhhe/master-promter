import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { CopyButton } from "@/components/CopyButton";
import { Feather, ArrowLeft, Loader2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SharedPrompt() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await axios.get(`${API}/shared/${id}`);
        if (!cancelled) setResult(r.data);
      } catch (e) {
        if (!cancelled)
          setError(e?.response?.data?.detail || "Prompt not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <main className="relative z-10 min-h-screen">
      <div className="max-w-[820px] mx-auto px-6 md:px-8 pt-10 md:pt-16 pb-24">
        <header className="flex items-center justify-between mb-10 md:mb-14">
          <Link to="/" className="flex items-center gap-3" data-testid="back-home-link">
            <div className="w-9 h-9 rounded-full border border-gold/40 flex items-center justify-center bg-[color:var(--mp-card-solid,#0a0a14)]">
              <Feather size={16} className="text-gold" />
            </div>
            <div className="leading-tight">
              <div className="text-[0.65rem] tracking-[0.38em] uppercase text-gold/80">
                Atelier
              </div>
              <div className="font-heading text-lg text-parchment italic">
                Master Prompter
              </div>
            </div>
          </Link>
          <Link to="/" className="mp-btn-ghost" data-testid="back-to-studio-btn">
            <ArrowLeft size={14} />
            <span>Back to studio</span>
          </Link>
        </header>

        {loading && (
          <div className="flex items-center gap-3 text-parchment/70">
            <Loader2 size={16} className="animate-spin" />
            <span className="font-body text-sm tracking-wide">Loading shared prompt…</span>
          </div>
        )}

        {error && !loading && (
          <div className="mp-card p-10 text-center" data-testid="shared-error">
            <div className="mp-roman text-3xl mb-3">—</div>
            <p className="font-heading italic text-parchment/70 text-lg">{error}</p>
          </div>
        )}

        {result && !loading && (
          <div className="flex flex-col gap-10" data-testid="shared-result">
            <section className="flex flex-col gap-3">
              <div className="mp-eyebrow">A shared prompt</div>
              <h1 className="mp-h1 text-balance">
                Engineered for{" "}
                <span className="italic text-gold">{result.target_ai}</span>
              </h1>
              <p className="text-parchment/65 font-body leading-relaxed max-w-[60ch] text-[1.02rem]">
                Original idea: <span className="italic">{result.idea}</span>
              </p>
              <div className="flex items-center gap-2 flex-wrap mt-2">
                <span className="mp-chip">{result.target_ai}</span>
                <span className="mp-chip">{result.style}</span>
              </div>
            </section>

            <div className="mp-rule" />

            <section className="flex flex-col gap-5">
              <div className="mp-section-label">
                <span className="num">I.</span>
                <span className="title">The Engineered Prompt</span>
              </div>
              <div className="flex justify-end">
                <CopyButton
                  text={result.prompt}
                  label="Copy prompt"
                  testId="shared-copy-main-btn"
                />
              </div>
              <div className="mp-result" data-testid="shared-main-prompt">
                <pre className="mp-mono">{result.prompt}</pre>
              </div>
            </section>

            <div className="mp-rule" />

            <section className="flex flex-col gap-5">
              <div className="mp-section-label">
                <span className="num">II.</span>
                <span className="title">Three Pro Tips</span>
              </div>
              <div className="flex flex-col gap-3">
                {result.tips.map((tip, i) => (
                  <div key={i} className="mp-tip">
                    <span className="mp-tip-num">{["I","II","III"][i]}.</span>
                    <p className="text-[0.93rem] leading-relaxed text-parchment/85 font-body">
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <div className="mp-rule" />

            <section className="flex flex-col gap-5">
              <div className="mp-section-label">
                <span className="num">III.</span>
                <span className="title">Two Variations</span>
              </div>
              {result.variations.map((v, i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="mp-eyebrow">Variation {["I","II"][i]}</span>
                    <CopyButton
                      text={v}
                      label="Copy"
                      testId={`shared-copy-variation-${i}-btn`}
                    />
                  </div>
                  <div className="mp-result">
                    <pre className="mp-mono">{v}</pre>
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}

        <footer className="mt-20 text-center">
          <div className="mp-rule mb-8" />
          <p className="font-heading italic text-parchment/45 text-sm">
            An editorial instrument for the craft of prompting.
          </p>
        </footer>
      </div>
    </main>
  );
}
