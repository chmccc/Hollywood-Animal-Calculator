import { createContext, useContext } from 'react';
import { useScriptGenerator } from '../hooks/useScriptGenerator';

const ScriptGeneratorContext = createContext(null);

export function ScriptGeneratorProvider({ children }) {
  const scriptGenerator = useScriptGenerator();
  
  return (
    <ScriptGeneratorContext.Provider value={scriptGenerator}>
      {children}
    </ScriptGeneratorContext.Provider>
  );
}

export function useScriptGeneratorContext() {
  const context = useContext(ScriptGeneratorContext);
  if (!context) {
    throw new Error('useScriptGeneratorContext must be used within a ScriptGeneratorProvider');
  }
  return context;
}
