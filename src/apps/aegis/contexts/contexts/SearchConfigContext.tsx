
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { SearchConfig, defaultConfig } from '../core/config';

export type { SearchSource } from '../core/config';

interface SearchConfigState {
  config: SearchConfig;
  setConfig: React.Dispatch<React.SetStateAction<SearchConfig>>;
}

const SearchConfigContext = createContext<SearchConfigState | undefined>(undefined);

export const SearchConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SearchConfig>(defaultConfig);

  const value = { config, setConfig };

  return (
    <SearchConfigContext.Provider value={value}>
      {children}
    </SearchConfigContext.Provider>
  );
};

export const useSearchConfig = (): SearchConfigState => {
  const context = useContext(SearchConfigContext);
  if (context === undefined) {
    throw new Error('useSearchConfig must be used within a SearchConfigProvider');
  }
  return context;
};
