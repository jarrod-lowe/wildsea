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
 * Fetch the configuration from config.json and update the amplify configuration
 * object with the values from the JSON file.
 *
 * @returns the updated amplify configuration object
 */
async function getConfig() {
    const response = await fetch("/config.json");
    const configUpdates = await response.json();
    const pageUrl = getPageURL();
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

async function amplifySetup() {
    const config = await getConfig();
    Amplify.configure(config);

    const loginButton = document.getElementById("login-button");
    loginButton?.addEventListener("click", handleSignInClick);
    const logoutButton = document.getElementById("logout-button");
    logoutButton?.addEventListener("click", handleSignOutClick);
}

async function main() {
    await amplifySetup();
}

main();
