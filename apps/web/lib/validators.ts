export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

export const isValidPhone = (value: string) => /^\+?[0-9]{10,14}$/.test(value.replace(/[\s-]/g, ""));

export const MIN_PASSWORD_LENGTH = 8;
