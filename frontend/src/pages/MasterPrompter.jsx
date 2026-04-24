import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Sparkles, Feather } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PromptResult from "@/components/PromptResult";
import { HistoryPanel, FavoritesPanel } from "@/components/SidePanels";
import { TARGET_AIS, PROMPT_STYLES } from "@/lib/constants";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function MasterPrompter() {
  const [idea, setIdea] = useState("");
  const [targetAi, setTargetAi] = useState("ChatGPT");
  const [style, setStyle] = useState("Detailed & Technical");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const favoriteKey = useMemo(() => {
    if (!result) return null;
    return `${result.target_ai}|${result.style}|${(result.prompt || "").slice(0, 80)}`;
  }, [result]);

  const isFavorited = useMemo(() => {
    if (!favoriteKey) return false;
    return favorites.some(
      (f) =>
        `${f.target_ai}|${f.style}|${(f.prompt || "").slice(0, 80)}` ===
        favoriteKey
    );
  }, [favoriteKey, favorites]);

  useEffect(() => {
    fetchHistory();
    fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHistory = async () => {
    try {
      const r = await axios.get(`${API}/history`);
      setHistory(r.data || []);
    } catch (e) {
      console.error("history fetch error", e);
    }
  };

  const fetchFavorites = async () => {
    try {
      const r = await axios.get(`${API}/favorites`);
      setFavorites(r.data || []);
    } catch (e) {
      console.error("favorites fetch error", e);
    }
  };

  const handleGenerate = async () => {
    if (!idea.trim()) {
      toast.error("Please describe your idea first");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await axios.post(`${API}/generate`, {
        idea: idea.trim(),
        target_ai: targetAi,
        style,
      });
      setResult(r.data);
      fetchHistory();
      toast.success("Prompt engineered");
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Something went wrong generating the prompt";
      toast.error(typeof msg === "string" ? msg : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFavorite = async () => {
    if (!result || isFavorited) return;
    try {
      await axios.post(`${API}/favorites`, {
        idea: result.idea,
        target_ai: result.target_ai,
        style: result.style,
        prompt: result.prompt,
        tips: result.tips,
        variations: result.variations,
      });
      toast.success("Added to favorites");
      fetchFavorites();
    } catch (e) {
      toast.error("Could not save favorite");
    }
  };

  const handleExport = () => {
    if (!result) return;
    const payload = {
      target_ai: result.target_ai,
      style: result.style,
      idea: result.idea,
      prompt: result.prompt,
      tips: result.tips,
      variations: result.variations,
      created_at: result.created_at,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `master-prompter-${result.id.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Exported as JSON");
  };

  const loadFromEntry = (entry) => {
    setIdea(entry.idea || "");
    setTargetAi(entry.target_ai || "ChatGPT");
    setStyle(entry.style || "Detailed & Technical");
    setResult(entry);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteHistory = async (id) => {
    try {
      await axios.delete(`${API}/history/${id}`);
      fetchHistory();
      toast.success("Removed");
    } catch {
      toast.error("Delete failed");
    }
  };

  const clearHistory = async () => {
    try {
      await axios.delete(`${API}/history`);
      fetchHistory();
      toast.success("History cleared");
    } catch {
      toast.error("Clear failed");
    }
  };

  const deleteFavorite = async (id) => {
    try {
      await axios.delete(`${API}/favorites/${id}`);
      fetchFavorites();
      toast.success("Removed from favorites");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <main className="relative z-10 min-h-screen">
      <div className="max-w-[820px] mx-auto px-6 md:px-8 pt-10 md:pt-16 pb-24">
        {/* Header */}
        <header className="flex items-center justify-between mb-10 md:mb-14">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-gold/40 flex items-center justify-center bg-[#0a0a14]">
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
          </div>

          <nav className="flex items-center gap-2">
            <FavoritesPanel
              items={favorites}
              onLoad={loadFromEntry}
              onDelete={deleteFavorite}
            />
            <HistoryPanel
              items={history}
              onLoad={loadFromEntry}
              onDelete={deleteHistory}
              onClear={clearHistory}
            />
          </nav>
        </header>

        {/* Hero */}
        <section className="mb-14 md:mb-20" data-testid="hero-section">
          <div className="mp-eyebrow mb-5">A Studio for Prompt Craft</div>
          <h1 className="font-heading text-[2.6rem] sm:text-5xl lg:text-[3.4rem] leading-[1.05] tracking-tight text-parchment text-balance">
            Turn a rough idea into a{" "}
            <span className="italic text-gold">perfectly engineered</span>{" "}
            prompt.
          </h1>
          <p className="mt-6 max-w-[58ch] text-parchment/65 leading-relaxed font-body">
            Describe what you want, choose the target AI and tone, and receive
            a crafted prompt with three pro tips and two variations — tuned for
            the tool you're using.
          </p>
        </section>

        {/* Main card */}
        <div className="mp-card p-7 md:p-10 flex flex-col gap-8">
          {/* Step I */}
          <section className="flex flex-col gap-4" data-testid="step-idea">
            <div className="mp-section-label">
              <span className="num">I.</span>
              <span className="title">Your Rough Idea</span>
            </div>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="e.g. a moody photograph of an abandoned greenhouse at dawn, shot on film…"
              rows={4}
              className="mp-input font-body resize-none"
              data-testid="idea-input"
            />
          </section>

          <div className="mp-rule" />

          {/* Step II */}
          <section className="flex flex-col gap-4" data-testid="step-config">
            <div className="mp-section-label">
              <span className="num">II.</span>
              <span className="title">Target AI &amp; Style</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[0.7rem] tracking-[0.28em] uppercase text-parchment/55 font-body">
                  Target AI
                </label>
                <Select value={targetAi} onValueChange={setTargetAi}>
                  <SelectTrigger
                    className="mp-select-trigger"
                    data-testid="target-ai-select"
                  >
                    <SelectValue placeholder="Choose target AI" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a14] border-[#9D6FE8]/30 text-parchment">
                    {TARGET_AIS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="focus:bg-[#6C3FC5]/20 focus:text-parchment"
                        data-testid={`target-ai-option-${opt.value}`}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[0.7rem] tracking-[0.28em] uppercase text-parchment/55 font-body">
                  Prompt Style
                </label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger
                    className="mp-select-trigger"
                    data-testid="style-select"
                  >
                    <SelectValue placeholder="Choose a style" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a14] border-[#9D6FE8]/30 text-parchment">
                    {PROMPT_STYLES.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="focus:bg-[#6C3FC5]/20 focus:text-parchment"
                        data-testid={`style-option-${opt.value}`}
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <div className="mp-rule" />

          {/* Step III */}
          <section
            className="flex flex-col items-center gap-3"
            data-testid="step-generate"
          >
            <div className="mp-section-label w-full">
              <span className="num">III.</span>
              <span className="title">Engineer the Prompt</span>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="mp-btn mt-2"
              data-testid="generate-btn"
            >
              <span className="mp-shimmer" />
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Engineering…</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate Prompt</span>
                </>
              )}
            </button>
            <p className="text-[0.7rem] tracking-[0.24em] uppercase text-parchment/40 font-body mt-1">
              Crafted by Claude Sonnet 4
            </p>
          </section>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-12">
            <PromptResult
              result={result}
              onSaveFavorite={handleSaveFavorite}
              onExport={handleExport}
              isFavorited={isFavorited}
            />
          </div>
        )}

        {/* Footer */}
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
