const test = require('node:test');
const assert = require('node:assert/strict');
const {
  parseDoctorAvailability,
  generateSlotsForDate,
  isWeekendDate,
  isPastDate
} = require('../utils/appointmentSlots');

test('parseDoctorAvailability supports ranges and lists', () => {
  const range = parseDoctorAvailability('Mon-Fri 09:30-17:30');
  assert.ok(range);
  assert.equal(range.startMinutes, 9 * 60 + 30);
  assert.equal(range.endMinutes, 17 * 60 + 30);
  [1, 2, 3, 4, 5].forEach((d) => assert.equal(range.allowedDays.has(d), true));
  [0, 6].forEach((d) => assert.equal(range.allowedDays.has(d), false));

  const list = parseDoctorAvailability('Mon, Wed, Fri 09:00-15:00');
  assert.ok(list);
  [1, 3, 5].forEach((d) => assert.equal(list.allowedDays.has(d), true));
  [0, 2, 4, 6].forEach((d) => assert.equal(list.allowedDays.has(d), false));
});

test('parseDoctorAvailability supports daily and localized day labels', () => {
  const daily = parseDoctorAvailability('Daily 08:00-20:00');
  assert.ok(daily);
  [0, 1, 2, 3, 4, 5, 6].forEach((d) => assert.equal(daily.allowedDays.has(d), true));

  const uzbekRange = parseDoctorAvailability('Dush-Juma 09:00-12:00');
  assert.ok(uzbekRange);
  [1, 2, 3, 4, 5].forEach((d) => assert.equal(uzbekRange.allowedDays.has(d), true));
  [0, 6].forEach((d) => assert.equal(uzbekRange.allowedDays.has(d), false));
});

test('parseDoctorAvailability supports single-time day entries', () => {
  const single = parseDoctorAvailability('Dush, 09:00');
  assert.ok(single);
  assert.equal(single.allowedDays.has(1), true);
  assert.equal(single.startMinutes, 9 * 60);
  assert.equal(single.endMinutes, 9 * 60 + 30);
});

test('generateSlotsForDate returns half-hour slots in doctor window', () => {
  const doctor = { availability: 'Mon-Fri 09:30-10:30' };
  assert.deepEqual(generateSlotsForDate(doctor, '2026-05-19'), ['09:30', '10:00']);
});

test('generateSlotsForDate falls back to clinic hours when availability is invalid', () => {
  const doctor = { availability: 'qwert' };
  assert.deepEqual(generateSlotsForDate(doctor, '2026-05-19').slice(0, 3), ['09:00', '09:30', '10:00']);
});

test('weekend and past-date helpers behave for ISO dates', () => {
  assert.equal(isWeekendDate('2026-05-23'), true); // Saturday
  assert.equal(isWeekendDate('2026-05-24'), true); // Sunday
  assert.equal(isWeekendDate('2026-05-19'), false); // Tuesday

  const now = new Date('2026-05-19T12:00:00');
  assert.equal(isPastDate('2026-05-18', now), true);
  assert.equal(isPastDate('2026-05-19', now), false);
  assert.equal(isPastDate('2026-05-20', now), false);
});
