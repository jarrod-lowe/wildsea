import React, { useEffect, useState } from 'react';
import { generateClient } from "aws-amplify/api";
import { Game, SheetSection, PlayerSheet, CreateSectionInput, UpdatePlayerSheetInput } from "../../appsync/graphql";
import { createSectionMutation, updatePlayerSheetMutation, updateSectionMutation } from "../../appsync/schema";
import { FormattedMessage, useIntl } from 'react-intl';
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { FaPlus, FaPencilAlt } from 'react-icons/fa';
import { TypeFirefly } from "../../graphql/lib/constants";
import { Section } from './section';
import { getSectionTypes } from './sectionRegistry';
import { useToast } from './notificationToast';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided } from 'react-beautiful-dnd';

const reorderSections = (sections: SheetSection[], startIndex: number, endIndex: number) => {
  const result = Array.from(sections);
  const [movedSection] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, movedSection);

  // After reordering, update positions based on their new index
  return result.map((section, index) => ({ ...section, position: index }));
};


// PlayerSheetTab component
export const PlayerSheetTab: React.FC<{ sheet: PlayerSheet, userSubject: string, game: Game, onUpdate: (updatedSheet: PlayerSheet) => void }> = ({ sheet, userSubject, game, onUpdate }) => {
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionType, setNewSectionType] = useState('TEXT');
  const [showNewSection, setShowNewSection] = useState(false);
  const sectionTypes = getSectionTypes();
  const intl = useIntl();
  const toast = useToast();

  const handleDragEnd = async (result: any) => {
    if (!result.destination) {
      return;
    }

    // Reorder sections locally
    const reorderedSections = reorderSections(sheet.sections, result.source.index, result.destination.index);
    
    // Update sections in the UI
    onUpdate({ ...sheet, sections: reorderedSections });

    // Send the updated order to GraphQL
    try {
      const client = generateClient();
      
      // Iterate over all reordered sections and update their position in the backend
      const promises = reorderedSections.map((section, index) => {
        return client.graphql({
          query: updateSectionMutation,
          variables: {
            input: {
              sectionId: section.sectionId,
              gameId: sheet.gameId,
              position: index,  // Update each section's position
            },
          },
        });
      });
      
      // Wait for all updates to complete
      await Promise.all(promises);
    } catch (error) {
      console.error('Error updating section order:', error);
      toast.addToast(intl.formatMessage({ id: "playerSheetTab.updateSectionOrderError" }), 'error');
    }
  };

  const handleCreateSection = async () => {
    try {
      const newPosition = sheet.sections.length > 0
        ? Math.max(...sheet.sections.map(section => section.position)) + 1
        : 0;
      const input: CreateSectionInput = {
        gameId: sheet.gameId,
        sectionName: newSectionName,
        sectionType: newSectionType,
        content: JSON.stringify({}),
        position: newPosition,
      }
      const client = generateClient();
      const response = await client.graphql({
        query: createSectionMutation,
        variables: { input },
      }) as GraphQLResult<{ createSection: SheetSection }>;
      onUpdate({
        ...sheet,
        sections: [...sheet.sections, response.data.createSection],
      });
      setShowNewSection(false);
      setNewSectionName('');
    } catch (error) {
      console.error("Error creating section:", error);
      toast.addToast(intl.formatMessage({ id: "playerSheetTab.createSectionError" }), 'error');
    }
  };

  return (
    <div className="player-sheet">
      <SheetHeader sheet={sheet} userSubject={userSubject} game={game} onUpdate={onUpdate} />
      
      {/* Drag and Drop Context for reordering */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="sections">
          {(provided: DroppableProvided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {sheet.sections
                .slice()
                .sort((a, b) => a.position - b.position) // Sort sections by position
                .map((section, index) => (
                  <Draggable key={section.sectionId} draggableId={section.sectionId} index={index}>
                    {(provided: DraggableProvided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <Section
                          key={section.sectionId}
                          section={section}
                          userSubject={userSubject}
                          onUpdate={(updatedSection) => {
                            const updatedSections = sheet.sections.map(s =>
                              s.sectionId === updatedSection.sectionId ? updatedSection : s
                            );
                            onUpdate({ ...sheet, sections: updatedSections });
                          }}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {userSubject === sheet.userId && !showNewSection && (
        <button onClick={() => setShowNewSection(true)}>
          <FaPlus /> <FormattedMessage id="addSection" />
        </button>
      )}

      {userSubject === sheet.userId && showNewSection && (
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

// SheetHeader component with editable character name
const SheetHeader: React.FC<{ sheet: PlayerSheet; userSubject: string; game: Game; onUpdate: (updatedSheet: PlayerSheet) => void }> = ({ sheet, userSubject, game, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [characterName, setCharacterName] = useState(sheet.characterName);
  const intl = useIntl();
  const toast = useToast();

  useEffect(() => {
    setCharacterName(sheet.characterName);
  }, [sheet.characterName]);

  const handleSave = async () => {
    try {
      const input: UpdatePlayerSheetInput = {
        gameId: sheet.gameId,
        userId: sheet.userId,
        characterName: characterName,
      };
      const client = generateClient();
      const response = await client.graphql({
        query: updatePlayerSheetMutation,
        variables: { input },
      }) as GraphQLResult<{ updatePlayerSheet: PlayerSheet }>;
      onUpdate({
        ...sheet,
        characterName: response.data.updatePlayerSheet.characterName,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating character name:", error);
      toast.addToast(intl.formatMessage({ id: "playerSheetTab.updateError" }), 'error');
    }
  };

  const joinUrl = game.joinToken ? getJoinUrl(game.joinToken) : null;
  const owner = sheet.userId === userSubject;

  return (
    <div className="sheet-header">
      {isEditing ? (
        <div className="edit-character-name">
          <input
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder={intl.formatMessage({ id: "characterName" })}
          />
          <button onClick={handleSave}><FormattedMessage id="save" /></button>
          <button onClick={() => setIsEditing(false)}><FormattedMessage id="cancel" /></button>
        </div>
      ) : (
        <div className="view-character-name">
          <h2>{sheet.characterName}
            {owner && (
              <span className="own-ops">
                <FaPencilAlt onClick={() => setIsEditing(true)} />
                <span className="own-sheet"><FormattedMessage id="playerSheetTab.ownSheet" /></span>
              </span>
            )}
          </h2>
        </div>
      )}
      {sheet.type === TypeFirefly && joinUrl && (
        <p>
          <FormattedMessage id="joinToken" />: <a href={joinUrl}>{joinUrl}</a>
        </p>
      )}
    </div>
  );
};

// Helper function to generate the join URL
const getJoinUrl = (joinToken: string): string => {
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set('joinToken', joinToken);
  return currentUrl.toString();
};
