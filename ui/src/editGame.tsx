import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FormattedMessage, useIntl } from 'react-intl';
import { generateClient } from "aws-amplify/api";
import { Game, UpdateGameInput } from "../../appsync/graphql";
import { updateGameMutation } from "../../appsync/schema";
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { useToast } from './notificationToast';
import { SectionItemDescription } from './components/SectionItem';

interface EditGameModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  game: Game;
  onUpdate: (updatedGame: Game) => void;
}

export const EditGameModal: React.FC<EditGameModalProps> = ({
  isOpen,
  onRequestClose,
  game,
  onUpdate,
}) => {
  const [gameName, setGameName] = useState(game.gameName);
  const [gameDescription, setGameDescription] = useState(game.gameDescription || '');
  const intl = useIntl();
  const toast = useToast();

  // Update state when game prop changes (e.g., when modal reopens with different game)
  useEffect(() => {
    setGameName(game.gameName);
    setGameDescription(game.gameDescription || '');
  }, [game]);

  const handleSave = async () => {
    try {
      const input: UpdateGameInput = {
        gameId: game.gameId,
        name: gameName,
        description: gameDescription,
      };
      const client = generateClient();
      const response = await client.graphql({
        query: updateGameMutation,
        variables: { input },
      }) as GraphQLResult<{ updateGame: Game }>;
      
      onUpdate(response.data!.updateGame);
      onRequestClose();
    } catch (error) {
      console.error("Error updating game:", error);
      toast.addToast(intl.formatMessage({ id: "editGameModal.updateError" }), 'error');
    }
  };



  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel={intl.formatMessage({ id: "editGameModal.title" })}
      className="edit-game-modal"
      overlayClassName="modal-overlay"
    >
      <h2><FormattedMessage id="editGameModal.title" /></h2>
      <input
        id="edit-game-name"
        name="gameName"
        type="text"
        value={gameName}
        onChange={(e) => setGameName(e.target.value)}
        placeholder={intl.formatMessage({ id: "editGameModal.namePlaceholder" })}
        aria-label={intl.formatMessage({ id: "editGameModal.namePlaceholder" })}
      />
      <SectionItemDescription
        value={gameDescription}
        onChange={setGameDescription}
        placeholder={intl.formatMessage({ id: "editGameModal.descriptionPlaceholder" })}
        ariaLabel={intl.formatMessage({ id: "editGameModal.descriptionPlaceholder" })}
      />
      
      <div className="modal-buttons">
        <button onClick={onRequestClose} className="btn-secondary btn-small"><FormattedMessage id="cancel" /></button>
        <button onClick={handleSave} className="btn-standard btn-small"><FormattedMessage id="save" /></button>
      </div>
    </Modal>
  );
};
