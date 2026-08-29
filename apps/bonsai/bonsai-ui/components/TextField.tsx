import React from "react";

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Field label. */
  label?: string;
  /** Helper or error text below the input. */
  hint?: string;
  /** Render in error state. */
  error?: boolean;
}

let _id = 0;

/**
 * TextField — labelled text input.
 *
 * @example
 * <TextField label="Nombre" placeholder="Marta Ríos" />
 */
export function TextField({ label, hint, error, className, id, ...rest }: TextFieldProps) {
  const autoId = React.useMemo(() => id ?? `field-${++_id}`, [id]);
  const cls = ["field", error ? "field--error" : "", className].filter(Boolean).join(" ");
  return (
    <div className={cls}>
      {label && (
        <label className="field-label" htmlFor={autoId}>
          {label}
        </label>
      )}
      <input id={autoId} className="field-input" {...rest} />
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

export default TextField;
