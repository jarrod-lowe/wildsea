import React, { useEffect, useState, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Amplify } from "aws-amplify";
import { signInWithRedirect, signOut } from "@aws-amplify/auth";
import amplifyconfig from "./amplifyconfiguration.json";

const GamesMenu = React.lazy(() => import("./gamesMenu"))
const Game = React.lazy(() => import("./game"))

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

interface AmplifyConfigJSON {
    identity_pool: string;
    loginDomain: string;
    region: string;
    graphql: string;
    web_client: string;
    user_pool: string;
}

interface AwsConfig {
    aws_project_region: string;
    aws_appsync_graphqlEndpoint: string;
    aws_appsync_region: string;
    aws_appsync_authenticationType: string;
    aws_cognito_identity_pool_id: string;
    aws_cognito_region: string;
    aws_user_pools_id: string;
    aws_user_pools_web_client_id: string;
    oauth: {
        domain: string;
        scope: string[];
        redirectSignIn: string;
        redirectSignOut: string;
        responseType: string;
    };
    federationTarget: string;
    aws_cognito_username_attributes: string[];
    aws_cognito_social_providers: string[];
    aws_cognito_signup_attributes: string[];
    aws_cognito_mfa_configuration: string;
    aws_cognito_mfa_types: string[];
    aws_cognito_password_protection_settings: {
        passwordPolicyMinLength: number;
        passwordPolicyCharacters: string[];
    };
    aws_cognito_verification_mechanisms: string[];
}

/**
 * Merges configuration updates from a provided JSON object into the existing
 * Amplify configuration object. This function primarily updates the OAuth
 * redirect URLs, Cognito identity pool, user pools, AppSync, and regional 
 * settings within the Amplify configuration.
 */
export async function mergeConfig(configUpdates: AmplifyConfigJSON, pageUrl: string): Promise<AwsConfig> {
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
    const response = await fetch("/config.json");
    const configUpdates = await response.json();
    const pageUrl = getPageURL();

    const config = await mergeConfig(configUpdates, pageUrl);
    Amplify.configure(config);
}

async function main() {
    await amplifySetup();
}

function App() {
    const [gameId, setGameId] = useState<string | null>(null);
    const [isAmplifyConfigured, setIsAmplifyConfigured] = useState(false);

    useEffect(() => {
        async function setup() {
            await amplifySetup();
            setIsAmplifyConfigured(true);
            const id = getGameId();
            setGameId(id);
        }
        setup();
    }, []);

    if (!isAmplifyConfigured) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <button onClick={handleSignInClick} id="login-button">Login</button>
            <button onClick={handleSignOutClick} id="logout-button">Logout</button>
            <Suspense fallback={<div>Loading games menu...</div>}>
                {gameId ? <Game id={gameId} /> : <GamesMenu />}
            </Suspense>
        </div>
    );
}

function getGameId(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('gameId');
}

if (typeof window !== "undefined") {
    const root = createRoot(document.getElementById("root") as HTMLElement);
    root.render(<App />);
}
