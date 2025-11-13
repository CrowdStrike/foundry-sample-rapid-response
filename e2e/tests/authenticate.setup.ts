import { authenticate } from '../src/authenticate.cjs';
import { baseURL, getUserCredentials } from '../src/utils.cjs';
import { expect, request, test as setup } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

let requestContext: APIRequestContext;
const AuthFile = "playwright/.auth/user.json";

setup('authenticate', async () => {
  requestContext = await request.newContext({baseURL});

  const {email, password, secret} = await getUserCredentials('2fa-user');

  await authenticate(requestContext, {email, password, secret});

  const authVerifyResponse = await requestContext.post('/api2/auth/verify', {
    data: {checks: []},
  });

  expect(authVerifyResponse.ok()).toBe(true);
  await requestContext.storageState({ path: AuthFile });
});
