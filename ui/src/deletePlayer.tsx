import React, { useState } from 'react';
import Modal from 'react-modal';
import { FormattedMessage, useIntl } from 'react-intl';
import { TypeShip } from '../../graphql/lib/constants/entityTypes';

interface DeletePlayerModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  onConfirm: () => void;
  isOwnSheet: boolean;
  sheetType: string;
}

export const DeletePlayerModal: React.FC<DeletePlayerModalProps> = ({
  isOpen,
  onRequestClose,
  onConfirm,
  isOwnSheet,
  sheetType,
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

  let translationInset = "quit";
  if (!isOwnSheet) translationInset = "kickPlayer";
  if (sheetType === TypeShip) translationInset = "kickShip"

  const labelId = `playerSheetTab.${translationInset}Label`;
  const confirmId = `playerSheetTab.${translationInset}Confirmation`;
  const warningId = `playerSheetTab.${translationInset}Warning`;
  const buttonId = `playerSheetTab.${translationInset}Confirm`;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      contentLabel={intl.formatMessage({ id: labelId })}
      className="delete-player-modal"
      overlayClassName="modal-overlay"
    >
      <h2>
        <FormattedMessage id={confirmId} />
      </h2>
      <p className="delete-player-warning">
        <FormattedMessage id={warningId} />
      </p>
      <label className="confirm-checkbox">
        <input
          id="delete-player-confirm"
          name="deleteConfirm"
          type="checkbox"
          checked={isConfirmed}
          onChange={(e) => setIsConfirmed(e.target.checked)}
        />
        <FormattedMessage id="playerSheetTab.deletePlayerUnderstand" />
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
          <FormattedMessage id={buttonId} />
        </button>
      </div>
    </Modal>
  );
};
