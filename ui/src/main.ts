// npm install aws-amplify
import { Amplify } from "aws-amplify";
import { signInWithRedirect, signOut } from "@aws-amplify/auth";
import amplifyconfig from "./amplifyconfiguration.json";

function handleSignOutClick() {
    signOut();
}

function handleSignInClick() {
    signInWithRedirect({});
}

function getPageURL() {
    const url = new URL(window.location.href);
    return url.origin + url.pathname;
}

/**
 * Merges configuration updates from a provided JSON object into the existing
 * Amplify configuration object. This function primarily updates the OAuth
 * redirect URLs, Cognito identity pool, user pools, AppSync, and regional 
 * settings within the Amplify configuration.
 *
 * @param {AmplifyConfigJSON} configUpdates - The configuration updates retrieved from the config.json file.
 * @param {string} pageUrl - The URL to be used for OAuth redirect sign-in and sign-out.
 * @returns {AmplifyConfig} The updated Amplify configuration object.
 */
export async function mergeConfig(configUpdates: AmplifyConfigJSON, pageUrl: string) {
    amplifyconfig.oauth.redirectSignIn = pageUrl;
    amplifyconfig.oauth.redirectSignOut = pageUrl;
    amplifyconfig.aws_cognito_identity_pool_id = configUpdates.identity_pool;
    amplifyconfig.aws_user_pools_id = configUpdates.user_pool;
    amplifyconfig.aws_user_pools_web_client_id = configUpdates.web_client;
    amplifyconfig.aws_appsync_graphqlEndpoint = configUpdates.graphql;
    amplifyconfig.aws_project_region = configUpdates.region;
    amplifyconfig.aws_appsync_region = configUpdates.region;
    amplifyconfig.aws_cognito_region = configUpdates.region;
    amplifyconfig.oauth.domain = configUpdates.loginDomain;
    return amplifyconfig;
}

interface AmplifyConfigJSON {
    identity_pool: string;
    loginDomain: string;
    region: string;
    graphql: string;
    web_client: string;
    user_pool: string;
}

async function amplifySetup() {
    const response = await fetch("/config.json");
    const configUpdates = await response.json();
    const pageUrl = getPageURL();

    const config = await mergeConfig(configUpdates, pageUrl);
    Amplify.configure(config);

    const loginButton = document.getElementById("login-button");
    loginButton?.addEventListener("click", handleSignInClick);
    const logoutButton = document.getElementById("logout-button");
    logoutButton?.addEventListener("click", handleSignOutClick);
}

async function main() {
    await amplifySetup();
}

if (typeof window !== "undefined") {
    main();
}
