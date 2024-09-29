import React, { useState } from 'react';
import Modal from 'react-modal';
import { FormattedMessage, useIntl } from 'react-intl';

interface DeletePlayerModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onConfirm: () => void;
  isOwnSheet: boolean;
}

export const DeletePlayerModal: React.FC<DeletePlayerModalProps> = ({
  isOpen,
  onRequestClose,
  onConfirm,
  isOwnSheet,
}) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const intl = useIntl();

  const handleConfirm = () => {
    onConfirm();
    onRequestClose();
    if (isOwnSheet) {
        const currentUrl = new URL(window.location.href);
        const newUrl = `${window.location.origin}${currentUrl.pathname}`;
        window.location.href = newUrl;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel={intl.formatMessage({ id: isOwnSheet ? "playerSheetTab.quitGame" : "playerSheetTab.kickPlayer" })}
      className="delete-player-modal"
      overlayClassName="modal-overlay"
    >
      <h2>
        <FormattedMessage id={isOwnSheet ? "playerSheetTab.quitGameConfirmation" : "playerSheetTab.kickPlayerConfirmation"} />
      </h2>
      <p className="delete-player-warning">
        <FormattedMessage id="playerSheetTab.deletePlayerWarning" />
      </p>
      <label className="confirm-checkbox">
        <input
          type="checkbox"
          checked={isConfirmed}
          onChange={(e) => setIsConfirmed(e.target.checked)}
        />
        <FormattedMessage id="playerSheetTab.deletePlayerUnderstand" />
      </label>
      <div className="modal-buttons">
        <button onClick={onRequestClose} className="cancel-button">
          <FormattedMessage id="cancel" />
        </button>
        <button
          onClick={handleConfirm}
          disabled={!isConfirmed}
          className="confirm-button"
        >
          <FormattedMessage id={isOwnSheet ? "playerSheetTab.confirmQuit" : "playerSheetTab.confirmKick"} />
        </button>
      </div>
    </Modal>
  );
};
