const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const lowercase = 'abcdefghijkmnopqrstuvwxyz';
const numbers = '23456789';
const symbols = '!@#$%^&*';

const pick = (chars) => chars[Math.floor(Math.random() * chars.length)];

export const generateStrongPassword = (length = 16) => {
  const required = [pick(uppercase), pick(lowercase), pick(numbers), pick(symbols)];
  const all = `${uppercase}${lowercase}${numbers}${symbols}`;

  while (required.length < length) {
    required.push(pick(all));
  }

  for (let index = required.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [required[index], required[swapIndex]] = [required[swapIndex], required[index]];
  }

  return required.join('');
};
