type ValidationResult = string | null;

type Rule = {
  regex: RegExp;
  message: string;
};

const NAME_RULE: Rule = {
  regex: /^[A-ZА-ЯЁ][A-Za-zА-Яа-яЁё-]*$/,
  message: 'Первая буква заглавная, только буквы или дефис, без пробелов и цифр',
};

const PASSWORD_RULE: Rule = {
  regex: /^(?=.*[A-Z])(?=.*\d).{8,40}$/,
  message: 'От 8 до 40 символов, хотя бы одна заглавная буква и цифра',
};

const rules: Record<string, Rule> = {
  first_name: NAME_RULE,
  second_name: NAME_RULE,
  login: {
    regex: /^(?!\d+$)[A-Za-z0-9_-]{3,20}$/,
    message: 'От 3 до 20 символов, латиница, допускаются цифры, _ и -, не только цифры',
  },
  email: {
    regex: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}$/,
    message: 'Неверный формат email',
  },
  password: PASSWORD_RULE,
  oldPassword: PASSWORD_RULE,
  newPassword: PASSWORD_RULE,
  newPasswordRepeat: PASSWORD_RULE,
  phone: {
    regex: /^\+?\d{10,15}$/,
    message: 'От 10 до 15 цифр, допускается начальный +',
  },
  message: {
    regex: /^(?!\s*$).+/,
    message: 'Сообщение не должно быть пустым',
  },
};

export function validateField(name: string, value: unknown): ValidationResult {
  const rule = rules[name];
  if (!rule || !value) return null;
  const normalized = typeof value === 'string' ? value : String(value ?? '');
  return rule.regex.test(normalized) ? null : rule.message;
}

export function validateForm(values: Record<string, FormDataEntryValue>): Record<string, string> {
  const errors: Record<string, string> = {};
  Object.entries(values).forEach(([name, value]) => {
    const error = validateField(name, value as string);
    if (error) {
      errors[name] = error;
    }
  });
  return errors;
}
