export interface CheckoutDraft {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  province: string;
  city: string;
  address: string;
  plate: string;
  unit: string;
  postalCode: string;
}

export type CheckoutField = keyof CheckoutDraft;
export type CheckoutErrors = Partial<Record<CheckoutField, string>>;

export const EMPTY_CHECKOUT_DRAFT: CheckoutDraft = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  province: "",
  city: "",
  address: "",
  plate: "",
  unit: "",
  postalCode: "",
};

const DIGITS: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

export const normalizeDigits = (value: string) =>
  value.replace(/[۰-۹٠-٩]/g, (digit) => DIGITS[digit] ?? digit);

export function normalizePhone(value: string) {
  const normalized = normalizeDigits(value).trim();
  const leadingPlus = normalized.startsWith("+") ? "+" : "";
  return `${leadingPlus}${normalized.replace(/\D/g, "")}`;
}

export function sanitizeCheckoutDraft(value: unknown): CheckoutDraft {
  if (!value || typeof value !== "object") return EMPTY_CHECKOUT_DRAFT;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(EMPTY_CHECKOUT_DRAFT).map((field) => [
      field,
      typeof record[field] === "string"
        ? record[field].slice(0, field === "address" ? 600 : 160)
        : "",
    ]),
  ) as unknown as CheckoutDraft;
}

export function validateCheckoutDraft(draft: CheckoutDraft): CheckoutErrors {
  const errors: CheckoutErrors = {};
  const firstName = draft.firstName.trim();
  const phone = normalizePhone(draft.phone);
  const email = draft.email.trim();
  const province = draft.province.trim();
  const city = draft.city.trim();
  const address = draft.address.trim();
  const postalCode = normalizeDigits(draft.postalCode).trim();

  if (firstName.length < 2) errors.firstName = "نام را کامل وارد کنید.";
  if (!/^\+?\d{8,15}$/.test(phone)) {
    errors.phone = "شماره تماس باید شامل ۸ تا ۱۵ رقم باشد؛ ارقام فارسی و لاتین پذیرفته می‌شوند.";
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "فرمت ایمیل معتبر نیست.";
  }
  if (province.length < 2) errors.province = "نام استان/منطقه را وارد کنید.";
  if (city.length < 2) errors.city = "نام شهر را وارد کنید.";
  if (address.length < 8) errors.address = "آدرس را با جزئیات بیشتری وارد کنید.";
  if (postalCode && !/^[A-Za-z0-9 -]{4,12}$/.test(postalCode)) {
    errors.postalCode = "کدپستی واردشده معتبر نیست؛ ۴ تا ۱۲ نویسه عددی/لاتین وارد کنید.";
  }

  return errors;
}
