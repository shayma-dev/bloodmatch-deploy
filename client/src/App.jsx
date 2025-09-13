// src/App.jsx
import { BrowserRouter } from "react-router-dom";
import  AuthProvider  from "./auth/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import ToastHost from "./ui/layout/ToastHost";
import "./styles/globals.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastHost />
      </BrowserRouter>
    </AuthProvider>
  );
}