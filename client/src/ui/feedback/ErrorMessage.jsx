export default function ErrorMessage({ error }) {
  if (!error) return null;
  return <div style={{ color: "var(--color-danger)" }}>{error.message || "Something went wrong"}</div>;
}