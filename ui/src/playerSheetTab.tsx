import React, { useState } from 'react';
import { generateClient } from "aws-amplify/api";
import { Game, SheetSection, PlayerSheet, CreateSectionInput } from "../../appsync/graphql";
import { createSectionMutation } from "../../appsync/schema";
import { FormattedMessage, useIntl } from 'react-intl';
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { FaPlus } from 'react-icons/fa';
import { TypeFirefly } from "../../graphql/lib/constants";
import { Section } from './section';
import { getSectionTypes } from './sectionRegistry';

// PlayerSheetTab component
const PlayerSheetTab: React.FC<{ sheet: PlayerSheet, userSubject: string, game: Game, onUpdate: (updatedSheet: PlayerSheet) => void }> = ({ sheet, userSubject, game, onUpdate }) => {
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionType, setNewSectionType] = useState('TEXT');
  const [showNewSection, setShowNewSection] = useState(false);
  const sectionTypes = getSectionTypes();
  const intl = useIntl();

  const handleCreateSection = async () => {
    try {
      const input: CreateSectionInput = {
        gameId: sheet.gameId,
        sectionName: newSectionName,
        sectionType: newSectionType,
        content: JSON.stringify({})
      }
      const client = generateClient();
      const response = await client.graphql({
        query: createSectionMutation,
        variables: {
          input: input,
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
          key={section.sectionId}
          section={section}
          userSubject={userSubject}
          onUpdate={(updatedSection) => {
            const updatedSections = sheet.sections.map(s =>
              s.sectionName === updatedSection.sectionName ? updatedSection : s
            );
            onUpdate({ ...sheet, sections: updatedSections });
          }}
        />
      ))}

      {userSubject == sheet.userId && !showNewSection && (
        <button onClick={() => setShowNewSection(true)}>
          <FaPlus /> <FormattedMessage id="addSection" />
        </button>
      )}

      {userSubject == sheet.userId && showNewSection && (
        <div className="new-section">
          <input
            type="text"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            placeholder={intl.formatMessage({ id: "sectionName" })}
          />
          <select value={newSectionType} onChange={(e) => setNewSectionType(e.target.value)}>
            {sectionTypes.map(({ type, label }) => (
              <option key={type} value={type}>
                {intl.formatMessage({ id: label })}
              </option>
            ))}
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

export default PlayerSheetTab;
