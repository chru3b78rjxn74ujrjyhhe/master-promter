import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import MasterPrompter from "@/pages/MasterPrompter";
import SharedPrompt from "@/pages/SharedPrompt";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";

function ThemedToaster() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <Toaster
      theme={isDark ? "dark" : "light"}
      position="bottom-center"
      toastOptions={{
        style: {
          background: isDark
            ? "rgba(10, 10, 20, 0.95)"
            : "rgba(254, 251, 242, 0.98)",
          border: isDark
            ? "1px solid rgba(201, 168, 76, 0.35)"
            : "1px solid rgba(138, 104, 32, 0.5)",
          color: isDark ? "#EDE8F5" : "#1a1628",
          fontFamily: "Inter, sans-serif",
          borderRadius: "9999px",
          padding: "0.6rem 1.1rem",
          fontSize: "0.85rem",
          letterSpacing: "0.05em",
        },
      }}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <div className="mp-bg" />
        <div className="mp-radial" />
        <div className="mp-dotgrid" />
        <div className="mp-grain" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MasterPrompter />} />
            <Route path="/share/:id" element={<SharedPrompt />} />
          </Routes>
        </BrowserRouter>
        <ThemedToaster />
      </div>
    </ThemeProvider>
  );
}
