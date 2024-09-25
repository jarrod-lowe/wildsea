import React, { useState, useEffect, useRef } from 'react';
import { generateClient } from "aws-amplify/api";
import { Game, PlayerSheetSummary, Subscription as GQLSubscription, SheetSection } from "../../appsync/graphql";
import { getGameQuery, updatedPlayerSheetSubscription, updatedSectionSubscription } from "../../appsync/schema";
import { IntlProvider, FormattedMessage, useIntl } from 'react-intl';
import { GraphQLResult, GraphQLSubscription } from "@aws-amplify/api-graphql";
import { messages } from './translations';
import { TopBar } from "./frame";
import { fetchUserAttributes } from 'aws-amplify/auth';
import { PlayerSheetTab } from './playerSheetTab';
import { useToast } from './notificationToast';

// Custom hook for subscribing to player sheet updates
const usePlayerSheetUpdates = (gameId: string, setGame: (game: Game) => void, gameRef: React.MutableRefObject<Game | null>) => {
  const toast = useToast();
  const intl = useIntl();

  useEffect(() => {
    subscribeToPlayerSheetUpdates(gameId, (updatedSheetSummary) => {
      const currentGame = gameRef.current;
      if (currentGame) {
        const updatedSheets = currentGame.playerSheets.map(sheet =>
          sheet.userId === updatedSheetSummary.userId
            ? { ...sheet, characterName: updatedSheetSummary.characterName }
            : sheet
        );
        const updatedGame = { ...currentGame, playerSheets: updatedSheets };
        setGame(updatedGame);
        gameRef.current = updatedGame;
      }
    }, (err) => {
      console.error("Error subscribing to player sheet updates", err);
      toast.addToast(intl.formatMessage({ id: 'errorSubscribingToPlayerSheetUpdates' }), 'error');
    });

    // TODO: unsubscribe
  }, [gameId, setGame, gameRef, toast, intl]);
};

const useSectionUpdates = (gameId: string, setGame: (game: Game) => void, gameRef: React.MutableRefObject<Game | null>) => {
  useEffect(() => {
    subscribeToSectionUpdates(gameId, (updatedSection) => {
      const currentGame = gameRef.current;
      if (currentGame) {
        const updatedSheets = currentGame.playerSheets.map(sheet => {
          if (sheet.userId === updatedSection.userId) {
            // Check if section already exists
            const sectionExists = sheet.sections.some(section => section.sectionId === updatedSection.sectionId);

            const updatedSections = sectionExists
              ? sheet.sections.map(section =>
                  section.sectionId === updatedSection.sectionId
                    ? updatedSection
                    : section
                )
              : [...sheet.sections, updatedSection];  // Append new section if it doesn't exist

            // Sort sections by position
            const sortedSections = updatedSections.sort((a, b) => a.position - b.position);

            return { ...sheet, sections: sortedSections };
          }
          return sheet;
        });

        const updatedGame = { ...currentGame, playerSheets: updatedSheets };
        setGame(updatedGame);
        gameRef.current = updatedGame;
      }
    }, (err) => {
      console.error("Error subscribing to section updates", err);
    });
  }, [gameId, setGame, gameRef]);
};

// Main Game component
const GameContent: React.FC<{ id: string, userEmail: string }> = ({ id, userEmail }) => {
  const [game, setGame] = useState<Game | null>(null);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [userSubject, setUserSubject] = useState<string>("");
  const gameRef = useRef<Game | null>(null);
  const toast = useToast();
  const intl = useIntl();

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
        gameRef.current = response.data.getGame;
        setUserSubject(sub);
        setActiveSheet(sub);
      } catch (err) {
        console.error("Error fetching game data", err);
        toast.addToast(intl.formatMessage({ id: 'errorFetchingGameData' }), 'error');
      }
    }

    fetchGame();
  }, [id, intl, toast]);

  usePlayerSheetUpdates(id, setGame, gameRef);
  useSectionUpdates(id, setGame, gameRef);

  if (!game) {
    return <div><FormattedMessage id="loadingGameData" /></div>;
  }

  return (
    <div className="game-container">
      <TopBar title={game.gameName} userEmail={userEmail} />
      <div className="tab-bar">
        {game.playerSheets
          .slice() 
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())  
          .map((sheet) => (
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

async function subscribeToSectionUpdates(
  gameId: string,
  onUpdate: (updatedSection: SheetSection) => void,
  onError: (error: any) => void
): Promise<() => void | null> {
  try {
    const client = generateClient();
    const subscription = client.graphql<GraphQLSubscription<GQLSubscription>>({
      query: updatedSectionSubscription,
      variables: { gameId },
    }).subscribe({
      next: ({ data }) => {
        if (data?.updatedSection) {
          onUpdate(data.updatedSection);
        }
      },
      error: (error) => {
        console.error('Subscription error:', error);
        onError(error);
      },
    });

    // Return the unsubscribe function
    return () => subscription.unsubscribe();
  } catch (error) {
    console.error('Error subscribing to section updates:', error);
    onError(error);
    return () => null;
  }
}

export default AppGame;
