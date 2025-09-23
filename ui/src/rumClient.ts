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

        const awsRum: AwsRum = new AwsRum(
            config.applicationId,
            config.applicationVersion,
            config.applicationRegion,
            rumConfig
        );
    } catch (error) {
        console.error('Failed to initialize CloudWatch RUM:', error);
        // Ignore errors thrown during CloudWatch RUM web client initialization
    }
}