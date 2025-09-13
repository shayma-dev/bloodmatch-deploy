import Container from "./Container";
import Navbar from "./Navbar";

export default function AppLayout({ user, onLogout, children }) {
  return (
    <div className="app-shell">
      <Navbar user={user} onLogout={onLogout} />
      <Container>{children}</Container>
      {/* Optional footer */}
    </div>
  );
}