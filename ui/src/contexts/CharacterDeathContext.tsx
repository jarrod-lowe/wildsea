import React, { createContext, useContext, useState, ReactNode } from 'react';

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

  return (
    <CharacterDeathContext.Provider value={{ isCharacterDead, setCharacterDead }}>
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
