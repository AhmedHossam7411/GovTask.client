import { AbstractControl } from "@angular/forms";

export function passwordRules(control:AbstractControl)
{
  const value = control.value || '';

  const hasNumber = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);
  const hasUpperCase = /[A-Z]/.test(value);

  if (!hasNumber || !hasSymbol || !hasUpperCase) {
    return { passwordRules: true };
  }

  return null;
}