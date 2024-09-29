import React, { useState, useEffect, useRef } from 'react';
import { generateClient } from "aws-amplify/api";
import { Game, PlayerSheetSummary, Subscription as GQLSubscription, SheetSection } from "../../appsync/graphql";
import { getGameQuery, updatedPlayerSheetSubscription, updatedSectionSubscription } from "../../appsync/schema";
import { IntlProvider, FormattedMessage, useIntl, IntlShape } from 'react-intl';
import { GraphQLResult, GraphQLSubscription } from "@aws-amplify/api-graphql";
import { messages } from './translations';
import { TopBar } from "./frame";
import { fetchUserAttributes } from 'aws-amplify/auth';
import { PlayerSheetTab } from './playerSheetTab';
import { useToast } from './notificationToast';

const MAX_RETRIES = 5;
const INITIAL_BACKOFF_TIME = 1000; // 1 second
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const NO_GAME = "Game not found";

async function fetchWithBackoff<T>(
    fetchFunction: () => Promise<T>,
    retries: number,
    intl: IntlShape,
    toastFunction: (message: string, type: 'info' | 'error') => void,
  ): Promise<T> {
  try {
    return await fetchFunction();
  } catch (error: any) {
    if (retries >= MAX_RETRIES) {
      throw error;
    }
    if (error.errors?.some((e: any) => e.message.includes(NO_GAME))) {
      throw error; // no point waiting with a no game error
    }
    const backoffTime = INITIAL_BACKOFF_TIME * Math.pow(2, retries);
    console.log(`Attempt ${retries + 1} failed. Retrying in ${backoffTime}ms...`, error);
    toastFunction(intl.formatMessage({ id: "fetchGameToRetry" }), 'error');
    await sleep(backoffTime);
    return fetchWithBackoff(fetchFunction, retries + 1, intl, toastFunction);
  }
}

// Custom hook for subscribing to player sheet updates
const usePlayerSheetUpdates = (
    gameId: string,
    setGame: (game: Game) => void,
    gameRef: React.MutableRefObject<Game | null>,
    userSubject: string,
    setActiveSheet: React.Dispatch<React.SetStateAction<string | null>>,
    isGameFetched: boolean,
  ) => {
  const toast = useToast();
  const intl = useIntl();

  useEffect(() => {
    if (isGameFetched) {
      subscribeToPlayerSheetUpdates(gameId, (updatedSheetSummary) => {
        const currentGame = gameRef.current;
        if (currentGame) {
          if (updatedSheetSummary.deleted) {
            // Player was deleted
            const updatedSheets = currentGame.playerSheets.filter(sheet => sheet.userId !== updatedSheetSummary.userId);
            const updatedGame = { ...currentGame, playerSheets: updatedSheets };
            setGame(updatedGame);
            gameRef.current = updatedGame;

            if (updatedSheetSummary.userId === userSubject) {
              // Current user was deleted, redirect to games list
              const currentUrl = new URL(window.location.href);
              const newUrl = `${window.location.origin}${currentUrl.pathname}`;
              window.location.href = newUrl;
            } else {
              // Another player was deleted, update active sheet if necessary
              setActiveSheet(prevActiveSheet => 
                prevActiveSheet === updatedSheetSummary.userId ? userSubject : prevActiveSheet
              );
            }

            toast.addToast(intl.formatMessage(
              { id: 'playerSheetTab.playerLeft' },
              { name: updatedSheetSummary.characterName }
            ), 'success');
          } else {
            const updatedSheets = currentGame.playerSheets.map(sheet =>
            sheet.userId === updatedSheetSummary.userId
              ? { ...sheet, characterName: updatedSheetSummary.characterName }
              : sheet
          );
          const updatedGame = { ...currentGame, playerSheets: updatedSheets };
          setGame(updatedGame);
          gameRef.current = updatedGame;
        }
        }
      }, (err) => {
        console.error("Error subscribing to player sheet updates", err);
        toast.addToast(intl.formatMessage({ id: 'errorSubscribingToPlayerSheetUpdates' }), 'error');
      });
    }

    // TODO: unsubscribe
  }, [gameId, setGame, gameRef, toast, intl, isGameFetched]);
};

const useSectionUpdates = (
    gameId: string,
    setGame: (game: Game) => void,
    gameRef: React.MutableRefObject<Game | null>,
    isGameFetched: boolean,
  ) => {
  useEffect(() => {
    if (isGameFetched) {
      subscribeToSectionUpdates(gameId, (updatedSection) => {
        const currentGame = gameRef.current;
        if (currentGame) {
          const updatedSheets = currentGame.playerSheets.map(sheet => {
            if (sheet.userId === updatedSection.userId) {
              // Check if section already exists
              const sectionExists = sheet.sections.some(section => section.sectionId === updatedSection.sectionId);

              let updatedSections = [...sheet.sections];

              if (sectionExists) {
                // Update or mark as deleted
                updatedSections = updatedSections.map(section => {
                  if (section.sectionId === updatedSection.sectionId) {
                    return updatedSection.deleted
                      ? { ...updatedSection, deleted: true }
                      : updatedSection;
                  }
                  return section;
                });

                // Remove deleted sections
                updatedSections = updatedSections.filter(section => !section.deleted);
              } else {
                // Add new section
                updatedSections.push(updatedSection);
              }

              // Sort sections by position
              const sortedSections = updatedSections.toSorted((a, b) => a.position - b.position);

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
    }
  }, [gameId, setGame, gameRef, isGameFetched]);
};

// Main Game component
const GameContent: React.FC<{ id: string, userEmail: string }> = ({ id, userEmail }) => {
  const [game, setGame] = useState<Game | null>(null);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [userSubject, setUserSubject] = useState<string>("");
  const [forceBackToList, setForceBackToList] = useState<boolean>(false);
  const [isGameFetched, setIsGameFetched] = useState(false);
  const gameRef = useRef<Game | null>(null);
  const toast = useToast();
  const intl = useIntl();

  useEffect(() => {
    async function fetchGame() {
      try {
        const sub = await fetchUserSubject();
        const client = generateClient();
        const response = await fetchWithBackoff(() =>
          client.graphql({
            query: getGameQuery,
            variables: { id }
          }) as Promise<GraphQLResult<{ getGame: Game }>>,
          0,
          intl,
          (message) => toast.addToast(message, 'error')
        );

        setGame(response.data.getGame);
        gameRef.current = response.data.getGame;
        setUserSubject(sub);
        setIsGameFetched(true);
        setActiveSheet(sub);
      } catch (err: any) {
        if (err.errors?.some((e: any) => e.message.includes(NO_GAME))) {
          toast.addToast(intl.formatMessage({ id: "noGame" }), 'error');
          await sleep(5000);
        } else {
          console.error("Error fetching game data", err);
          toast.addToast(intl.formatMessage({ id: 'errorFetchingGameData' }), 'error');
        }
        setForceBackToList(true);
      }
    }

    fetchGame();
  }, [id]);

  usePlayerSheetUpdates(id, setGame, gameRef, userSubject, setActiveSheet, isGameFetched);
  useSectionUpdates(id, setGame, gameRef, isGameFetched);

  if (forceBackToList) {
    const currentUrl = new URL(window.location.href);
    const newUrl = `${window.location.origin}${currentUrl.pathname}`;
    window.location.href = newUrl;
  }

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
