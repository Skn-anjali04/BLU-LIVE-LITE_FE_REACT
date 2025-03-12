import { createContext, useContext, useState, useEffect } from "react";

// Create the context
const InstanceContext = createContext();

// Create a provider component
export function InstanceProvider({ children }) {
  const [instanceName, setInstanceName] = useState(null);
  const [instanceDataText, setInstanceDataText] = useState(null);
  const [isInstanceLoaded, setIsInstanceLoaded] = useState(false);

  // Initialize from sessionStorage on mount
  useEffect(() => {
    const initializeInstance = () => {
      const instanceNameData = JSON.parse(sessionStorage.getItem("instanceName"));
      const instanceData = JSON.parse(sessionStorage.getItem("DataOFStatus"));

      if (instanceNameData && instanceData) {
        const { mainServiceName, backupServiceName, mainServiceUID } = instanceNameData;
        const { mainServiceUID: mainServiceUIDText } = instanceData;

        const dataText = mainServiceUID === mainServiceUIDText ? "Primary" : "Backup";
        const name = mainServiceName || backupServiceName;

        setInstanceName(name);
        setInstanceDataText(dataText);
        setIsInstanceLoaded(true);
      } else {
        // Poll sessionStorage if data isn’t available yet
        const interval = setInterval(() => {
          const instanceNameDataPoll = JSON.parse(sessionStorage.getItem("instanceName"));
          const instanceDataPoll = JSON.parse(sessionStorage.getItem("DataOFStatus"));

          if (instanceNameDataPoll && instanceDataPoll) {
            const { mainServiceName, backupServiceName, mainServiceUID } = instanceNameDataPoll;
            const { mainServiceUID: mainServiceUIDText } = instanceDataPoll;

            const dataText = mainServiceUID === mainServiceUIDText ? "Primary" : "Backup";
            const name = mainServiceName || backupServiceName;

            setInstanceName(name);
            setInstanceDataText(dataText);
            setIsInstanceLoaded(true);
            clearInterval(interval);
          }
        }, 1000);

        return () => clearInterval(interval);
      }
    };

    initializeInstance();
  }, []);

  const updateInstanceData = (name, dataText) => {
    setInstanceName(name);
    setInstanceDataText(dataText);
    setIsInstanceLoaded(true);
  };

  return (
    <InstanceContext.Provider
      value={{
        instanceName,
        setInstanceName,
        instanceDataText,
        setInstanceDataText,
        isInstanceLoaded,
        updateInstanceData,
      }}
    >
      {children}
    </InstanceContext.Provider>
  );
}

// Custom hook to use the context
export function useInstance() {
  const context = useContext(InstanceContext);
  if (!context) {
    throw new Error("useInstance must be used within an InstanceProvider");
  }
  return context;
}

export default InstanceContext;
