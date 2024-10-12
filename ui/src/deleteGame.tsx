import React, { useState } from 'react';
import Modal from 'react-modal';
import { FormattedMessage, useIntl } from 'react-intl';

interface DeleteGameModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onConfirm: () => void;
}

export const DeleteGameModal: React.FC<DeleteGameModalProps> = ({
  isOpen,
  onRequestClose,
  onConfirm,
}) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const intl = useIntl();

  const handleConfirm = () => {
    onConfirm();
    onRequestClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel={intl.formatMessage({ id: "deleteGameModal.deleteGame" })}
      className="delete-player-modal"
      overlayClassName="modal-overlay"
    >
      <h2>
        <FormattedMessage id="deleteGameModal.confirmation" />
      </h2>
      <p className="delete-player-warning">
        <FormattedMessage id="deleteGameModal.warning" />
      </p>
      <label className="confirm-checkbox">
        <input
          type="checkbox"
          checked={isConfirmed}
          onChange={(e) => setIsConfirmed(e.target.checked)}
        />
        <FormattedMessage id="deleteGameModal.understand" />
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
          <FormattedMessage id="deleteGameModal.confirm" />
        </button>
      </div>
    </Modal>
  );
};
