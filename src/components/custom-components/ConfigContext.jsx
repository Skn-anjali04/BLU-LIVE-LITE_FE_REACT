import React, { createContext, useContext, useEffect, useState } from "react";

// Create a context
const ConfigContext = createContext();

// Provider component
export const ConfigProvider = ({ children }) => {
  const [mainConfig, setMainConfig] = useState(null);
  const [backupConfig, setBackupConfig] = useState(null);

  // Load initial data from sessionStorage
  useEffect(() => {
    const mainConfigData = sessionStorage.getItem("mainServicesConfig");
    const backupConfigData = sessionStorage.getItem("backupServicesConfig");

    if (mainConfigData) {
      setMainConfig(JSON.parse(mainConfigData));
    }
    if (backupConfigData) {
      setBackupConfig(JSON.parse(backupConfigData));
    }
  }, []);

  // Function to set main config
  const setMainConfigSync = (config) => {
    setMainConfig(config);
    sessionStorage.setItem("mainServicesConfig", JSON.stringify(config));
  };

  // Function to set backup config
  const setBackupConfigSync = (config) => {
    setBackupConfig(config);
    sessionStorage.setItem("backupServicesConfig", JSON.stringify(config));
  };

  // NEW: Function to remove main config
  const removeMainConfig = () => {
    setMainConfig(null);
    sessionStorage.removeItem("mainServicesConfig");
  };

  // NEW: Function to remove backup config
  const removeBackupConfig = () => {
    setBackupConfig(null);
    sessionStorage.removeItem("backupServicesConfig");
  };

  // NEW: Function to clear all configs
  const clearAllConfigs = () => {
    setMainConfig(null);
    setBackupConfig(null);
    sessionStorage.removeItem("mainServicesConfig");
    sessionStorage.removeItem("backupServicesConfig");
  };

  // Function to get main config
  const getMainConfig = () => {
    return mainConfig;
  };

  // Function to get backup config
  const getBackupConfig = () => {
    return backupConfig;
  };
  return (
    <ConfigContext.Provider
      value={{
        setMainConfigSync,
        setBackupConfigSync,
        getMainConfig,
        getBackupConfig,
        removeMainConfig,
        removeBackupConfig,
        clearAllConfigs,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

// Custom hook to use the ConfigContext
export const useConfig = () => {
  return useContext(ConfigContext);
};
export default ConfigContext;
