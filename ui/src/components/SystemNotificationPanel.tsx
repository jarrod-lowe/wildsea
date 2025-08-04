import React, { useState, useEffect } from 'react';
import { generateClient, GraphQLResult } from 'aws-amplify/api';
import { GraphQLSubscription, GraphqlSubscriptionResult } from "@aws-amplify/api-graphql";
import { getSystemNotificationQuery, systemNotificationUpdatedSubscription } from '../../../appsync/schema';
import type { SystemNotification as GQLSystemNotification, Subscription as GQLSubscription } from '../../../appsync/graphql';
import { FormattedMessage, useIntl } from 'react-intl';

const client = generateClient();

export const SystemNotificationPanel: React.FC = () => {
  const intl = useIntl();
  const [notification, setNotification] = useState<GQLSystemNotification | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const response = await client.graphql({
          query: getSystemNotificationQuery
        }) as GraphQLResult<{ getSystemNotification: GQLSystemNotification }>;
        
        const result = response.data?.getSystemNotification;
        if (result && result.message) {
          setNotification(result);
          setDismissed(false);
        }
      } catch (error) {
        console.error('Failed to fetch system notification:', error);
      }
    };

    const subscription = (client.graphql<GraphQLSubscription<GQLSubscription>>({
      query: systemNotificationUpdatedSubscription
    }) as GraphqlSubscriptionResult<GQLSubscription>).subscribe({
      next: ({ data }: { data?: GQLSubscription }) => {
        const result = data?.systemNotificationUpdated;
        if (result) {
          setNotification(result);
          setDismissed(false);
        }
      },
      error: (error: any) => {
        console.error('System notification subscription error:', error);
      }
    });

    fetchNotification();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (!notification || !notification.message || dismissed) {
    return null;
  }

  return (
    <div 
      className={`system-notification ${notification.urgent ? 'system-notification-urgent' : 'system-notification-normal'}`}
      role={notification.urgent ? 'alert' : 'status'}
      aria-live={notification.urgent ? 'assertive' : 'polite'}
      aria-label={intl.formatMessage(
        { id: 'notification.ariaLabel' },
        { priority: intl.formatMessage({ id: notification.urgent ? 'notification.urgent' : 'notification.normal' }) }
      )}
    >
      <div className="system-notification-content">
        <span className="system-notification-message">{notification.message}</span>
        <button 
          className="system-notification-dismiss"
          onClick={handleDismiss}
          aria-label={intl.formatMessage({ id: 'notification.dismiss' })}
        >
          {intl.formatMessage({ id: 'notification.dismissSymbol' })}
        </button>
      </div>
    </div>
  );
};