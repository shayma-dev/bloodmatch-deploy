// src/ui/controls/Input.jsx
import React from "react";

export default function Input({
  label,
  hint,
  id,
  rightAdornment, // NEW: pass a React node (e.g., button with SVG) to render inside the input on the right
  className,
  inputClassName,
  style,
  inputStyle,
  ...props
}) {
  const hasAdornment = Boolean(rightAdornment);

  return (
    <div className={`form-field ${className || ""}`} style={style}>
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}
        </label>
      )}

      <div style={{ position: "relative" }}>
        <input
          id={id}
          className={`input ${inputClassName || ""}`}
          // Ensure there is room for the icon when present
          style={{
            paddingRight: hasAdornment ? 44 : undefined,
            ...(inputStyle || {}),
          }}
          {...props}
        />

        {hasAdornment && (
          <div
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "auto",
            }}
          >
            {rightAdornment}
          </div>
        )}
      </div>

      {hint && <div className="form-hint">{hint}</div>}
    </div>
  );
}