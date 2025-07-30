import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FormattedMessage, useIntl } from 'react-intl';
import { generateClient } from "aws-amplify/api";
import { Game, UpdateJoinCodeInput } from "../../appsync/graphql";
import { updateJoinCodeMutation } from "../../appsync/schema";
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { useToast } from './notificationToast';

interface JoinCodeModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  game: Game;
  onUpdate: (updatedGame: Game) => void;
}

export const JoinCodeModal: React.FC<JoinCodeModalProps> = ({
  isOpen,
  onRequestClose,
  game,
  onUpdate,
}) => {
  const [currentJoinCode, setCurrentJoinCode] = useState(game.joinCode || '');
  const intl = useIntl();
  const toast = useToast();

  // Update state when game prop changes
  useEffect(() => {
    setCurrentJoinCode(game.joinCode || '');
  }, [game]);

  const handleCopyJoinUrl = async () => {
    if (currentJoinCode) {
      try {
        const joinUrl = `${window.location.origin}/join/${currentJoinCode}`;
        await navigator.clipboard.writeText(joinUrl);
        toast.addToast(intl.formatMessage({ id: "joinCodeModal.urlCopied" }), 'success');
      } catch (error) {
        console.error("Error copying join URL:", error);
        toast.addToast(intl.formatMessage({ id: "joinCodeModal.copyError" }), 'error');
      }
    }
  };

  const handleRefreshJoinCode = async () => {
    try {
      const input: UpdateJoinCodeInput = {
        gameId: game.gameId,
      };
      const client = generateClient();
      const response = await client.graphql({
        query: updateJoinCodeMutation,
        variables: { input },
      }) as GraphQLResult<{ updateJoinCode: Game }>;
      
      const updatedGame = response.data!.updateJoinCode;
      setCurrentJoinCode(updatedGame.joinCode || '');
      onUpdate(updatedGame);
      toast.addToast(intl.formatMessage({ id: "joinCodeModal.codeRefreshed" }), 'success');
    } catch (error) {
      console.error("Error refreshing join code:", error);
      toast.addToast(intl.formatMessage({ id: "joinCodeModal.refreshError" }), 'error');
    }
  };

  const joinUrl = currentJoinCode ? `${window.location.origin}/join/${currentJoinCode}` : '';

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel={intl.formatMessage({ id: "joinCodeModal.title" })}
      className="edit-game-modal"
      overlayClassName="modal-overlay"
    >
      <h2><FormattedMessage id="joinCodeModal.title" /></h2>
      <p><FormattedMessage id="joinCodeModal.description" /></p>
      
      <div className="join-url-section">
        <label htmlFor="join-url-display">
          <FormattedMessage id="joinCodeModal.urlLabel" />
        </label>
        <div className="join-url-controls">
          <input
            id="join-url-display"
            type="text"
            value={joinUrl}
            readOnly
            className="join-url-display"
            placeholder={intl.formatMessage({ id: "joinCodeModal.noUrl" })}
          />
          <div className="join-url-buttons">
            <button 
              onClick={handleCopyJoinUrl}
              disabled={!currentJoinCode}
              className="btn-standard btn-small"
            >
              <FormattedMessage id="joinCodeModal.copyUrl" />
            </button>
            <button 
              onClick={handleRefreshJoinCode}
              className="btn-standard btn-small"
            >
              <FormattedMessage id="joinCodeModal.refreshUrl" />
            </button>
            <button onClick={onRequestClose} className="btn-secondary btn-small">
              <FormattedMessage id="close" />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};