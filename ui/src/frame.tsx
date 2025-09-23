import md5 from 'md5';
import { signInWithRedirect, signOut } from "@aws-amplify/auth";
import React, { useState, useEffect, useRef } from "react";
import { FormattedMessage, useIntl } from 'react-intl';
import Tippy from '@tippyjs/react';
import ReactMarkdown from 'react-markdown';
import { supportedLanguages, type SupportedLanguage } from './translations';
import { PlayerSheet } from '../../appsync/graphql';

function handleSignInClick() {
    signOut(); // sometimes Cognito gets confused; and things you are both logged in, but can't retrieve your email address
    signInWithRedirect({});
}

function handleSignOutClick() {
    signOut();
}

interface TopBarProps {
  title: string;
  userEmail: string | undefined;
  gameDescription: string | null | undefined;
  isGM?: boolean;
  onEditGame?: () => void;
  onShareGame?: () => void;
  currentLanguage?: SupportedLanguage;
  onLanguageChange?: (language: SupportedLanguage) => void;
  activeSheet?: PlayerSheet | null;
  mayEditActiveSheet?: boolean;
  version?: string;
}

// TopBar component
export const TopBar: React.FC<TopBarProps> = ({ title, userEmail, gameDescription, isGM, onEditGame, onShareGame, currentLanguage = 'en', onLanguageChange, activeSheet, mayEditActiveSheet, version }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const intl = useIntl();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const renderTitle = () => (
    <h1>
      {title}
      {gameDescription && (
        <span>
          <Tippy
            content={<ReactMarkdown>{gameDescription}</ReactMarkdown>}
            interactive={true}
            trigger="click"
            arrow={true}
            placement="bottom"
            className="markdown-tippy"
          >
            <button 
              className="btn-icon info"
              aria-label={intl.formatMessage({ id: 'showInfo.gameDescription' })}
            >
              {intl.formatMessage({ id: 'showInfo' })}
            </button>
          </Tippy>
        </span>
      )}
      {isGM && (
        <span className="game-actions">
          <button className="btn-standard btn-small share" onClick={onShareGame}>
            {intl.formatMessage({ id: 'share' })}
          </button>
          {onEditGame && (
            <button className="btn-standard btn-small edit" onClick={onEditGame}>
              {intl.formatMessage({ id: 'edit' })}
            </button>
          )}
        </span>
      )}
    </h1>
  );

  if (userEmail) {
    const gravatarUrl = `https://www.gravatar.com/avatar/${md5(userEmail.toLowerCase().trim())}?d=identicon`;

    return (
      <div className="top-bar">
        {renderTitle()}
        <div className="user-menu" ref={dropdownRef}>
          <button 
            className="user-menu-button"
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="User menu"
          >
            <img src={gravatarUrl} alt="User avatar" />
          </button>
          {showDropdown && (
            <div className="dropdown">
              <div className="user-info">
                <img src={gravatarUrl} alt="User avatar" className="user-avatar-small" />
                <span className="user-email">{userEmail}</span>
              </div>
              <div className="dropdown-separator" />
              {onLanguageChange && (
                <>
                  <div className="language-selector">
                    <label htmlFor="language-select">
                      <FormattedMessage id="language" />:
                    </label>
                    <select
                      id="language-select"
                      value={currentLanguage}
                      onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
                      className="language-select"
                    >
                      {Object.values(supportedLanguages).map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.nativeName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="dropdown-separator" />
                </>
              )}
              {activeSheet && (
                <button
                  onClick={() => {
                    if (!mayEditActiveSheet) return;
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeSheet, null, 2));
                    const defaultFilename = intl.formatMessage({ id: 'playerSheetTab.download.filename' });
                    const filename = `${activeSheet.characterName || defaultFilename}.json`;
                    const dlAnchor = document.createElement('a');
                    dlAnchor.setAttribute("href", dataStr);
                    dlAnchor.setAttribute("download", filename);
                    document.body.appendChild(dlAnchor);
                    dlAnchor.click();
                    document.body.removeChild(dlAnchor);
                  }}
                  className="btn-standard btn-small"
                  style={{ width: '100%', marginBottom: 4, opacity: mayEditActiveSheet ? 1 : 0.5, cursor: mayEditActiveSheet ? 'pointer' : 'not-allowed' }}
                  disabled={!mayEditActiveSheet}
                  title={mayEditActiveSheet ? '' : intl.formatMessage({ id: 'playerSheetTab.download.noPermission' })}
                >
                  <FormattedMessage id="playerSheetTab.download.button" />
                </button>
              )}
              <button onClick={() => { handleSignOutClick(); }} className="btn-standard btn-small">
                <FormattedMessage id="logout" />
              </button>
              {version && (
                <div className="version-info">
                  v{version}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  } else {
    return (
      <div className="top-bar">
        <h1>{title}</h1>
        <div className="user-menu">
            <button onClick={() => { handleSignInClick(); }} className="btn-standard btn-small">
              <FormattedMessage id="login" />
            </button>
        </div>
      </div>
    );
  }
};
