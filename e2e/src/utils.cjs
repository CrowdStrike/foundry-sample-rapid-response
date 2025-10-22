'use strict';

const OTPAuth = require('otpauth');
const dotenv = require('@dotenvx/dotenvx');

dotenv.config();

/**
 * Gets the baseUrl to use for the environment and context the tests are running in
 */
const baseURL = process.env.FALCON_BASE_URL ?? 'https://falcon.us-2.crowdstrike.com/';

/**
 * @param {string} role
 */
async function getUserCredentials(role) {
  let email = process.env.FALCON_USERNAME;
  let password = process.env.FALCON_PASSWORD;
  let secret = process.env.FALCON_AUTH_SECRET;

  return { email, password, secret };
}

/**
 * Generates a time-based one-time password
 * @param {string} secret - Secret key for 2FA
 */
function getTotp(secret) {
  const totp = new OTPAuth.TOTP({
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });

  return totp.generate();
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
      await sleep(delay);
    }
  }
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

module.exports = {
  baseURL,
  getUserCredentials,
  getTotp,
  sleep,
  retryWithBackoff,
  formatDuration,
};
