import type Input from '../components/Input';
import { validateField, validateForm } from './validation';

export type InputsMap = Record<string, Input>;

export const createHandleBlur = (inputsByName: InputsMap) => (fieldName: string) => (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  const error = validateField(fieldName, value);
  inputsByName[fieldName]?.setProps({ value, error: error ?? undefined });
};

export const validateAndDisplayErrors = (form: HTMLFormElement, inputsByName: InputsMap): boolean => {
  const formData = new FormData(form);
  const values = Object.fromEntries(formData.entries());
  const errors = validateForm(values);
  let hasError = false;

  Object.entries(inputsByName).forEach(([name, input]) => {
    const error = errors[name];
    const currentValue = values[name];
    const value = typeof currentValue === 'string' ? currentValue : '';
    input.setProps({ value, error: error ?? undefined });
    if (error) hasError = true;
  });

  return !hasError;
};
