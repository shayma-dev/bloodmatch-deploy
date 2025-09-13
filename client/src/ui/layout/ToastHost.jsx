import { useEffect, useState } from "react";
import { toastBus } from "../../utils/toast";

export default function ToastHost() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsub = toastBus.subscribe((t) => {
      setItems((prev) => [...prev, t]);
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id));
      }, t.duration || 3000);
    });
    return () => unsub();
  }, []);

  return (
    <div className="toast">
      {items.map((t) => (
        <div key={t.id} className={`toast-item ${t.variant || ""}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}