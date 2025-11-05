'use strict';

const { expect } = require('@playwright/test');
const { getTotp, getUserCredentials } = require('./utils.cjs');

/**
 * Utility method using Playwright to execute the API request(s) for "standard" falcon console authentication
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {{ email: string; password: string; secret?: string}} credentials
 */
async function authenticate(request, { email, password, secret }) {
  // get CSRF Token
  const csrfResponse = await request.post('/api2/auth/csrf', {});
  let { csrf_token } = await csrfResponse.json();

  // attempt standard login
  const loginResponse = await request.post('/auth/login', {
    headers: {
      'x-csrf-token': csrf_token,
    },
    data: {
      username: email,
      password,
    },
  });

  await expect(loginResponse).toBeOK();

  const loginResult = await loginResponse.json();
  const totpStep = loginResult.steps?.find(({ type }) => type === 'urn:cs:sf:otp-device:totp');

  // check if account requires a time-based one time passcode (TOTP) authentication step
  if (totpStep) {
    const { enroll, verify } = totpStep;

    // user account has not completed 2FA enrollment
    if (enroll) {
      throw new Error(
        "You must complete 2FA enrollment for this account and save the account's encrypted `secret` with the account credentials",
      );
    }

    // user account is enrolled in 2FA but has no saved TOTP secret
    else if (!secret) {
      throw new Error(
        "You must save this account's encrypted `secret` with the account credentials",
      );
    }

    // user account is enrolled in 2FA
    else if (verify) {
      // refresh csrf token
      csrf_token = loginResult.csrf_token;

      await expect(async () => {
        // generate passcode using account's secret key
        const passcode = getTotp(secret);

        // verify passcode
        const verifyResponse = await request.post(`/api2/${verify}`, {
          headers: {
            'x-csrf-token': csrf_token,
          },
          data: { passcode },
        });

        await expect(verifyResponse).toBeOK();
      }).toPass();
      // retry passcode generation and verification in the off chance that
      // the otpauth library generates a passcode which immediately expires

      // resubmit login with password omitted
      const twoFactorLoginResponse = await request.post('/auth/login', {
        headers: {
          'x-csrf-token': csrf_token,
        },
        data: { username: email },
      });

      await expect(twoFactorLoginResponse).toBeOK();
    }
  }
}

/**
 * Authenticates a user with the specified role and returns the authenticated request context
 * @param {import('playwright').APIRequestContext} request - Playwright API request
 * @param {string} role - User role to authenticate as
 * @returns A request context authenticated with the specified role
 *
 * @example
 * // Authenticate as an admin user
 * const authenticatedRequest = await getAuthenticatedRequest(request, 'falcon-admin');
 */
async function getAuthenticatedRequest(request, role) {
  const credentials = await getUserCredentials(role);

  await authenticate(request, credentials);

  return request;
}

module.exports = {
  authenticate,
  getAuthenticatedRequest,
};
