import { AwsRum, AwsRumConfig } from 'aws-rum-web';

interface RumConfig {
    applicationId: string;
    applicationVersion: string;
    applicationRegion: string;
    identityPoolId: string;
    guestRoleArn: string;
    endpoint: string;
    telemetries: string[];
    allowCookies: boolean;
    enableXRay: boolean;
    sessionSampleRate: number;
}

export function initializeRum(config: RumConfig): void {
    console.log('RUM Config received:', JSON.stringify(config, null, 2));
    console.log('Application Version for RUM:', config.applicationVersion);

    try {
        const rumConfig: AwsRumConfig = {
            sessionSampleRate: config.sessionSampleRate,
            identityPoolId: config.identityPoolId,
            endpoint: config.endpoint,
            telemetries: config.telemetries as any,
            allowCookies: config.allowCookies,
            enableXRay: config.enableXRay,
            signing: true
        };

        console.log('Creating AwsRum with version:', config.applicationVersion);
        const awsRum: AwsRum = new AwsRum(
            config.applicationId,
            config.applicationVersion,
            config.applicationRegion,
            rumConfig
        );

        // Also set version as a session attribute as backup
        awsRum.addSessionAttributes({ applicationVersion: config.applicationVersion });
        console.log('AwsRum initialized successfully with session attribute version:', config.applicationVersion);
    } catch (error) {
        console.error('Failed to initialize CloudWatch RUM:', error);
        // Ignore errors thrown during CloudWatch RUM web client initialization
    }
}