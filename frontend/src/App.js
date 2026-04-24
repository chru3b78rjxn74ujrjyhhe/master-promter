import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import MasterPrompter from "@/pages/MasterPrompter";

export default function App() {
  return (
    <div className="App">
      <div className="mp-bg" />
      <div className="mp-radial" />
      <div className="mp-dotgrid" />
      <div className="mp-grain" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MasterPrompter />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        theme="dark"
        position="bottom-center"
        toastOptions={{
          style: {
            background: "rgba(10, 10, 20, 0.95)",
            border: "1px solid rgba(201, 168, 76, 0.35)",
            color: "#EDE8F5",
            fontFamily: "Inter, sans-serif",
            borderRadius: "9999px",
            padding: "0.6rem 1.1rem",
            fontSize: "0.85rem",
            letterSpacing: "0.05em",
          },
        }}
      />
    </div>
  );
}
