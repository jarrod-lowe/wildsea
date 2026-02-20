import React, { useEffect, useState, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Amplify } from "aws-amplify";
import { fetchUserAttributes } from 'aws-amplify/auth';
import amplifyconfig from "./amplifyconfiguration.json";
import { IntlProvider, FormattedMessage, useIntl } from 'react-intl';
import { messages, supportedLanguages, type SupportedLanguage, resolveLanguage } from './translations';
import { TopBar } from "./frame";
import { generateClient, GraphQLResult } from "aws-amplify/api";
import { GraphQLSubscription, GraphqlSubscriptionResult } from "@aws-amplify/api-graphql";
import { joinGameMutation, getUserSettingsQuery, updatedUserSettingsSubscription, updateUserSettingsMutation } from "../../appsync/schema";
import type { PlayerSheetSummary, UserSettings, Subscription as GQLSubscription } from "../../appsync/graphql";
import { ToastProvider, useToast } from "./notificationToast";
import Modal from 'react-modal';
import FooterBar from './footerBar';
import { loadDefaultTheme } from './themeLoader';
import { SystemNotificationPanel } from './components/SystemNotificationPanel';
import { LoadingScreen } from './components/LoadingScreen';
import { initializeRum } from './rumClient';

const GamesMenu = React.lazy(() => import("./gamesMenu"))
const AppGame = React.lazy(() => import("./game"))

export function getPageURL(location: Location = window.location) {
    const url = new URL(location.href);
    return url.origin + url.pathname;
}

interface AmplifyConfigJSON {
    identity_pool: string;
    loginDomain: string;
    region: string;
    graphql: string;
    web_client: string;
    user_pool: string;
    version?: string;
    rum_config?: {
        applicationId: string;
        applicationRegion: string;
        identityPoolId: string;
        guestRoleArn: string;
        endpoint: string;
        telemetries: string[];
        allowCookies: boolean;
        enableXRay: boolean;
        sessionSampleRate: number;
    };
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

export async function loadConfig(): Promise<AmplifyConfigJSON> {
    const response = await fetch("/config.json");
    return await response.json();
}

export async function amplifySetup(configUpdates: AmplifyConfigJSON) {
    const pageUrl = getPageURL();
    const config = await mergeConfig(configUpdates, pageUrl);
    Amplify.configure(config);
}


export function getGameId(location: Location = window.location): string | null {
    const urlParams = new URLSearchParams(location.search);
    return urlParams.get('gameId');
}

export function getJoinCode(): string | null {
    const path = window.location.pathname;
    
    // Check if path starts with '/join/' and has exactly 6 characters after
    if (path.startsWith('/join/') && path.length === 12) {
        const code = path.substring(6); // Extract characters after '/join/'
        
        // Validate that all characters are valid (A-Z, 2-9, no confusing chars)
        const validChars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
        for (const char of code) {
            if (validChars.indexOf(char) === -1) {
                return null;
            }
        }

        return code;
    }
    
    return null;
}

async function joinGame(joinCode: string, language: string) {
    const client = generateClient();
    try {
        const response = await client.graphql({
            query: joinGameMutation,
            variables: {
                input: {
                    joinCode: joinCode,
                    language: language,
                }
            }
        }) as GraphQLResult<{ joinGame: PlayerSheetSummary }>;
        if (response.errors) {
            throw new Error(response.errors[0].message);
        }
        
        // Redirect to the game using the gameId from the response
        const gameId = response.data?.joinGame?.gameId;
        if (gameId) {
            window.location.href = `${window.location.origin}/?gameId=${gameId}`;
        }
    }
    catch(error) {
      const e = error as CustomError;
      if (!(e.errors && e.errors.length > 0 && e.errors[0].errorType === "Conflict")) {
        throw error;
      }
    }
}

interface CustomError extends Error {
    errors?: { errorType: string }[];
}

export function App() {
    return (
        <ToastProvider>
            <AppWithIntl />
        </ToastProvider>
    );
}


function AppWithIntl() {
    const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('auto');

    const handleLanguageChange = (lang: SupportedLanguage) => {
        setCurrentLanguage(lang);
    };

    // Resolve the actual language to use (handling auto-detect)
    const actualLanguage = resolveLanguage(currentLanguage);
    
    // Update HTML lang attribute when language changes
    useEffect(() => {
        document.documentElement.lang = actualLanguage;
    }, [actualLanguage]);
    
    // For non-standard locales like Klingon, use 'en' as the locale but keep our custom messages
    const localeForIntl = actualLanguage === 'tlh' ? 'en' : actualLanguage;

    return (
        <IntlProvider messages={messages[actualLanguage]} locale={localeForIntl} defaultLocale="en">
            <AppContentWrapper onLanguageChange={handleLanguageChange} currentLanguage={currentLanguage} />
        </IntlProvider>
    );
}

function AppContentWrapper({ onLanguageChange, currentLanguage }: { readonly onLanguageChange: (lang: SupportedLanguage) => void; readonly currentLanguage: SupportedLanguage }) {
    const [gameId, setGameId] = useState<string | null>(null);
    const [isAmplifyConfigured, setIsAmplifyConfigured] = useState(false);
    const [userEmail, setUserEmail] = useState<string | undefined | null>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [version, setVersion] = useState<string | undefined>(undefined);
    const toast = useToast();
    const intl = useIntl();

    const updateLanguageFromSettings = (settings: UserSettings | null) => {
        if (settings?.settings) {
            try {
                const parsedSettings = JSON.parse(settings.settings);
                const language = parsedSettings?.language as SupportedLanguage;
                if (language && language in supportedLanguages) {
                    onLanguageChange(language);
                } else {
                    // Default to auto-detect if no valid language is set
                    onLanguageChange('auto');
                }
            } catch (error) {
                console.error('Error parsing user settings:', error);
                onLanguageChange('auto');
            }
        } else {
            // Default to auto-detect if no settings exist
            onLanguageChange('auto');
        }
    };

    const handleLanguageChangeFromUI = async (newLanguage: SupportedLanguage) => {
        try {
            const client = generateClient();
            // Get current settings or create new ones
            const currentSettingsResponse = await client.graphql({
                query: getUserSettingsQuery
            }) as GraphQLResult<{ getUserSettings: UserSettings }>;
            
            let currentSettings = {};
            if (currentSettingsResponse.data?.getUserSettings?.settings) {
                try {
                    currentSettings = JSON.parse(currentSettingsResponse.data.getUserSettings.settings);
                } catch (error) {
                    console.error('Error parsing current settings:', error);
                }
            }
            
            // Update settings with new language
            const updatedSettings = {
                ...currentSettings,
                language: newLanguage
            };
            
            // Save updated settings
            await client.graphql({
                query: updateUserSettingsMutation,
                variables: {
                    input: {
                        settings: JSON.stringify(updatedSettings),
                        language: newLanguage
                    }
                }
            });
            
            // Update UI immediately (subscription will also fire but this gives immediate feedback)
            onLanguageChange(newLanguage);
        } catch (error) {
            console.error('Error updating language settings:', error);
            toast.addToast(intl.formatMessage({ id: 'errorUpdatingLanguage' }), 'error');
        }
    };

    const fetchUserSettings = async (): Promise<UserSettings | null> => {
        try {
            const client = generateClient();
            const response = await client.graphql({
                query: getUserSettingsQuery
            }) as GraphQLResult<{ getUserSettings: UserSettings }>;
            
            if (response.errors) {
                console.error('Error fetching user settings:', response.errors);
                return null;
            }
            
            const settings = response.data?.getUserSettings || null;
            updateLanguageFromSettings(settings);
            return settings;
        } catch (error) {
            console.error('Error fetching user settings:', error);
            return null;
        }
    };

    useEffect(() => {
        async function setup() {
            const config = await loadConfig();
            setVersion(config.version);

            // Run these in parallel
            await Promise.all([
                amplifySetup(config),
                config.rum_config && config.version ? Promise.resolve(initializeRum({
                    ...config.rum_config,
                    applicationVersion: config.version
                })) : Promise.resolve()
            ]);

            setIsAmplifyConfigured(true);
            try {
                const email = await getUserEmail();
                setUserEmail(email);
                
                // Fetch user settings after successful auth and get language
                let userSettings: UserSettings | null = null;
                if (email) {
                    userSettings = await fetchUserSettings();
                }
                
                // Handle join code after language is determined
                const joinCode = getJoinCode();
                if (joinCode) {
                    // Determine the language to use - either from user settings or default to 'en'
                    let languageToUse = 'en';
                    if (userSettings?.settings) {
                        try {
                            const parsedSettings = JSON.parse(userSettings.settings);
                            languageToUse = parsedSettings?.language || 'en';
                        } catch (error) {
                            console.error('Error parsing user settings:', error);
                        }
                    }
                    
                    // If language is 'auto', resolve it to actual language
                    if (languageToUse === 'auto') {
                        languageToUse = resolveLanguage('auto');
                    }
                    
                    try {
                        await joinGame(joinCode, languageToUse);
                    }
                    catch (error) {
                        console.error(error);
                        toast.addToast(intl.formatMessage({ id: 'unableToJoin' }), 'error');
                    }
                }
            } catch (error) {
                console.error(error);
                toast.addToast(intl.formatMessage({ id: "getUserEmailError" }), 'error')
            } finally {
                setIsCheckingAuth(false);
            }
            const id = getGameId();
            setGameId(id);
        }
        setup();
    }, []);

    // Set up subscription for user settings changes
    useEffect(() => {
        if (!userEmail || !isAmplifyConfigured) return;

        const client = generateClient();
        const subscription = (client.graphql<GraphQLSubscription<GQLSubscription>>({
            query: updatedUserSettingsSubscription
        }) as GraphqlSubscriptionResult<GQLSubscription>).subscribe({
            next: ({ data }) => {
                const updatedSettings = data?.updatedUserSettings;
                if (updatedSettings) {
                    updateLanguageFromSettings(updatedSettings);
                }
            },
            error: (error: any) => {
                console.error('User settings subscription error:', error);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [userEmail, isAmplifyConfigured]);

    if (!isAmplifyConfigured || isCheckingAuth ) {
        return <LoadingScreen testId="loading" message={<FormattedMessage id="loading" />} />;
    }

    if (!userEmail) {
        // Load default theme for login screen
        loadDefaultTheme();
        
        return (
            <div>
                <a href="#main-content" className="skip-link">
                    <FormattedMessage id="skipToContent" />
                </a>
                <header>
                    <div className="gameslist">
                        <TopBar
                            title={intl.formatMessage({ id: 'wildsea' })}
                            userEmail={undefined}
                            gameDescription=""
                            isGM={false}
                            currentLanguage={currentLanguage}
                            onLanguageChange={handleLanguageChangeFromUI}
                            version={version}
                        />
                    </div>
                </header>
                <main id="main-content">
                    <div className="gameslist">
                        <div><FormattedMessage id="pleaseLogin" /></div>
                    </div>
                </main>
                <FooterBar />
            </div>
        )
    }

    // Load default theme for non-game screens
    if (!gameId) {
        loadDefaultTheme();
    }

    return (
        <div>
            <a href="#main-content" className="skip-link">
                <FormattedMessage id="skipToContent" />
            </a>
            <SystemNotificationPanel isAuthenticated={!!userEmail} />
            <main id="main-content">
                <Suspense fallback={<LoadingScreen message={<FormattedMessage id="loadingGamesMenu" />} />}>
                    {gameId ?
                        <AppGame
                            id={gameId}
                            userEmail={userEmail}
                            currentLanguage={currentLanguage}
                            onLanguageChange={handleLanguageChangeFromUI}
                            version={version}
                        /> :
                        <GamesMenu
                            userEmail={userEmail}
                            currentLanguage={currentLanguage}
                            onLanguageChange={handleLanguageChangeFromUI}
                            version={version}
                        />
                    }
                </Suspense>
            </main>
            <FooterBar />
        </div>
    );
}

async function getUserEmail(): Promise<string | undefined> {
  try {
    const userAttributes = await fetchUserAttributes();
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
