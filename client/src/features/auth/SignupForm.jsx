// src/features/auth/SignupForm.jsx
import { useState } from "react";
import Input from "../../ui/controls/Input";
import Button from "../../ui/controls/Button";
import { isEmail, minLength } from "../../utils/validators";
import useAuth from "../../auth/useAuth";
import { showToast } from "../../utils/toast";
import { useNavigate } from "react-router-dom";

export default function SignupForm({ onSwitchToLogin }) {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("DONOR");

  async function onSubmit(e) {
    e.preventDefault();
    if (!isEmail(email)) return showToast({ variant: "error", message: "Enter a valid email" });
    if (!minLength(password, 6)) return showToast({ variant: "error", message: "Password must be at least 6 characters" });
    if (password !== confirm) return showToast({ variant: "error", message: "Passwords do not match" });
    if (!["DONOR", "REQUESTER"].includes(role)) return showToast({ variant: "error", message: "Choose a valid role" });

    try {
      const me = await signup(email, password, role);
      if (me.role === "DONOR") {
        // Force profile creation first time
        return navigate("/donor/profile", { replace: true });
      } else {
        return navigate("/requester/profile", { replace: true });
      }
    } catch (e2) {
      showToast({ variant: "error", message: e2.message || "Signup failed" });
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Input id="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Input id="confirm" label="Confirm Password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />

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
            />
            Requester
          </label>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
        <Button type="submit">Create account</Button>
        <button type="button" className="btn ghost" onClick={onSwitchToLogin}>
          Already have an account? Login
        </button>
      </div>
    </form>
  );
}