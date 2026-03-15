type FieldKind =
  | "companyOrName"
  | "contactPerson"
  | "phoneMessenger"
  | "budget"
  | "expectedUsers"
  | "deadline"
  | null;

type ValidationResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

function normalizeLabel(label: string) {
  return label
    .toLowerCase()
    .replace(/[:?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isOnlySymbols(value: string) {
  return !/[\p{L}\d]/u.test(value);
}

function isObviouslyPlaceholder(value: string) {
  const normalized = value.toLowerCase().replace(/\s+/g, "");
  if (isOnlySymbols(value)) return true;
  return ["n/a", "na", "none", "null", "test", "qwerty", "asdf"].includes(normalized);
}

function detectFieldKind(label: string): FieldKind {
  const normalized = normalizeLabel(label);

  if (
    normalized.includes("ім'я / назва компанії") ||
    normalized === "назва компанії" ||
    normalized === "ім'я"
  ) {
    return "companyOrName";
  }
  if (normalized.includes("контактна особа")) return "contactPerson";
  if (
    normalized.includes("телефон / месенджер") ||
    normalized.includes("телефон, месенджер") ||
    normalized === "телефон / месенджер"
  ) {
    return "phoneMessenger";
  }
  if (normalized === "бюджет" || normalized.includes("бюджет (usd)")) return "budget";
  if (
    normalized === "очікувана кількість користувачів" ||
    normalized.includes("яка очікувана кількість користувачів")
  ) {
    return "expectedUsers";
  }
  if (
    normalized === "кінцевий дедлайн" ||
    normalized.includes("кінцева дата отримання бажаного продукту")
  ) {
    return "deadline";
  }

  return null;
}

export function validateTextualBusinessRules(params: {
  label: string;
  value: string;
  required: boolean;
  type: "text" | "textarea" | "email";
}): ValidationResult {
  const normalizedValue = normalizeWhitespace(params.value);
  const fieldKind = detectFieldKind(params.label);

  if (params.required && normalizedValue.length === 0) {
    return { ok: false, message: "Заповніть обов'язкові поля" };
  }

  if (!normalizedValue) {
    return { ok: true, value: normalizedValue };
  }

  if (params.type === "textarea" && params.required) {
    if (normalizedValue.length < 2 || isOnlySymbols(normalizedValue)) {
      return { ok: false, message: "Надайте змістовну відповідь у текстовому полі" };
    }
  }

  if (fieldKind === "companyOrName") {
    if (/^\d+$/.test(normalizedValue) || isObviouslyPlaceholder(normalizedValue)) {
      return { ok: false, message: "Вкажіть коректне ім'я або назву компанії" };
    }
  }

  if (fieldKind === "contactPerson") {
    if (/\d/.test(normalizedValue)) {
      return { ok: false, message: "Поле \"Контактна особа\" не повинно містити цифри" };
    }
    if (!/[\p{L}]/u.test(normalizedValue) || isOnlySymbols(normalizedValue)) {
      return { ok: false, message: "Вкажіть коректне ім'я контактної особи" };
    }
  }

  if (fieldKind === "phoneMessenger") {
    if (/^[\p{L}\s]+$/u.test(normalizedValue)) {
      return { ok: false, message: "Вкажіть коректний телефон або месенджер" };
    }
    if (!/^[\p{L}\d\s+()@._-]+$/u.test(normalizedValue)) {
      return { ok: false, message: "Вкажіть коректний телефон або месенджер" };
    }
    if (!/[\d@_]/.test(normalizedValue) || isOnlySymbols(normalizedValue)) {
      return { ok: false, message: "Вкажіть коректний телефон або месенджер" };
    }
  }

  if (fieldKind === "deadline" && isOnlySymbols(normalizedValue)) {
    return { ok: false, message: "Вкажіть коректний дедлайн" };
  }

  return { ok: true, value: normalizedValue };
}

export function validateNumericBusinessRules(params: {
  label: string;
  value: string;
}): ValidationResult {
  const normalizedValue = normalizeWhitespace(params.value);
  if (!normalizedValue) {
    return { ok: true, value: normalizedValue };
  }

  const numeric = Number(normalizedValue);
  if (Number.isNaN(numeric)) {
    return { ok: false, message: "Поле має містити число" };
  }

  const fieldKind = detectFieldKind(params.label);
  if (fieldKind === "budget" && numeric <= 0) {
    return { ok: false, message: "Бюджет має бути більше нуля" };
  }

  if (fieldKind === "expectedUsers") {
    if (!Number.isInteger(numeric) || numeric <= 0) {
      return { ok: false, message: "Очікувана кількість користувачів має бути додатним цілим числом" };
    }
  }

  return { ok: true, value: normalizedValue };
}
