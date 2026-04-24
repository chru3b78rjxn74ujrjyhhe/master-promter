import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";

export function CopyButton({ text, label = "Copy", testId }) {
  const [copied, setCopied] = useState(false);

  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      data-testid={testId}
      className="mp-btn-ghost"
      aria-label={label || "Copy"}
    >
      {copied ? (
        <Check size={14} />
      ) : (
        <span aria-hidden="true" style={{ fontSize: "0.9rem", lineHeight: 1 }}>
          📋
        </span>
      )}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}
