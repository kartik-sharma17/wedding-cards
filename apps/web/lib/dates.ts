const pad = (n: number) => String(n).padStart(2, "0");

/** Value for <input type="datetime-local"> */
export const toLocalInputValue = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const nowLocalInput = () => toLocalInputValue(new Date());
export const todayLocalDate = () => nowLocalInput().slice(0, 10);

/**
 * The backend stores plain datetimes. We send the wall-clock time at the venue
 * ("2026-12-10T18:30:00") with no timezone conversion, so the card always shows
 * the time the host typed.
 */
export const toNaiveIso = (value: string) => (value.length === 16 ? `${value}:00` : value);
export const dateToNaiveIso = (date: string, time = "00:00") => `${date}T${time}:00`;
