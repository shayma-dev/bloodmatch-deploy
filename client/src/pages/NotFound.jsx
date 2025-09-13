// src/pages/NotFound.jsx
import AppLayout from "../ui/layout/AppLayout";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <AppLayout>
      <div className="container">
        <div className="card" style={{ textAlign: "center" }}>
          <h2>404<br></br>Page not found</h2>
          <p className="muted">The page you are looking for doesn’t exist.</p>
          <Link to="/" className="btn">Go Home</Link>
        </div>
      </div>
    </AppLayout>
  );
}