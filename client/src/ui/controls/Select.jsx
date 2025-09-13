export default function Select({ label, hint, id, children, ...props }) {
  return (
    <div className="form-field">
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <select id={id} className="select" {...props}>
        {children}
      </select>
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  );
}