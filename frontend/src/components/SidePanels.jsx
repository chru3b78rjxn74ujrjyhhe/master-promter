import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { History, Star, Trash2, ChevronRight } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";

export function HistoryPanel({ items, onLoad, onDelete, onClear }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="mp-btn-ghost"
          data-testid="history-open-btn"
        >
          <History size={14} />
          <span>History</span>
          {items.length > 0 && (
            <span className="ml-1 text-[10px] text-gold">{items.length}</span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="bg-[#080810] border-l border-[#9D6FE8]/20 text-parchment w-[420px] sm:max-w-[420px] p-0 flex flex-col"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#9D6FE8]/10">
          <SheetTitle className="font-heading text-2xl text-parchment flex items-center gap-3">
            <span className="mp-roman">§</span>
            History
          </SheetTitle>
          <p className="text-xs tracking-[0.2em] uppercase text-gold/80">
            Your recent engineered prompts
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4">
          {items.length === 0 ? (
            <EmptyState label="No prompts yet" />
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <EntryCard
                  key={item.id}
                  item={item}
                  onLoad={() => {
                    onLoad(item);
                    setOpen(false);
                  }}
                  onDelete={() => onDelete(item.id)}
                  testPrefix="history"
                />
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="px-6 py-4 border-t border-[#9D6FE8]/10">
            <button
              type="button"
              onClick={onClear}
              className="mp-btn-ghost w-full justify-center"
              data-testid="history-clear-btn"
            >
              <Trash2 size={14} />
              <span>Clear all history</span>
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function FavoritesPanel({ items, onLoad, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="mp-btn-ghost"
          data-testid="favorites-open-btn"
        >
          <Star size={14} />
          <span>Favorites</span>
          {items.length > 0 && (
            <span className="ml-1 text-[10px] text-gold">{items.length}</span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="bg-[#080810] border-l border-[#9D6FE8]/20 text-parchment w-[420px] sm:max-w-[420px] p-0 flex flex-col"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[#9D6FE8]/10">
          <SheetTitle className="font-heading text-2xl text-parchment flex items-center gap-3">
            <span className="mp-roman">★</span>
            Favorites
          </SheetTitle>
          <p className="text-xs tracking-[0.2em] uppercase text-gold/80">
            Your curated collection
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4">
          {items.length === 0 ? (
            <EmptyState label="No favorites saved" />
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <EntryCard
                  key={item.id}
                  item={item}
                  onLoad={() => {
                    onLoad(item);
                    setOpen(false);
                  }}
                  onDelete={() => onDelete(item.id)}
                  testPrefix="favorite"
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function EntryCard({ item, onLoad, onDelete, testPrefix }) {
  const preview = (item.prompt || "").slice(0, 140);
  return (
    <div
      className="group rounded-xl border border-[#9D6FE8]/15 bg-[#0a0a14] hover:border-[#9D6FE8]/40 transition-colors p-4 flex flex-col gap-3"
      data-testid={`${testPrefix}-item-${item.id}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="mp-chip text-[0.62rem]">{item.target_ai}</span>
          <span className="mp-chip text-[0.62rem]">{item.style}</span>
        </div>
        <div className="flex items-center gap-1">
          <CopyButton
            text={item.prompt}
            label=""
            testId={`${testPrefix}-copy-${item.id}`}
          />
          <button
            type="button"
            onClick={onDelete}
            className="mp-btn-ghost"
            data-testid={`${testPrefix}-delete-${item.id}`}
            aria-label="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <p className="font-mono text-[0.78rem] leading-relaxed text-parchment/70 line-clamp-3">
        {preview}
        {item.prompt && item.prompt.length > 140 ? "…" : ""}
      </p>
      <button
        type="button"
        onClick={onLoad}
        className="self-end inline-flex items-center gap-1 text-[0.72rem] tracking-[0.2em] uppercase text-gold/90 hover:text-gold transition-colors"
        data-testid={`${testPrefix}-load-${item.id}`}
      >
        Load <ChevronRight size={12} />
      </button>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
      <div className="mp-roman text-2xl">—</div>
      <p className="font-body text-sm text-parchment/50 tracking-wide">
        {label}
      </p>
    </div>
  );
}
