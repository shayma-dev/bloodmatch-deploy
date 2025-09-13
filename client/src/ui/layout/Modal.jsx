// src/ui/layout/Modal.jsx
import { useEffect } from "react";

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      aria-modal="true"
      role="dialog"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "grid",
        placeItems: "center",
        zIndex: 100,
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="card"
        style={{ width: "100%", maxWidth: 520, position: "relative" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <h2 style={{ marginRight: 16 }}>{title}</h2>
          <button aria-label="Close" className="btn ghost" onClick={onClose}>Close</button>
        </div>
        <div style={{ marginTop: 16 }}>{children}</div>
      </div>
    </div>
  );
}