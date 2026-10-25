import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const AIStatusContext = createContext(null);

export function AIStatusProvider({ children }) {
  const [status, setStatus] = useState({
    connected: false,
    version: null,
    base_url: 'http://127.0.0.1:11434',
    configured_model: 'gemma2:2b',
    models_available: [],
    error: null,
    setup_instructions: null,
  });
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getOllamaStatus();
      setStatus(data);
    } catch (err) {
      setStatus({
        connected: false,
        version: null,
        base_url: 'http://127.0.0.1:11434',
        configured_model: 'gemma2:2b',
        models_available: [],
        error: err.message,
        setup_instructions: 'Make sure the LazyFlow backend is running and Ollama is started via `ollama serve`.',
      });
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    checkStatus();
    // Poll every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const changeModel = async (newModel) => {
    try {
      await api.updateSetting('selected_model', newModel);
      await checkStatus();
      return true;
    } catch (err) {
      console.error('Failed to change model:', err);
      return false;
    }
  };

  return (
    <AIStatusContext.Provider
      value={{
        status,
        loading,
        lastChecked,
        refreshStatus: checkStatus,
        changeModel,
      }}
    >
      {children}
    </AIStatusContext.Provider>
  );
}

export function useAIStatus() {
  const context = useContext(AIStatusContext);
  if (!context) {
    throw new Error('useAIStatus must be used within an AIStatusProvider');
  }
  return context;
}
