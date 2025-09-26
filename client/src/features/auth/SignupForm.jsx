// src/features/auth/SignupForm.jsx
import { useState } from "react";
import Input from "../../ui/controls/Input";
import Button from "../../ui/controls/Button";
import { isEmail, minLength } from "../../utils/validators";
import useAuth from "../../auth/useAuth";
import { showToast } from "../../utils/toast";
import { useNavigate } from "react-router-dom";

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

export default function SignupForm({ onSwitchToLogin }) {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("DONOR");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;
    if (!isEmail(email)) return showToast({ variant: "error", message: "Enter a valid email" });
    if (!minLength(password, 6)) return showToast({ variant: "error", message: "Password must be at least 6 characters" });
    if (password !== confirm) return showToast({ variant: "error", message: "Passwords do not match" });
    if (!["DONOR", "REQUESTER"].includes(role)) return showToast({ variant: "error", message: "Choose a valid role" });

    try {
      setLoading(true);
      const me = await signup(email, password, role);
      if (me.role === "DONOR") {
        return navigate("/donor/profile", { replace: true });
      } else {
        return navigate("/requester/profile", { replace: true });
      }
    } catch (e2) {
      showToast({ variant: "error", message: e2.message || "Signup failed" });
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

      <Input
        id="confirm"
        label="Confirm Password"
        type={showConfirm ? "text" : "password"}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        disabled={loading}
        rightAdornment={
          <button
            type="button"
            onClick={() => setShowConfirm((s) => !s)}
            aria-label={showConfirm ? "Hide password" : "Show password"}
            title={showConfirm ? "Hide password" : "Show password"}
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
            <Eye filled={showConfirm} />
          </button>
        }
      />

      <div className="form-field">
        <div className="form-label">Choose your role</div>
        <div style={{ display: "flex", gap: 16 }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="radio"
              name="role"
              value="DONOR"
              checked={role === "DONOR"}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            />
            Donor
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="radio"
              name="role"
              value="REQUESTER"
              checked={role === "REQUESTER"}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            />
            Requester
          </label>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
        <Button type="submit" disabled={loading}>
          {loading ? "Signing up..." : "Create account"}
        </Button>
        <button
          type="button"
          className="btn ghost"
          onClick={onSwitchToLogin}
          disabled={loading}
        >
          Already have an account? Login
        </button>
      </div>
    </form>
  );
}