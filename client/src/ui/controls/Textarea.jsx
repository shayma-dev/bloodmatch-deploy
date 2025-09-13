export default function Textarea({ label, hint, id, ...props }) {
  return (
    <div className="form-field">
      {label && <label className="form-label" htmlFor={id}>{label}</label>}
      <textarea id={id} className="textarea" rows={4} {...props} />
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  );
}