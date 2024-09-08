// Mock fetch globally
global.fetch = jest.fn(() => Promise.resolve({
  json: () => Promise.resolve({})
})) as jest.Mock;

import '@testing-library/jest-dom';
import { mergeConfig, getPageURL, getGameId } from '../src/main';


// Mock the modules
jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
  },
}));

jest.mock('@aws-amplify/auth', () => ({
  signInWithRedirect: jest.fn(),
  signOut: jest.fn(),
}));

// Mock the Game and GamesMenu components
jest.mock('../src/game', () => ({
  __esModule: true,
  default: ({ id }: { id: string }) => <div>Game Component {id}</div>,
}));

jest.mock('../src/gamesMenu', () => ({
  __esModule: true,
  default: () => <div>Games Menu Component</div>,
}));

// Mock the amplifySetup function
jest.mock('../src/main', () => {
  const originalModule = jest.requireActual('../src/main');
  return {
    ...originalModule,
    amplifySetup: jest.fn().mockResolvedValue(undefined),
  };
});

describe('main.tsx', () => {
  beforeEach(() => {
      // Create a root element for each test
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    jest.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000',
        origin: 'http://localhost:3000',
        pathname: '/',
        search: '',
      },
      writable: true,
    });
  });

  test('mergeConfig updates amplifyconfig correctly', async () => {
    const configUpdates = {
      identity_pool: 'test_identity_pool',
      loginDomain: 'test_login_domain',
      region: 'test_region',
      graphql: 'test_graphql',
      web_client: 'test_web_client',
      user_pool: 'test_user_pool',
    };
    const pageUrl = 'http://test.com';

    const result = await mergeConfig(configUpdates, pageUrl);

    expect(result.oauth.redirectSignIn).toBe(pageUrl);
    expect(result.oauth.redirectSignOut).toBe(pageUrl);
    expect(result.aws_cognito_identity_pool_id).toBe('test_identity_pool');
    expect(result.aws_user_pools_id).toBe('test_user_pool');
    expect(result.aws_user_pools_web_client_id).toBe('test_web_client');
    expect(result.aws_appsync_graphqlEndpoint).toBe('test_graphql');
    expect(result.aws_project_region).toBe('test_region');
    expect(result.aws_appsync_region).toBe('test_region');
    expect(result.aws_cognito_region).toBe('test_region');
    expect(result.oauth.domain).toBe('test_login_domain');
  });

  test('getPageURL returns correct URL', () => {
    expect(getPageURL()).toBe('http://localhost:3000/');
  });

  test('getGameId returns correct gameId from URL', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?gameId=123',
      },
      writable: true,
    });
    expect(getGameId()).toBe('123');
  });
});
