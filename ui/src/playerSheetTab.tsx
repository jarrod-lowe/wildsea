import React, { useEffect, useState } from 'react';
import { generateClient } from "aws-amplify/api";
import { Game, SheetSection, PlayerSheet, CreateSectionInput, UpdatePlayerSheetInput, DeleteGameInput } from "../../appsync/graphql";
import { createSectionMutation, deleteGameMutation, deletePlayerMutation, deleteSectionMutation, updatePlayerSheetMutation, updateSectionMutation } from "../../appsync/schema";
import { FormattedMessage, useIntl } from 'react-intl';
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { FaPlus, FaPencilAlt, FaTrash } from 'react-icons/fa';
import { TypeFirefly, TypeShip } from "../../graphql/lib/constants";
import { Section } from './section';
import { getSectionSeed, getSectionTypes } from './sectionRegistry';
import { useToast } from './notificationToast';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided } from "@hello-pangea/dnd";
import Modal from 'react-modal';
import { DeletePlayerModal } from './deletePlayer';
import { DeleteGameModal } from './deleteGame';

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
  const [newSectionType, setNewSectionType] = useState('KEYVALUE');
  const [showNewSection, setShowNewSection] = useState(false);
  const [showDeleteSectionModal, setShowDeleteSectionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteGameModal, setShowDeleteGameModal] = useState(false);
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
        userId: sheet.userId,
        gameId: sheet.gameId,
        sectionName: newSectionName,
        sectionType: newSectionType,
        content: JSON.stringify(getSectionSeed(newSectionType)),
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

  const handleCancelCreateSection = async () => {
    setShowNewSection(false);
    setNewSectionName('');
    setNewSectionType('KEYVALUE');
  }

  const handleDeleteSection = async (sectionId: string) => {
    try {
      const client = generateClient();
      await client.graphql({
        query: deleteSectionMutation,
        variables: { input: { sectionId, gameId: sheet.gameId } },
      });
      // Close the modal after successful deletion
      setShowDeleteSectionModal(false);
    } catch (error) {
      console.error("Error deleting section:", error);
      toast.addToast(intl.formatMessage({ id: "playerSheetTab.deleteSectionError" }), 'error');
    }
  };

  const handleDeletePlayer = async () => {
    try {
      const client = generateClient();
      await client.graphql({
        query: deletePlayerMutation,
        variables: { input: { gameId: game.gameId, userId: sheet.userId } },
      });
      // Handle successful deletion (e.g., redirect to games list)
    } catch (error) {
      console.error("Error deleting player:", error);
      toast.addToast(intl.formatMessage({ id: "playerSheetTab.deletePlayerError" }), 'error');
    }
  };

  const handleDeleteGame = async () => {
    try {
      const client = generateClient();
      const input: DeleteGameInput = { gameId: game.gameId };
      await client.graphql({
        query: deleteGameMutation,
        variables: { input },
      });
      toast.addToast(intl.formatMessage({ id: "gameDeleted" }), 'success');
      // Redirect to games list
      const currentUrl = new URL(window.location.href);
      const newUrl = `${window.location.origin}${currentUrl.pathname}`;
      window.location.href = newUrl;
    } catch (error) {
      console.error("Error deleting game:", error);
      toast.addToast(intl.formatMessage({ id: "error" }), 'error');
    }
  };

  let deleteButtonId = "playerSheetTab.quitLabel";
  if (userSubject === sheet.fireflyUserId) deleteButtonId = "playerSheetTab.kickPlayerLabel";
  if (sheet.type === TypeShip) deleteButtonId = "playerSheetTab.kickShipLabel";

  let mayEditSheet = false;
  if (userSubject === sheet.userId) mayEditSheet = true;
  if (sheet.type === TypeShip) mayEditSheet = true;

  const renderSections = (sections: SheetSection[], isDraggable: boolean) => {
    const sortedSections = sections.slice().sort((a, b) => a.position - b.position);

    return sortedSections.map((section, index) => {
      const sectionComponent = (
        <Section
          key={section.sectionId}
          section={section}
          mayEditSheet={mayEditSheet}
          onUpdate={(updatedSection) => {
            const updatedSections = sheet.sections.map(s =>
              s.sectionId === updatedSection.sectionId ? updatedSection : s
            );
            onUpdate({ ...sheet, sections: updatedSections });
          }}
        />
      );

      if (isDraggable) {
        return (
          <Draggable key={section.sectionId} draggableId={section.sectionId} index={index}>
            {(provided: DraggableProvided) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
              >
                {sectionComponent}
              </div>
            )}
          </Draggable>
        );
      }

      return sectionComponent;
    });
  };

  return (
    <div className="player-sheet">
      <SheetHeader sheet={sheet} userSubject={userSubject} game={game} onUpdate={onUpdate} />
      
      {mayEditSheet ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="sections">
            {(provided: DroppableProvided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {renderSections(sheet.sections, true)}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="read-only-sections">
          {renderSections(sheet.sections, false)}
        </div>
      )}

      {mayEditSheet && !showNewSection && (
        <>
          <button onClick={() => setShowNewSection(true)}>
            <FaPlus /> <FormattedMessage id="playerSheetTab.addSection" />
          </button>
          <button onClick={() => setShowDeleteSectionModal(true)}>
            <FaTrash /> <FormattedMessage id="playerSheetTab.deleteSection" />
          </button>
        </>
      )}

      {mayEditSheet && showNewSection && (
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
          <button onClick={handleCancelCreateSection}>
            <FormattedMessage id="cancel" />
          </button>
        </div>
      )}

      <DeleteSectionModal
          isOpen={showDeleteSectionModal}
          onRequestClose={() => setShowDeleteSectionModal(false)}
          sections={sheet.sections}
          onDeleteSection={handleDeleteSection}
      />

      {(userSubject === sheet.userId || userSubject === sheet.fireflyUserId ) && (sheet.userId != sheet.fireflyUserId) && (
        <button onClick={() => setShowDeleteModal(true)} className="delete-player-button">
          <FormattedMessage id={deleteButtonId} />
        </button>
      )}

      {(userSubject === sheet.fireflyUserId) && (sheet.userId == sheet.fireflyUserId) && (
        <button onClick={() => setShowDeleteGameModal(true)} className="delete-game-button">
          <FormattedMessage id="deleteGameModal.deleteGame" />
        </button>
      )}

      <DeletePlayerModal
        isOpen={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeletePlayer}
        isOwnSheet={userSubject === sheet.userId}
        sheetType={sheet.type}
      />

      <DeleteGameModal
        isOpen={showDeleteGameModal}
        onRequestClose={() => setShowDeleteGameModal(false)}
        onConfirm={handleDeleteGame}
      />
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

interface DeleteSectionModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  sections: SheetSection[];
  onDeleteSection: (sectionId: string) => void;
}

export const DeleteSectionModal: React.FC<DeleteSectionModalProps> = ({
  isOpen,
  onRequestClose,
  sections,
  onDeleteSection,
}) => {
  const intl = useIntl();
  const sortedSections = [...sections].sort((a, b) => a.position - b.position);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel={intl.formatMessage({ id: "playerSheetTab.deleteSection" })}
      className="delete-section-modal"
      overlayClassName="modal-overlay"
    >
      <h2><FormattedMessage id="playerSheetTab.deleteSection" /></h2>
      <p className="delete-section-warning"><FormattedMessage id="playerSheetTab.deleteSectionWarning" /></p>
      <ul className="delete-section-list">
        {sortedSections.map((section) => (
          <li key={section.sectionId} className="delete-section-item">
            <span className="delete-section-name">{section.sectionName}</span>
            <button 
              onClick={() => onDeleteSection(section.sectionId)}
              className="delete-section-button"
            >
              <FaTrash />
            </button>
          </li>
        ))}
      </ul>
      <button onClick={onRequestClose} className="delete-modal-close">
        <FormattedMessage id="close" />
      </button>
    </Modal>
  );
};
