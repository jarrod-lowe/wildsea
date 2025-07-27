import React, { useState, useEffect } from 'react';
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

  // Reset checkbox when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsConfirmed(false);
    }
  }, [isOpen]);

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
          id="delete-game-confirm"
          name="deleteConfirm"
          type="checkbox"
          checked={isConfirmed}
          onChange={(e) => setIsConfirmed(e.target.checked)}
        />
        <FormattedMessage id="deleteGameModal.understand" />
      </label>
      <div className="modal-buttons">
        <button onClick={onRequestClose} className="btn-secondary btn-small">
          <FormattedMessage id="cancel" />
        </button>
        <button
          onClick={handleConfirm}
          disabled={!isConfirmed}
          className="btn-danger btn-small"
        >
          <FormattedMessage id="deleteGameModal.confirm" />
        </button>
      </div>
    </Modal>
  );
};
