const DAY_TO_INDEX = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
};

const normalizeDayToken = (token) => {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const key = trimmed.slice(0, 1).toUpperCase() + trimmed.slice(1, 3).toLowerCase();
  return DAY_TO_INDEX[key] === undefined ? null : key;
};

const parseTimeToMinutes = (time) => {
  if (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [h, m] = time.split(':').map((v) => Number(v));
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
};

const minutesToTime = (minutes) => {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
};

const toISODateLocal = (date = new Date()) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const parseISODateLocal = (dateStr) => {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [y, m, d] = dateStr.split('-').map((v) => Number(v));
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  return dt;
};

const isWeekendDate = (dateStr) => {
  const dt = parseISODateLocal(dateStr);
  if (!dt) return false;
  const day = dt.getDay();
  return day === 0 || day === 6;
};

const isPastDate = (dateStr, now = new Date()) => {
  const dt = parseISODateLocal(dateStr);
  if (!dt) return false;
  const today = parseISODateLocal(toISODateLocal(now));
  return dt.getTime() < today.getTime();
};

const parseDoctorAvailability = (availability) => {
  if (typeof availability !== 'string' || !availability.trim()) return null;

  // Examples:
  // - "Mon-Fri 09:30-17:30"
  // - "Mon, Wed, Fri 09:00-15:00"
  const match = availability.trim().match(/^(.+?)\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
  if (!match) return null;

  const daysPart = match[1];
  const start = parseTimeToMinutes(match[2]);
  const end = parseTimeToMinutes(match[3]);
  if (start === null || end === null || end <= start) return null;

  const allowedDays = new Set();
  const dayTokens = daysPart.split(',').map((t) => t.trim()).filter(Boolean);

  const addRange = (fromKey, toKey) => {
    const from = DAY_TO_INDEX[fromKey];
    const to = DAY_TO_INDEX[toKey];
    if (from === undefined || to === undefined) return;
    for (let i = 0; i < 7; i += 1) {
      const idx = (from + i) % 7;
      allowedDays.add(idx);
      if (idx === to) break;
    }
  };

  for (const token of dayTokens) {
    const range = token.split('-').map((t) => t.trim());
    if (range.length === 2) {
      const fromKey = normalizeDayToken(range[0]);
      const toKey = normalizeDayToken(range[1]);
      if (!fromKey || !toKey) return null;
      addRange(fromKey, toKey);
      continue;
    }

    const dayKey = normalizeDayToken(token);
    if (!dayKey) return null;
    allowedDays.add(DAY_TO_INDEX[dayKey]);
  }

  if (!allowedDays.size) return null;

  return { allowedDays, startMinutes: start, endMinutes: end };
};

const generateSlotsForDate = ({ availability }, dateStr, { intervalMinutes = 30 } = {}) => {
  const date = parseISODateLocal(dateStr);
  if (!date) return [];

  const parsed = parseDoctorAvailability(availability);
  if (!parsed) return [];

  const weekday = date.getDay();
  if (!parsed.allowedDays.has(weekday)) return [];

  const slots = [];
  for (let m = parsed.startMinutes; m + intervalMinutes <= parsed.endMinutes; m += intervalMinutes) {
    slots.push(minutesToTime(m));
  }
  return slots;
};

module.exports = {
  parseDoctorAvailability,
  parseISODateLocal,
  toISODateLocal,
  isWeekendDate,
  isPastDate,
  parseTimeToMinutes,
  generateSlotsForDate
};

