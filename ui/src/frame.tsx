import md5 from 'md5';
import { signInWithRedirect, signOut } from "@aws-amplify/auth";
import React, { useState } from "react";
import { FormattedMessage } from 'react-intl';

function handleSignInClick() {
    signInWithRedirect({});
}

function handleSignOutClick() {
    signOut();
}

// TopBar component
export const TopBar: React.FC<{ title: string, userEmail: string | undefined }> = ({ title, userEmail }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  if (userEmail) {
    const gravatarUrl = `https://www.gravatar.com/avatar/${md5(userEmail.toLowerCase().trim())}?d=identicon`;

    return (
      <div className="top-bar">
        <h1>{title}</h1>
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
              <button onClick={() => { handleSignOutClick(); }}>
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
          <div className="dropdown">
            <button onClick={() => { handleSignInClick(); }}>
              <FormattedMessage id="login" />
            </button>
          </div>
        </div>
      </div>
    );
  }
};
