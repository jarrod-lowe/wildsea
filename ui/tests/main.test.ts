// Import the necessary modules
import { mergeConfig } from '../src/main';

// Mock the amplifyconfig object
jest.mock('aws-amplify', () => ({}));
jest.mock('@aws-amplify/auth', () => ({}));

describe('mergeConfig', () => {
    it('should update amplifyconfig based on configUpdates and pageUrl', async () => {
        const configUpdates = {
            identity_pool: 'NewIdentityPool',
            user_pool: 'NewUserPool',
            web_client: 'NewWebClient',
            graphql: 'NewGraphQLEndpoint',
            region: 'NewRegion',
            loginDomain: 'NewLoginDomain',
        };
        const pageUrl = 'https://newredirect.com';

        const expectedConfig = {
            aws_project_region: 'NewRegion',
            aws_appsync_graphqlEndpoint: 'NewGraphQLEndpoint',
            aws_appsync_region: 'NewRegion',
            aws_appsync_authenticationType: "AMAZON_COGNITO_USER_POOLS",
            aws_cognito_identity_pool_id: 'NewIdentityPool',
            aws_cognito_region: 'NewRegion',
            aws_user_pools_id: 'NewUserPool',
            aws_user_pools_web_client_id: 'NewWebClient',
            oauth: {
                domain: 'NewLoginDomain',
                scope: ["openid"],
                redirectSignIn: 'https://newredirect.com',
                redirectSignOut: 'https://newredirect.com',
                responseType: "code"
            },
            federationTarget: "COGNITO_USER_POOLS",
            aws_cognito_username_attributes: [],
            aws_cognito_social_providers: [],
            aws_cognito_signup_attributes: ["EMAIL"],
            aws_cognito_mfa_configuration: "OFF",
            aws_cognito_mfa_types: ["SMS"],
            aws_cognito_password_protection_settings: {
                passwordPolicyMinLength: 8,
                passwordPolicyCharacters: []
            },
            aws_cognito_verification_mechanisms: ["EMAIL"]
        };

        const result = await mergeConfig(configUpdates, pageUrl);

        expect(result).toEqual(expectedConfig);
    });
});
