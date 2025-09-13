export default function Input({ label, hint, id, ...props }) {
  return (
    <div className="form-field">
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <input id={id} className="input" {...props} />
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  );
}