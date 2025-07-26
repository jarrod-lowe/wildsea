import md5 from 'md5';
import { signInWithRedirect, signOut } from "@aws-amplify/auth";
import React, { useState } from "react";
import { FormattedMessage, useIntl } from 'react-intl';
import Tippy from '@tippyjs/react';
import ReactMarkdown from 'react-markdown';

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
  isFirefly?: boolean;
  onEditGame?: () => void;
}

// TopBar component
export const TopBar: React.FC<TopBarProps> = ({ title, userEmail, gameDescription, isFirefly, onEditGame }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const intl = useIntl();

  const renderTitle = () => (
    <h1>
      {title}
      {gameDescription && (
        <Tippy
          content={<ReactMarkdown>{gameDescription}</ReactMarkdown>}
          interactive={true}
          trigger="click"
          arrow={true}
          placement="bottom"
          className="markdown-tippy"
        >
          <button className="btn-icon info">
            {intl.formatMessage({ id: 'showInfo' })}
          </button>
        </Tippy>
      )}
      {isFirefly && onEditGame && (
        <button className="btn-standard btn-small edit" onClick={onEditGame}>
{intl.formatMessage({ id: 'edit' })}
        </button>
      )}
    </h1>
  );

  if (userEmail) {
    const gravatarUrl = `https://www.gravatar.com/avatar/${md5(userEmail.toLowerCase().trim())}?d=identicon`;

    return (
      <div className="top-bar">
        {renderTitle()}
        <div className="user-menu">
          <button 
            className="user-menu-button"
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="User menu"
          >
            <img src={gravatarUrl} alt="User avatar" />
          </button>
          {showDropdown && (
            <div className="dropdown">
              <button onClick={() => { handleSignOutClick(); }} className="btn-standard btn-small">
                <FormattedMessage id="logout" />
              </button>
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
