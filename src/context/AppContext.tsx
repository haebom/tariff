import React, { createContext, useState, useContext, ReactNode } from 'react';

interface SharedState {
  selectedTariffKeyword: string | null;
  setSelectedTariffKeyword: (keyword: string | null) => void;
}

const SharedStateContext = createContext<SharedState | undefined>(undefined);

export const SharedStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedTariffKeyword, setSelectedTariffKeyword] = useState<string | null>(null);

  return (
    <SharedStateContext.Provider value={{ selectedTariffKeyword, setSelectedTariffKeyword }}>
      {children}
    </SharedStateContext.Provider>
  );
};

export const useSharedState = (): SharedState => {
  const context = useContext(SharedStateContext);
  if (context === undefined) {
    throw new Error('useSharedState must be used within a SharedStateProvider');
  }
  return context;
}; 