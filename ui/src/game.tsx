import React, { useState, useEffect, useRef } from 'react';
import { generateClient } from "aws-amplify/api";
import { Game, PlayerSheetSummary, Subscription as GQLSubscription } from "../../appsync/graphql";
import { getGameQuery, updatedPlayerSheetSubscription } from "../../appsync/schema";
import { IntlProvider, FormattedMessage, useIntl } from 'react-intl';
import { GraphQLResult, GraphQLSubscription } from "@aws-amplify/api-graphql";
import { messages } from './translations';
import { TopBar } from "./frame";
import { fetchUserAttributes } from 'aws-amplify/auth';
import { PlayerSheetTab } from './playerSheetTab';
import { useToast } from './notificationToast';

// Main Game component
const GameContent: React.FC<{ id: string, userEmail: string }> = ({ id, userEmail }) => {
  const [game, setGame] = useState<Game | null>(null);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [userSubject, setUserSubject] = useState<string>("");
  const [fetchFailed, setFetchFailed] = useState<boolean>(false);
  const subscriptionFailed = useRef<boolean>(false);
  const intl = useIntl();
  const toast = useToast();

  useEffect(() => {
    async function fetchGame() {
      try {
        const sub = await fetchUserSubject();
        const client = generateClient();
        const response = await client.graphql({
          query: getGameQuery,
          variables: { id }
        }) as GraphQLResult<{ getGame: Game }>;

        setGame(response.data.getGame);
        setUserSubject(sub);
        if (response.data.getGame.playerSheets.length > 0) {
          setActiveSheet(response.data.getGame.playerSheets[0].userId);
        }
      } catch (err) {
        console.error("Error fetching game data", err);
        toast.addToast(intl.formatMessage({ id: 'errorFetchingGameData' }), 'error');
        setFetchFailed(true);
      }
    }

    if (!fetchFailed) {
      fetchGame();
    }

    if (!subscriptionFailed.current) {
      subscribeToPlayerSheetUpdates(id, (updatedSheetSummary) => {
        if (game) {
          const updatedSheets = game.playerSheets.map(sheet => {
          if (sheet.userId === updatedSheetSummary.userId) {
            // Merge the summary data (e.g., characterName) into the full PlayerSheet object
            return {
              ...sheet,
              characterName: updatedSheetSummary.characterName,
            };
          }
          return sheet;
        });
        setGame({ ...game, playerSheets: updatedSheets })
        }
      }, (err) => {
        console.error("Error subscribing to player sheet updates", err);
        toast.addToast(intl.formatMessage({ id: 'errorSubscribingToPlayerSheetUpdates' }), 'error');
        subscriptionFailed.current = true;
      });
    }
  }, [id, intl, toast, fetchFailed]);

  if (!game) {
    return <div><FormattedMessage id="loadingGameData" /></div>;
  }

  return (
    <div className="game-container">
      <TopBar title={game.gameName} userEmail={ userEmail } />
      <div className="tab-bar">
        {game.playerSheets.map((sheet) => (
          <button
            key={sheet.userId}
            className={activeSheet === sheet.userId ? 'active' : ''}
            onClick={() => setActiveSheet(sheet.userId)}
          >
            {sheet.characterName}
          </button>
        ))}
      </div>
      {activeSheet && (
        <PlayerSheetTab
          game={game}
          sheet={game.playerSheets.find(s => s.userId === activeSheet)!}
          userSubject={userSubject}
          onUpdate={(updatedSheet) => {
            const updatedSheets = game.playerSheets.map(s =>
              s.userId === updatedSheet.userId ? updatedSheet : s
            );
            setGame({ ...game, playerSheets: updatedSheets });
          }}
        />
      )}
    </div>
  );
};

const AppGame: React.FC<{ id: string, userEmail: string }> = (props) => (
  <IntlProvider messages={messages['en']} locale="en" defaultLocale="en">
    <GameContent {...props} />
  </IntlProvider>
);

async function fetchUserSubject(): Promise<string> {
  const userAttributes = await fetchUserAttributes();
  if (userAttributes.sub === undefined) {
    throw new Error("User subject not found");
  }
  return userAttributes.sub;
}


async function subscribeToPlayerSheetUpdates(
  gameId: string, 
  onUpdate: (updatedSheet: PlayerSheetSummary) => void, 
  onError: (error: any) => void
) {
  try {
    const client = generateClient();
    /* const subscription = */ client.graphql<GraphQLSubscription<GQLSubscription>>({
      query: updatedPlayerSheetSubscription,
      variables: { gameId },
    })
    .subscribe({
      next: ({ data }) => {
        if (data?.updatedPlayerSheet) {
          onUpdate(data.updatedPlayerSheet);
        }
      },
      error: (error) => {
        console.error('Subscription error:', error);
        onError(error);
      },
    });
  } catch (error) {
    console.error('Error subscribing to player sheet updates:', error);
    onError(error);
  }

  //return await subscription.unsubscribe;
}

export default AppGame;
