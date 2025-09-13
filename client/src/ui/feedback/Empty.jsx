    export default function Empty({ title = "Nothing here yet", children }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {children}
    </div>
  );
}