import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CircleChevronRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useApiGetQuery } from "@/utils/helpers/api/apihooks/useApiGetQuery";
import {
  getAllServersPath,
  getUserInstancePath,
} from "@/utils/helpers/api/apiConstant";
import { useNavigate } from "react-router-dom";
import CustomLoader from "@/components/custom-components/custom-loader";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { decryptData } from "@/utils/helpers/auth/encrypt-decrypt";
import { useConfig } from "@/components/custom-components/ConfigContext";
import { useInstance } from "@/components/custom-components/InstanceContext";

function LobbyTable() {
  const {
    setMainConfigSync,
    setBackupConfigSync,
    getMainConfig,
    getBackupConfig,
    removeMainConfig,
    removeBackupConfig,
    clearAllConfigs,
  } = useConfig();
  const { updateInstanceData } = useInstance();
  const [groupedServices, setGroupedServices] = useState({});
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const [instanceData, setInstanceData] = useState(null); // Store instance data for condition check
  const [instanceAllData, setInstanceAllData] = useState(null);
  const myEmail = sessionStorage.getItem("user");
  let userEmail;
  if (myEmail !== null && myEmail != undefined) {
    userEmail = decryptData(myEmail);
  }
  const { toast } = useToast();
  const {
    data: serversStatus,
    error: serversError,
    isLoading: serversIsLoading,
    isError: serversIsError,
  } = useApiGetQuery({
    key: ["fetchForStatus", selectedService],
    endpoint: getAllServersPath,
    params: { address: selectedService },
    options: { retry: false, enabled: Boolean(selectedService) },
  });
  useEffect(() => {
    if (serversIsError && serversError) {
      const errorMessageServic =
        serversError?.response?.data?.message || "Unknown Error";
      const errorMessagedecServic =
        serversError?.response?.data?.error?.message || "Something went wrong";

      setLoading(false);
      toast({
        title: errorMessageServic,
        description: errorMessagedecServic,
        variant: "destructive",
      });
    }
  }, [serversIsError, serversError]); // Removed selectedService to prevent unnecessary re-renders

  const { data, isLoading, isError, error, refetch } = useApiGetQuery({
    key: "usersinstance",
    endpoint: `${getUserInstancePath}`,
    params: { email: userEmail },
    options: {
      retry: false,
      enabled: !!userEmail,
    },
  });

  useEffect(() => {
    if (data && !isError) {
      const serviceAssigned = data?.data?.data?.serviceAssigned || [];
      const groupedData = serviceAssigned.reduce((acc, service) => {
        if (!acc[service.mainServiceName]) {
          acc[service.mainServiceName] = [];
        }
        acc[service.mainServiceName].push(service);
        return acc;
      }, {});
      setGroupedServices(groupedData);
    } else if (isError) {
      toast({
        title: error?.response?.data?.message,
        description: error?.response?.data?.error?.message,
        variant: "destructive",
      });
    }
  }, [data]);

  useEffect(() => {
    if (instanceData && serversStatus?.data?.data && !serversIsLoading) {
      const selectedServiceStatus = serversStatus.data.data.find(
        (status) =>
          status.serviceUID === instanceData.mainServiceUID ||
          status.serviceUID === instanceData.backupServiceUID
      );

      if (
        selectedServiceStatus &&
        selectedServiceStatus.serviceState === "Encoding"
      ) {
        let updatedInstanceData = { ...instanceData };
        // Persist DataOFStatus in sessionStorage for refresh
        sessionStorage.setItem("DataOFStatus", JSON.stringify(instanceAllData));

        // Update context for runtime use
        if (instanceAllData?.backupServiceUID) {
          if (instanceAllData.mainServiceUID === instanceData.mainServiceUID) {
            updateInstanceData(
              instanceData.mainServiceName || instanceData.backupServiceName,
              "Primary",
              instanceAllData
            );
            sessionStorage.setItem(
              "instanceName",
              JSON.stringify(instanceData)
            );
            sessionStorage.setItem(
              "serviceAllData",
              JSON.stringify(instanceAllData)
            );
          } else {
            // Swap logic (Backup was selected)
            updatedInstanceData = {
              atemeServerId: instanceAllData.atemeServerId,
              mainServerAddress: instanceAllData.backupServerAddress,
              mainServerPassword: instanceAllData.backupServerPassword,
              mainServiceName: instanceAllData.backupServiceName,
              mainServiceUID: instanceAllData.backupServiceUID,
              backupServerAddress: instanceAllData.mainServerAddress,
              backupServerPassword: instanceAllData.mainServerPassword,
              backupServiceName: instanceAllData.mainServiceName,
              backupServiceUID: instanceAllData.mainServiceUID,
            };
            updateInstanceData(
              updatedInstanceData.mainServiceName ||
                updatedInstanceData.backupServiceName,
              "Backup",
              updatedInstanceData
            );
            sessionStorage.setItem(
              "instanceName",
              JSON.stringify(updatedInstanceData)
            );
            sessionStorage.setItem(
              "serviceAllData",
              JSON.stringify(updatedInstanceData)
            );
          }
        } else if (
          instanceAllData.mainServiceUID &&
          !instanceAllData?.backupServiceUID
        ) {
          updateInstanceData(
            updatedInstanceData.mainServiceName ||
              updatedInstanceData.backupServiceName,
            "Primary",
            updatedInstanceData
          );
          sessionStorage.setItem(
            "instanceName",
            JSON.stringify(updatedInstanceData)
          );
          sessionStorage.setItem(
            "serviceAllData",
            JSON.stringify(updatedInstanceData)
          );
        }

        navigate("/dashboard");
      } else {
        setPopupMessage(
          `Service ${selectedServiceStatus?.serviceName} is ${selectedServiceStatus?.serviceState}.`
        );
        setShowPopup(true);
      }

      setLoading(false);
      setInstanceData(null);
      setInstanceAllData(null);
      sessionStorage.removeItem("mainTokenData");
      sessionStorage.removeItem("backupTokenData");
      removeMainConfig();
      removeBackupConfig();
    }
  }, [
    serversStatus,
    instanceData,
    instanceAllData,
    serversIsLoading,
    updateInstanceData,
  ]);
  const handleInstancechange = (service, serviceName) => {
    if (loading) return; // Prevent multiple clicks while loading
    setLoading(true); // Set loading state to true

    let serviceCheckeddata;

    if (serviceName === "Primary") {
      serviceCheckeddata = {
        atemeServerId: service.atemeServerId,
        mainServerAddress: service.mainServerAddress,
        mainServerPassword: service.mainServerPassword,
        mainServiceName: service.mainServiceName,
        mainServiceUID: service.mainServiceUID,
      };
    } else if (serviceName === "Backup") {
      serviceCheckeddata = {
        atemeServerId: service.atemeServerId,
        backupServerAddress: service.backupServerAddress,
        backupServerPassword: service.backupServerPassword,
        backupServiceName: service.backupServiceName,
        backupServiceUID: service.backupServiceUID,
      };
    }

    if (serversIsError) {
      setLoading(false);
    }
    if (service) {
      const checkDataIP =
        serviceCheckeddata?.mainServerAddress ||
        serviceCheckeddata?.backupServerAddress;
      setSelectedService(checkDataIP);
      setInstanceData(serviceCheckeddata);
      setInstanceAllData(service);
    }
  };

  const handlePopupClose = () => {
    setShowPopup(false);
  };

  return (
    <div>
      {isLoading ? (
        <CustomLoader />
      ) : (
        <div className="overflow-x-auto">
          <Table className="table-base">
            <TableHeader>
              <TableRow className="table-header">
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Playout</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {Object.entries(groupedServices).length > 0 ? (
                Object.entries(groupedServices).map(([name, services]) => (
                  <React.Fragment key={name}>
                    <TableRow className="bg-gray-700">
                      <TableCell
                        colSpan={4}
                        className="text-left font-bold text-white py-2"
                      >
                        {name.toUpperCase()}
                      </TableCell>
                    </TableRow>

                    {services.map((service) => (
                      <React.Fragment key={service.mainServiceUID}>
                        {/* {console.log(service,"service.........")} */}
                        <TableRow className="table-row">
                          <TableCell className="rounded-l-md">
                            {service.mainServiceName}
                          </TableCell>
                          <TableCell>Primary</TableCell>
                          <TableCell className="rounded-r-md p-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <CircleChevronRight
                                    className={`cursor-pointer ${
                                      loading
                                        ? "opacity-50 pointer-events-none"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      handleInstancechange(service, "Primary")
                                    }
                                    disabled={loading}
                                  />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    `visit Dashboard {service.mainServiceName}`
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>

                        {service.backupServerAddress && (
                          <TableRow className="table-row">
                            <TableCell className="rounded-l-md">
                              {service.backupServiceName}
                            </TableCell>
                            <TableCell>Backup</TableCell>
                            <TableCell className="rounded-r-md p-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <CircleChevronRight
                                      className={`cursor-pointer ${
                                        loading
                                          ? "opacity-50 pointer-events-none"
                                          : ""
                                      }`}
                                      onClick={() =>
                                        handleInstancechange(service, "Backup")
                                      }
                                      disabled={loading}
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      `visit Dashboard{" "}
                                      {service.backupServiceName}`
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                <TableRow className="table-row rounded-xl">
                  <TableCell colSpan={4} className="text-center py-4">
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <p className="text-black">{popupMessage}</p>
            <div className="flex justify-end mt-4">
              <Button onClick={handlePopupClose}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <CustomLoader />
        </div>
      )}
    </div>
  );
}

export default LobbyTable;
