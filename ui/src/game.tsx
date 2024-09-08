import React, { useState, useEffect } from 'react';
import { generateClient } from "aws-amplify/api";
import { Game, SheetSection, PlayerSheet } from "../../appsync/graphql";
import { getGameQuery, updateSectionMutation, createSectionMutation } from "../../appsync/schema";
import { IntlProvider, FormattedMessage, useIntl } from 'react-intl';
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { messages } from './translations';
import { FaPencilAlt, FaPlus } from 'react-icons/fa';
import { TopBar } from "./frame";
import { TypeFirefly } from "../../graphql/lib/constants";

// Section component
const Section: React.FC<{ section: SheetSection, onUpdate: (updatedSection: SheetSection) => void }> = ({ section, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(JSON.parse(section.content));

  const handleUpdate = async () => {
    try {
      const client = generateClient();
      const response = await client.graphql({
        query: updateSectionMutation,
        variables: {
          input: {
            gameId: section.gameId,
            userId: section.userId,
            sectionName: section.sectionName,
            content: JSON.stringify(content)
          }
        }
      }) as GraphQLResult<{ updateSection: SheetSection }>;
      onUpdate(response.data.updateSection);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating section:", error);
    }
  };

  if (isEditing) {
    return (
      <div className="section">
        <h3>{section.sectionName} <FaPencilAlt onClick={() => setIsEditing(false)} /></h3>
        <textarea
          value={content.text}
          onChange={(e) => setContent({ ...content, text: e.target.value })}
        />
        <button onClick={handleUpdate}>
          <FormattedMessage id="save" />
        </button>
      </div>
    );
  }

  return (
    <div className="section">
      <h3>{section.sectionName} <FaPencilAlt onClick={() => setIsEditing(true)} /></h3>
      <p>{content.text}</p>
    </div>
  );
};

// PlayerSheetTab component
const PlayerSheetTab: React.FC<{ sheet: PlayerSheet, game: Game, onUpdate: (updatedSheet: PlayerSheet) => void }> = ({ sheet, game, onUpdate }) => {
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionType, setNewSectionType] = useState('TEXT');
  const [showNewSection, setShowNewSection] = useState(false);
  const intl = useIntl();

  const handleCreateSection = async () => {
    try {
      const client = generateClient();
      const response = await client.graphql({
        query: createSectionMutation,
        variables: {
          input: {
            gameId: sheet.gameId,
            userId: sheet.userId,
            sectionName: newSectionName,
            sectionType: newSectionType,
            content: JSON.stringify({ text: '' })
          }
        }
      }) as GraphQLResult<{ createSection: SheetSection}>;
      onUpdate({
        ...sheet,
        sections: [...sheet.sections, response.data.createSection]
      });
      setShowNewSection(false);
      setNewSectionName('');
    } catch (error) {
      console.error("Error creating section:", error);
    }
  };

  return (
    <div className="player-sheet">
      <SheetHeader sheet={sheet} game={game}/>
      {sheet.sections.map((section) => (
        <Section
          key={section.sectionName}
          section={section}
          onUpdate={(updatedSection) => {
            const updatedSections = sheet.sections.map(s =>
              s.sectionName === updatedSection.sectionName ? updatedSection : s
            );
            onUpdate({ ...sheet, sections: updatedSections });
          }}
        />
      ))}
      <button onClick={() => setShowNewSection(true)}>
        <FaPlus /> <FormattedMessage id="addSection" />
      </button>
      {showNewSection && (
        <div className="new-section">
          <input
            type="text"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            placeholder={intl.formatMessage({ id: "sectionName" })}
          />
          <select value={newSectionType} onChange={(e) => setNewSectionType(e.target.value)}>
            <option value="TEXT">TEXT</option>
            {/* Add other section types here */}
          </select>
          <button onClick={handleCreateSection}>
            <FormattedMessage id="create" />
          </button>
        </div>
      )}
    </div>
  );
};

const SheetHeader: React.FC<{ sheet: PlayerSheet; game: Game }> = ({ sheet, game }) => {
      const joinUrl = game.joinToken ? getJoinUrl(game.joinToken) : null;
    const headerContent = (
        <div className="sheet-header">
            <h2>{sheet.characterName}</h2>
            {sheet.type === TypeFirefly && joinUrl && (
                <p>
                    <FormattedMessage id='joinToken' />: {' '}
                    <a href={joinUrl}> {joinUrl}
                    </a>
                </p>
            )}
        </div>
    );

    return headerContent;
};

// Helper function to generate the join URL
const getJoinUrl = (joinToken: string): string => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('joinToken', joinToken);
    return currentUrl.toString();
};

// Main Game component
const GameContent: React.FC<{ id: string, userEmail: string }> = ({ id, userEmail }) => {
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const intl = useIntl();

  useEffect(() => {
    async function fetchGame() {
      try {
        const client = generateClient();
        const response = await client.graphql({
          query: getGameQuery,
          variables: { id }
        }) as GraphQLResult<{ getGame: Game }>;

        setGame(response.data.getGame);
        if (response.data.getGame.playerSheets.length > 0) {
          setActiveSheet(response.data.getGame.playerSheets[0].userId);
        }
      } catch (err) {
        setError(intl.formatMessage({ id: 'errorFetchingGameData'}));
      }
    }

    fetchGame();
  }, [id, intl]);

  if (error) {
    return <div><FormattedMessage id="error" />: {error}</div>;
  }

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

export default AppGame;
