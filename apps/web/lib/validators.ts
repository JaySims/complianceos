export function isRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function isEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isPhone(phone: string): boolean {
  return /^[0-9+\-\s()]{10,20}$/.test(phone);
}

export function minLength(value: string, length: number): boolean {
  return value.trim().length >= length;
}

export function maxLength(value: string, length: number): boolean {
  return value.trim().length <= length;
}

export function isSouthAfricanRegistrationNumber(value: string): boolean {
  return /^[0-9]{4}\/[0-9]{6}\/[0-9]{2}$/.test(value);
}
