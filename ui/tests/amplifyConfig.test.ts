/**
 * Integration test: Verify Amplify v6 correctly parses the v5-style flat
 * config format used by this app and configures the Auth module.
 *
 * Uses the REAL aws-amplify library — no mocks. Catches regressions when
 * upgrading aws-amplify where a library change breaks the config parsing
 * pipeline (parseAmplifyConfig -> parseAWSExports).
 *
 * The failure mode it prevents: "Auth UserPool not configured" after
 * Amplify.configure() appears to succeed.
 */

import { Amplify } from 'aws-amplify';
import { signInWithRedirect, signOut } from '@aws-amplify/auth';
import baseConfig from '../src/amplifyconfiguration.json';

function makeTestConfig() {
  return {
    ...baseConfig,
    aws_project_region: 'us-east-1',
    aws_cognito_region: 'us-east-1',
    aws_cognito_identity_pool_id: 'us-east-1:00000000-0000-0000-0000-000000000000',
    aws_user_pools_id: 'us-east-1_TestUserPool',
    aws_user_pools_web_client_id: 'test-web-client-id',
    oauth: {
      domain: 'test-auth.test.com',
      scope: ['openid', 'aws.cognito.signin.user.admin'],
      redirectSignIn: 'http://localhost/',
      redirectSignOut: 'http://localhost/',
      responseType: 'code',
    },
  };
}

describe('Amplify configuration integration', () => {
  beforeEach(() => {
    Amplify.configure(makeTestConfig());
  });

  test('Amplify.configure parses v5 flat config into Auth.Cognito structure', () => {
    const resolvedConfig = Amplify.getConfig();

    // These are the exact fields assertTokenProviderConfig checks
    expect(resolvedConfig.Auth?.Cognito?.userPoolId).toBe('us-east-1_TestUserPool');
    expect(resolvedConfig.Auth?.Cognito?.userPoolClientId).toBe('test-web-client-id');

    // These are the fields assertOAuthConfig checks
    expect(resolvedConfig.Auth?.Cognito?.loginWith?.oauth?.domain).toBe('test-auth.test.com');
    expect(resolvedConfig.Auth?.Cognito?.loginWith?.oauth?.redirectSignIn).toEqual(['http://localhost/']);
    expect(resolvedConfig.Auth?.Cognito?.loginWith?.oauth?.redirectSignOut).toEqual(['http://localhost/']);
    expect(resolvedConfig.Auth?.Cognito?.loginWith?.oauth?.responseType).toBe('code');

    // Identity pool should also be parsed
    expect(resolvedConfig.Auth?.Cognito?.identityPoolId).toBe('us-east-1:00000000-0000-0000-0000-000000000000');
  });

  test('signOut does not throw "not configured" after Amplify.configure', async () => {
    try {
      await signOut();
    } catch (e: any) {
      // signOut may fail because there's no actual user session in jsdom,
      // but it should NOT fail with a configuration error.
      const forbiddenNames = ['AuthUserPoolException', 'AuthTokenConfigException'];
      expect(forbiddenNames).not.toContain(e.name);
      expect(e.message).not.toMatch(/not configured/i);
      expect(e.message).not.toMatch(/UserPool not configured/i);
    }
  });

  test('signInWithRedirect does not throw "not configured" after Amplify.configure', async () => {
    try {
      await signInWithRedirect({});
    } catch (e: any) {
      // signInWithRedirect may fail because jsdom can't complete an OAuth redirect,
      // but it should NOT fail with a configuration error.
      const forbiddenNames = [
        'AuthUserPoolException',
        'AuthTokenConfigException',
        'OAuthNotConfigureException',
      ];
      expect(forbiddenNames).not.toContain(e.name);
      expect(e.message).not.toMatch(/not configured/i);
      expect(e.message).not.toMatch(/UserPool not configured/i);
    }
  });
});
