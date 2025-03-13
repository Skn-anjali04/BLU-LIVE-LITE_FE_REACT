import { createContext, useContext, useState, useEffect } from "react";

// Create the context
const InstanceContext = createContext();

// Create a provider component
export function InstanceProvider({ children }) {
  const [instanceName, setInstanceName] = useState(null);
  const [instanceDataText, setInstanceDataText] = useState(null);
  const [isInstanceLoaded, setIsInstanceLoaded] = useState(false);
  const [instanceAllData, setInstanceAllData] = useState(null); // Holds DataOFStatus

  // Initialize from sessionStorage only on mount (e.g., page refresh)
  useEffect(() => {
    const initializeFromSessionStorage = () => {
      const instanceNameData = JSON.parse(sessionStorage.getItem("instanceName"));
      const instanceAllDataFromSession = JSON.parse(sessionStorage.getItem("DataOFStatus"));

      // Set instanceName from sessionStorage if available
      if (instanceNameData) {
        const { mainServiceName, backupServiceName, mainServiceUID } = instanceNameData;
        const name = mainServiceName || backupServiceName;
        setInstanceName(name);

        // If DataOFStatus exists, set instanceAllData and derive instanceDataText
        if (instanceAllDataFromSession) {
          setInstanceAllData(instanceAllDataFromSession);
          const dataText = mainServiceUID === instanceAllDataFromSession.mainServiceUID ? "Primary" : "Backup";
          setInstanceDataText(dataText);
        }
        setIsInstanceLoaded(true);
      } else if (instanceAllDataFromSession) {
        // If only DataOFStatus exists (no instanceName), still set instanceAllData
        setInstanceAllData(instanceAllDataFromSession);
        setIsInstanceLoaded(true);
      }
    };

    initializeFromSessionStorage();
  }, []); // Empty dependency array ensures this runs only on mount (page refresh)

  // Function to update all instance-related data during runtime
  const updateInstanceData = (name, dataText, allData) => {
    setInstanceName(name);
    setInstanceDataText(dataText);
    setInstanceAllData(allData); // Update instanceAllData directly
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
        instanceAllData, // Expose instanceAllData
        setInstanceAllData, // Expose setter for runtime updates
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