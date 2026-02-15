import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';

interface CharacterDeathState {
  [userId: string]: boolean; // userId -> isDead
}

interface CharacterDeathContextType {
  isCharacterDead: (userId: string) => boolean;
  setCharacterDead: (userId: string, isDead: boolean) => void;
}

const CharacterDeathContext = createContext<CharacterDeathContextType | undefined>(undefined);

export const CharacterDeathProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [deathStates, setDeathStates] = useState<CharacterDeathState>({});

  const isCharacterDead = (userId: string): boolean => {
    return deathStates[userId] ?? false;
  };

  const setCharacterDead = (userId: string, isDead: boolean) => {
    setDeathStates(prev => ({
      ...prev,
      [userId]: isDead
    }));
  };

  const value = useMemo(
    () => ({ isCharacterDead, setCharacterDead }),
    [isCharacterDead, setCharacterDead]
  );

  return (
    <CharacterDeathContext.Provider value={value}>
      {children}
    </CharacterDeathContext.Provider>
  );
};

export const useCharacterDeath = () => {
  const context = useContext(CharacterDeathContext);
  if (!context) {
    throw new Error('useCharacterDeath must be used within CharacterDeathProvider');
  }
  return context;
};
