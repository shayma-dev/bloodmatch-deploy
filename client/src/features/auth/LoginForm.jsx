// src/features/auth/LoginForm.jsx
import { useState } from "react";
import Input from "../../ui/controls/Input";
import Button from "../../ui/controls/Button";
import { isEmail, minLength } from "../../utils/validators";
import useAuth from "../../auth/useAuth";
import { showToast } from "../../utils/toast";
import { useNavigate, useLocation } from "react-router-dom";

export default function LoginForm({ onSwitchToSignup }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    if (!isEmail(email)) return showToast({ variant: "error", message: "Enter a valid email" });
    if (!minLength(password, 6)) return showToast({ variant: "error", message: "Password must be at least 6 characters" });

    try {
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
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Input id="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
        <Button type="submit">Login</Button>
        <button type="button" className="btn ghost" onClick={onSwitchToSignup}>
          Need an account? Sign up
        </button>
      </div>
    </form>
  );
}