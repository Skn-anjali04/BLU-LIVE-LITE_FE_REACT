
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
      const storedInstanceDataText = sessionStorage.getItem("instanceDataText"); // Retrieve instanceDataText

      // Set instanceName from sessionStorage if available
      if (instanceNameData) {
        const { mainServiceName, backupServiceName } = instanceNameData;
        const name = mainServiceName || backupServiceName;
        setInstanceName(name);

        // If DataOFStatus exists, set instanceAllData
        if (instanceAllDataFromSession) {
          setInstanceAllData(instanceAllDataFromSession);
        }

        // Set instanceDataText from stored value or derive it
        if (storedInstanceDataText) {
          setInstanceDataText(storedInstanceDataText); // Use stored value
        } else if (instanceAllDataFromSession) {
          const { mainServiceUID } = instanceNameData;
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
  }, []); // Empty dependency array ensures this runs only on mount

  // Function to update all instance-related data during runtime
  const updateInstanceData = (name, dataText, allData) => {
    setInstanceName(name);
    setInstanceDataText(dataText);
    setInstanceAllData(allData); // Update instanceAllData directly
    setIsInstanceLoaded(true);

    // Store instanceDataText in sessionStorage
    sessionStorage.setItem("instanceDataText", dataText);
    // Optionally, update instanceName and DataOFStatus in sessionStorage
    sessionStorage.setItem("instanceName", JSON.stringify({ mainServiceName: name }));
    // sessionStorage.setItem("DataOFStatus", JSON.stringify(allData));
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