import React, { useEffect, useState, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Amplify } from "aws-amplify";
import { fetchUserAttributes } from 'aws-amplify/auth';
import amplifyconfig from "./amplifyconfiguration.json";
import { IntlProvider, FormattedMessage, useIntl } from 'react-intl';
import { messages } from './translations';
import { TopBar } from "./frame";
import { generateClient, GraphQLResult } from "aws-amplify/api";
import { joinGameMutation } from "../../appsync/schema";
import type { PlayerSheetSummary } from "../../appsync/graphql";
import { ToastProvider, useToast } from "./notificationToast";
import Modal from 'react-modal';
import FooterBar from './footerBar';

const GamesMenu = React.lazy(() => import("./gamesMenu"))
const AppGame = React.lazy(() => import("./game"))

export function getPageURL() {
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

export async function amplifySetup() {
    const response = await fetch("/config.json");
    const configUpdates = await response.json();
    const pageUrl = getPageURL();

    const config = await mergeConfig(configUpdates, pageUrl);
    Amplify.configure(config);
    console.log("Configured", config);
}

export function AppContent() {
    const [gameId, setGameId] = useState<string | null>(null);
    const [isAmplifyConfigured, setIsAmplifyConfigured] = useState(false);
    const [userEmail, setUserEmail] = useState<string | undefined | null>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const toast = useToast();
    const intl = useIntl();

    useEffect(() => {
        async function setup() {
            await amplifySetup();
            setIsAmplifyConfigured(true);
            try {
                const email = await getUserEmail();
                setUserEmail(email);
            } catch (error) {
                console.error(error);
                toast.addToast(intl.formatMessage({ id: "getUserEmailError" }), 'error')
            } finally {
                setIsCheckingAuth(false);
            }
            const id = getGameId();
            setGameId(id);
            const token = getJoinToken();

            if (id && token) {
                try {
                    await joinGame(id, token);
                }
                catch (error) {
                    console.error(error);
                    toast.addToast(intl.formatMessage({ id: 'unableToJoin' }), 'error');
                }
            }
        }
        setup();
    }, []);

    if (!isAmplifyConfigured || isCheckingAuth ) {
        return <div data-testid="loading"><FormattedMessage id="loading" /></div>;
    }

    if (!userEmail) {
        return (
            <div>
                <TopBar title={intl.formatMessage({ id: 'wildsea' })} userEmail={undefined} gameDescription="" isFirefly={false}/>
                <div><FormattedMessage id="pleaseLogin" /></div>
                <FooterBar />
            </div>
        )
    }

    return (
        <div>
            <Suspense fallback={<div><FormattedMessage id="loadingGamesMenu" /></div>}>
                {gameId ? <AppGame id={gameId} userEmail={userEmail}/> : <GamesMenu userEmail={userEmail}/>}
            </Suspense>
            <FooterBar />
        </div>
    );
}

export function getGameId(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('gameId');
}

export function getJoinToken(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('joinToken');
}

async function joinGame(gameId: string, joinToken: string) {
    const client = generateClient();
    try {
        const response = await client.graphql({
            query: joinGameMutation,
            variables: {
                input: {
                    gameId: gameId,
                    joinToken: joinToken,
                }
            }
        }) as GraphQLResult<{ joinGame: PlayerSheetSummary }>;
        if (response.errors) {
            throw new Error(response.errors[0].message);
        }
    }
    catch(error) {
      const e = error as CustomError;
      if (!(e.errors && e.errors.length > 0 && e.errors[0].errorType === "Conflict")) {
        throw error;
      }
    }
    window.location.href = `${window.location.origin}/?gameId=${gameId}`;
}

interface CustomError extends Error {
    errors?: { errorType: string }[];
}

export function App() {
    return (
        <IntlProvider messages={messages['en']} locale="en" defaultLocale="en">
            <ToastProvider>
                <AppContent />
            </ToastProvider>
        </IntlProvider>
    );
}

async function getUserEmail(): Promise<string | undefined> {
  try {
    const userAttributes = await fetchUserAttributes();
    console.log("User", userAttributes);
    return userAttributes.email;
  } catch (error) {
    console.log("No user identified");
    return undefined;
  }
}

if (process.env.NODE_ENV !== "test") {
    Modal.setAppElement('#root');
    const root = createRoot(document.getElementById("root") as HTMLElement);
    root.render(<App />);
}
