import { useMemo } from "react";
import { checkPasswordStrength } from "../utils/validation";

/**
 * Inline Password Error Message Component
 * Displays clean inline error message only when password does not meet requirements.
 */
export default function PasswordRequirementsBox({ password = "" }) {
  const analysis = useMemo(() => checkPasswordStrength(password), [password]);

  if (!password || analysis.isValid) return null;

  return (
    <div className="field-inline-error">
      <span className="field-inline-error-icon">⚠️</span>
      <span>
        {analysis.errors.length === 1
          ? `${analysis.errors[0]}.`
          : "Password must be at least 8 characters and include uppercase, lowercase, number, and a special character."}
      </span>
    </div>
  );
}
