import React, { useEffect, useState } from 'react';
import { generateClient } from "aws-amplify/api";
import { Game, SheetSection, PlayerSheet, CreateSectionInput, UpdatePlayerInput, DeleteGameInput, CreateShipInput } from "../../appsync/graphql";
import { createSectionMutation, createShipMutation, deleteGameMutation, deletePlayerMutation, deleteSectionMutation, updatePlayerMutation, updateSectionMutation } from "../../appsync/schema";
import { FormattedMessage, useIntl } from 'react-intl';
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { TypeFirefly, TypeShip } from "../../graphql/lib/constants/entityTypes";
import { Section } from './section';
import { getSectionSeed, getSectionTypes } from './sectionRegistry';
import { useToast } from './notificationToast';
import { DragDropContext, Droppable, Draggable, DroppableProvided, DraggableProvided } from "@hello-pangea/dnd";
import Modal from 'react-modal';
import { DeletePlayerModal } from './deletePlayer';
import { DeleteGameModal } from './deleteGame';
import { SectionAutoPopulate } from './sectionAutoPopulate';

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
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [showCreateShipModal, setShowCreateShipModal] = useState(false);
  const sectionTypes = getSectionTypes();
  const intl = useIntl();
  const toast = useToast();

  // Reset editing state when the active sheet changes
  useEffect(() => {
    setEditingSheetId(null);
    setShowNewSection(false);
  }, [sheet.userId]);

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
        content: JSON.stringify(getSectionSeed(newSectionType, sheet)),
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

  const handleCreateShip = async (shipName: string) => {
    try {
      const input: CreateShipInput = {
        gameId: game.gameId,
        characterName: shipName,
      };
      const client = generateClient();
      await client.graphql({
        query: createShipMutation,
        variables: { input },
      });
    } catch (error) {
      console.error("Error creating ship:", error);
      toast.addToast(intl.formatMessage({ id: "createShipModal.error" }), 'error');
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
  let ownSheet = false;
  if (userSubject === sheet.userId) mayEditSheet = true;
  if (userSubject === sheet.userId) ownSheet = true;
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
      <SheetHeader
        sheet={sheet}
        mayEditSheet={mayEditSheet}
        ownSheet={ownSheet}
        game={game}
        onUpdate={onUpdate}
        isEditing={editingSheetId === sheet.userId}
        setIsEditing={(editing) => setEditingSheetId(editing ? sheet.userId : null)}
      />
      
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

      {mayEditSheet && sheet.sections.length === 0 && (
        <SectionAutoPopulate
          gameType={game.gameType || 'wildsea'}
          gameId={sheet.gameId}
          userId={sheet.userId}
          onSectionsAdded={() => {
            // The sections will be updated automatically via GraphQL subscriptions
            // so we don't need to do anything here
          }}
        />
      )}

      {mayEditSheet && !showNewSection && (
        <>
          <button onClick={() => {
            setShowNewSection(true);
            setEditingSheetId(sheet.userId);
          }} className="btn-standard btn-small">
            <FormattedMessage id="playerSheetTab.addSection" />
          </button>
          <button onClick={() => setShowDeleteSectionModal(true)} className="btn-danger btn-small">
            <FormattedMessage id="playerSheetTab.deleteSection" />
          </button>
        </>
      )}

      {mayEditSheet && showNewSection && editingSheetId === sheet.userId && (
        <div className="new-section">
          <input
            id="new-section-name"
            name="newSectionName"
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
          <button onClick={handleCreateSection} className="btn-standard btn-small">
            <FormattedMessage id="create" />
          </button>
          <button onClick={handleCancelCreateSection} className="btn-secondary btn-small">
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

      {sheet.type === TypeFirefly && (
        <button onClick={() => setShowCreateShipModal(true)} className="btn-standard btn-small">
          <FormattedMessage id="createShipModal.buttonLabel" />
        </button>
      )}

      {(userSubject === sheet.userId || userSubject === sheet.fireflyUserId ) && (sheet.userId != sheet.fireflyUserId) && (
        <button onClick={() => setShowDeleteModal(true)} className="btn-danger btn-small">
          <FormattedMessage id={deleteButtonId} />
        </button>
      )}

      {(userSubject === sheet.fireflyUserId) && (sheet.userId == sheet.fireflyUserId) && (
        <button onClick={() => setShowDeleteGameModal(true)} className="btn-danger btn-small">
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

      <CreateShipModal
        isOpen={showCreateShipModal}
        onRequestClose={() => setShowCreateShipModal(false)}
        onConfirm={handleCreateShip}
      />
    </div>
  );
};

// SheetHeader component with editable character name
const SheetHeader: React.FC<{
    sheet: PlayerSheet;
    mayEditSheet: boolean;
    ownSheet: boolean;
    game: Game;
    onUpdate: (updatedSheet: PlayerSheet) => void;
    isEditing: boolean;
    setIsEditing: (editing: boolean) => void;
  }> = ({ sheet, mayEditSheet, ownSheet, game, onUpdate, isEditing, setIsEditing }) => {
  const [characterName, setCharacterName] = useState(sheet.characterName);
  const intl = useIntl();
  const toast = useToast();

  useEffect(() => {
    setCharacterName(sheet.characterName);
  }, [sheet.characterName]);

  const handleSave = async () => {
    try {
      const input: UpdatePlayerInput = {
        gameId: sheet.gameId,
        userId: sheet.userId,
        characterName: characterName,
      };
      const client = generateClient();
      const response = await client.graphql({
        query: updatePlayerMutation,
        variables: { input },
      }) as GraphQLResult<{ updatePlayer: PlayerSheet }>;
      onUpdate({
        ...sheet,
        characterName: response.data.updatePlayer.characterName,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating character name:", error);
      toast.addToast(intl.formatMessage({ id: "playerSheetTab.updateError" }), 'error');
    }
  };

  const joinUrl = game.joinToken ? getJoinUrl(game.joinToken) : null;

  return (
    <div className="sheet-header">
      {isEditing ? (
        <div className="edit-character-name">
          <input
            id="character-name-edit"
            name="characterName"
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder={intl.formatMessage({ id: "characterName" })}
            aria-label={intl.formatMessage({ id: "characterName" })}
          />
          <button onClick={handleSave} className="btn-standard btn-small"><FormattedMessage id="save" /></button>
          <button onClick={() => setIsEditing(false)} className="btn-secondary btn-small"><FormattedMessage id="cancel" /></button>
        </div>
      ) : (
        <div className="view-character-name">
          <h2>{sheet.characterName}
            {mayEditSheet && (
              <span className="own-ops">
                <button className="btn-standard btn-small edit" onClick={() => setIsEditing(true)}>{intl.formatMessage({ id: 'edit' })}</button>
                {ownSheet && (<span className="own-sheet"><FormattedMessage id="playerSheetTab.ownSheet" /></span>)}
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
              className="btn-icon"
            >
              <FormattedMessage id="sectionObject.removeItem" />
            </button>
          </li>
        ))}
      </ul>
      <button onClick={onRequestClose} className="btn-secondary btn-small">
        <FormattedMessage id="close" />
      </button>
    </Modal>
  );
};

// Add this new component
const CreateShipModal: React.FC<{
  isOpen: boolean;
  onRequestClose: () => void;
  onConfirm: (shipName: string) => void;
}> = ({ isOpen, onRequestClose, onConfirm }) => {
  const [shipName, setShipName] = useState('');
  const intl = useIntl();

  const handleConfirm = () => {
    onConfirm(shipName);
    setShipName('');
    onRequestClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel={intl.formatMessage({ id: "createShipModal.title" })}
      className="create-ship-modal"
      overlayClassName="modal-overlay"
    >
      <h2><FormattedMessage id="createShipModal.title" /></h2>
      <input
        id="ship-name"
        name="shipName"
        type="text"
        value={shipName}
        onChange={(e) => setShipName(e.target.value)}
        placeholder={intl.formatMessage({ id: "createShipModal.namePlaceholder" })}
      />
      <div className="modal-buttons">
        <button onClick={onRequestClose} className="btn-secondary btn-small">
          <FormattedMessage id="cancel" />
        </button>
        <button
          onClick={handleConfirm}
          disabled={!shipName.trim()}
          className="btn-standard btn-small"
        >
          <FormattedMessage id="create" />
        </button>
      </div>
    </Modal>
  );
};
