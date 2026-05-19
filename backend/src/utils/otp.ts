import crypto from 'crypto';

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generateOtp() {
  return crypto.randomInt(1000, 10000).toString();
}

export function generateJobNumber() {
  let suffix = '';
  for (let i = 0; i < 8; i += 1) {
    suffix += alphabet[crypto.randomInt(0, alphabet.length)];
  }
  return `PS-${suffix}`;
}
