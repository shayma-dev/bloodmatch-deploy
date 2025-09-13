  // src/pages/Login.jsx
  import AppLayout from "../ui/layout/AppLayout";
  import { useState } from "react";
  import useAuth from "../auth/useAuth";
  import Input from "../ui/controls/Input.jsx";
  import Button from "../ui/controls/Button.jsx";
  import { isEmail, minLength } from "../utils/validators";
  import { useNavigate, useLocation } from "react-router-dom";
  import { showToast } from "../utils/toast";

  export default function Login() {
    const { user, logout, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function onSubmit(e) {
      e.preventDefault();
      if (!isEmail(email)) return showToast({ variant: "error", message: "Enter a valid email" });
      if (!minLength(password, 6)) return showToast({ variant: "error", message: "Password too short" });
      try {
        const me = await login(email, password);

        // If the user was trying to access a protected route, honor it first
        if (from) {
          return navigate(from, { replace: true });
        }

        // Route by role; enforce profile creation first time
        if (me.role === "DONOR") {
          if (!me.donorProfile) return navigate("/donor/profile", { replace: true });
          return navigate("/donor/dashboard", { replace: true });
        } else {
          if (!me.requesterProfile) return navigate("/requester/profile", { replace: true });
          return navigate("/requester/requests", { replace: true });
        }
      } catch (e) {
        showToast({ variant: "error", message: e.message || "Login failed" });
      }
    }

    return (
      <AppLayout user={user} onLogout={logout}>
        <div className="card" style={{ maxWidth: 480, margin: "40px auto" }}>
          <h2>Login</h2>
          <form onSubmit={onSubmit}>
            <Input id="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit">Login</Button>
          </form>
        </div>
      </AppLayout>
    );
  }