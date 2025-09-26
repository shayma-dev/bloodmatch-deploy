// src/features/auth/LoginForm.jsx
import { useState } from "react";
import Input from "../../ui/controls/Input";
import Button from "../../ui/controls/Button";
import { isEmail, minLength } from "../../utils/validators";
import useAuth from "../../auth/useAuth";
import { showToast } from "../../utils/toast";
import { useNavigate, useLocation } from "react-router-dom";

function Eye({ filled = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      {filled ? <circle cx="12" cy="12" r="3" fill="white" /> : <circle cx="12" cy="12" r="3" />}
    </svg>
  );
}

export default function LoginForm({ onSwitchToSignup }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;
    if (!isEmail(email)) return showToast({ variant: "error", message: "Enter a valid email" });
    if (!minLength(password, 6)) return showToast({ variant: "error", message: "Password must be at least 6 characters" });

    try {
      setLoading(true);
      const me = await login(email, password);
      if (me.role === "DONOR") {
        if (!me.donorProfile) return navigate("/donor/profile", { replace: true });
        return navigate(from || "/donor", { replace: true });
      } else {
        if (!me.requesterProfile) return navigate("/requester/profile", { replace: true });
        return navigate(from || "/requester", { replace: true });
      }
    } catch (e2) {
      showToast({ variant: "error", message: e2.message || "Login failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Input
        id="email"
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
      />

      <Input
        id="password"
        label="Password"
        type={showPassword ? "text" : "password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        rightAdornment={
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
            disabled={loading}
            style={{
              background: "transparent",
              border: "none",
              padding: 4,
              cursor: "pointer",
              color: "white",
              opacity: 0.95,
            }}
          >
            <Eye filled={showPassword} />
          </button>
        }
      />

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
        <Button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
        <button
          type="button"
          className="btn ghost"
          onClick={onSwitchToSignup}
          disabled={loading}
        >
          Need an account? Sign up
        </button>
      </div>
    </form>
  );
}