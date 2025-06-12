import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { lazy, Suspense, useEffect, useMemo, useCallback, useState } from "react";
import {
  fatchGraphics,
  getAtemeToken,
  getServiceConfig,
  getStatusServer,
  postgraphicsStartStop,
} from "@/utils/helpers/api/apiConstant";
import { useApiGetQuery } from "@/utils/helpers/api/apihooks/useApiGetQuery";
import CustomLoader from "@/components/custom-components/custom-loader";
import footerLogo from "@/assets/images/app-white-logo-footer.png";
import { TimerComponent } from "./components/time-components";
import { useToast } from "@/hooks/use-toast";
import { useApiMutation } from "@/utils/helpers/api/apihooks/useApiMutation";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useConfig } from "@/components/custom-components/ConfigContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeftFromLineIcon } from "lucide-react";
import { useInstance } from "@/components/custom-components/InstanceContext";

// Lazy load components
const Slates = lazy(() => import("./components/slates"));
const ScrollComponent = lazy(() => import("./components/scroll-component"));
const LogoBugComponents = lazy(() => import("./components/logo-bug"));
const SSaiCard = lazy(() => import("./components/ssai-card"));

// Custom hook for error handling
const useErrorHandler = (error, toast) => {
  useEffect(() => {
    if (error) {
      const errorMessage = error.response?.data?.message;
      const errorMessagedec = error.response?.data?.error?.message;
      toast({
        title: errorMessage || "Error",
        description: errorMessagedec || "Something went wrong.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
};

// Custom hook for fetching configurations
const useFetchConfig = (serverAddress, serviceUID) => {
  return useApiGetQuery({
    key: ["servicesconfig", serverAddress],
    endpoint: `${getServiceConfig}`,
    params: { address: serverAddress, serviceUID },
    options: { enabled: !!serverAddress, retry: false },
  });
};

// Custom hook for fetching tokens
const useFetchToken = (serverAddress, password) => {
  return useApiGetQuery({
    key: ["fetchatemetoken", serverAddress],
    endpoint: `${getAtemeToken}`,
    params: { address: serverAddress, password },
    options: {
      retry: false,
      enabled: !!serverAddress,
      refetchInterval: 1000 * 60 * 15, // Refresh token every 15 minutes
      refetchIntervalInBackground: true,
    },
  });
};

// Custom hook for fetching graphics
const useFetchGraphics = (dataIp) => {
  return useApiGetQuery({
    key: ["fetchGraphics", dataIp],
    endpoint: `${fatchGraphics}`,
    params: { address: dataIp },
    options: { enabled: !!dataIp, retry: false },
  });
};

const useCheckServerStatus = (serviceUID, serverAddress, serverToken) => {
  return useApiGetQuery({
    key: ["fetchServerChecks", serviceUID, serverAddress, serverToken],
    endpoint: `${getStatusServer}`,
    params: { serviceUID, serverAddress, serverToken },
    options: {
      enabled: Boolean(serviceUID && serverAddress && serverToken),
      refetchInterval: 1000 * 10, // Refresh every 10 seconds
      refetchIntervalInBackground: true,
      retry: true,
    },
  });
};

// Custom hook to debounce server status and prevent flickering
const useStableServerStatus = (serverData, isLoading, isFetching, isError) => {
  const [stableStatus, setStableStatus] = useState(null); // null = loading, true = green, false = red

  useEffect(() => {
    if (isLoading || isFetching) {
      // Keep the previous stable status during loading/fetching
      return;
    }
    const isEncoding = serverData?.data?.data?.status === "Encoding" && !isError;
    // setStableStatus(isEncoding); // Update only when data is fully resolved
    setStableStatus(isEncoding === true ? true : false)
  }, [serverData, isLoading, isFetching, isError]);

  return stableStatus;
};

export default function LobbyDashboard() {
  const { instanceName:instanceTpe, instanceDataText, isInstanceLoaded } = useInstance()
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setMainConfigSync, setBackupConfigSync} = useConfig();
  const instanceDataRaw = sessionStorage.getItem("serviceAllData");
  const instanceData = instanceDataRaw ? JSON.parse(instanceDataRaw) : {};
  const {
    mainServerAddress,
    backupServerAddress,
    mainServiceUID,
    backupServiceUID,
    mainServerPassword,
    backupServerPassword,
  } = instanceData;

  // Fetch configurations
  const {
    data: mainConfigData,
    isLoading: isLoadingMainConfig,
    error: errorMainConfig,
    refetch: refetchMainConfig,
  } = useFetchConfig(mainServerAddress, mainServiceUID);
  const {
    data: backupConfigData,
    isLoading: isLoadingBackupConfig,
    error: errorBackupConfig,
    refetch: refetchbackupConfig,
  } = useFetchConfig(backupServerAddress, backupServiceUID);

  // Fetch tokens
  const {
    data: mainTokenData,
    isLoading: isLoadingMainToken,
    error: errorMainToken,
  } = useFetchToken(mainServerAddress, mainServerPassword);
  const {
    data: backupTokenData,
    isLoading: isLoadingBackupToken,
    error: errorBackupToken,
  } = useFetchToken(backupServerAddress, backupServerPassword);

  // Handle errors
  useErrorHandler(errorMainConfig, toast);
  useErrorHandler(errorBackupConfig, toast);
  useErrorHandler(errorMainToken, toast);
  useErrorHandler(errorBackupToken, toast);

  // Store configurations and tokens in sessionStorage
  useEffect(() => {
    if (mainConfigData) {
      // sessionStorage.setItem("mainServicesConfig", JSON.stringify(mainConfigData?.data?.data));
      setMainConfigSync((mainConfigData?.data?.data))
    }
    if (backupConfigData) {
      // sessionStorage.setItem("backupServicesConfig", JSON.stringify(backupConfigData?.data?.data));
      setBackupConfigSync(backupConfigData?.data?.data)
    }
    if (mainTokenData) {
      sessionStorage.setItem("mainTokenData", mainTokenData?.data?.data?.atemeToken);
    }
    if (backupTokenData) {
      sessionStorage.setItem("backupTokenData", backupTokenData?.data?.data?.atemeToken);
    }
  }, [mainConfigData, backupConfigData, mainTokenData, backupTokenData]);

  // Fetch graphics data
  const instanceName = JSON.parse(sessionStorage.getItem("instanceName"));
  const dataIp = instanceName?.mainServerAddress || instanceName?.backupServerAddress;
  const {
    data: graphicsData,
    isLoading: isLoadingGraphics,
    error: errorGraphics,
  } = useFetchGraphics(dataIp);
  useErrorHandler(errorGraphics, toast);

  const ServiceDataCheck = JSON.parse(sessionStorage.getItem("DataOFStatus")) || {};
  const mainServiceToken = sessionStorage.getItem("mainTokenData");
  const backupServiceToken = sessionStorage.getItem("backupTokenData");
  const {
    backupServerAddress: backupServerAddressCheck,
    mainServerAddress: mainServerAddressCheck,
    mainServiceUID: mainServiceUIDCheck,
    backupServiceUID: backupServiceUIDCheck,
  } = ServiceDataCheck;

  // Memoize token swapping logic
  const getFinalTokens = useCallback(() => {
    if (!ServiceDataCheck) return { mainToken: null, backupToken: null };
    if (ServiceDataCheck?.backupServiceUID) {
      const checkCondition =instanceDataText?.trim() === "Primary";
      if (mainServiceUIDCheck === mainServiceUID &&checkCondition) {
        return { mainToken: mainServiceToken, backupToken: backupServiceToken };
      }
      return { mainToken: backupServiceToken, backupToken: mainServiceToken };
    }
    return { mainToken: mainServiceToken, backupToken: backupServiceToken };
  }, [ServiceDataCheck, mainServiceUIDCheck, mainServiceUID, mainServiceToken, backupServiceToken]);

  const { mainToken: finalMainToken, backupToken: finalBackupToken } = getFinalTokens();

  // Fetch server status
  const {
    data: CheckServerDatamain,
    isLoading: isLoadingCheckServerMain,
    error: errorCheckServerMain,
    isError: isErrorCheckServerMain,
    isFetching: isFetchingCheckServerMain,
  } = useCheckServerStatus(mainServiceUIDCheck, mainServerAddressCheck, finalMainToken);

  const {
    data: CheckServerDatabackup,
    isLoading: isLoadingCheckServerbackup,
    error: errorCheckServerbackup,
    isError: isErrorCheckServerbackup,
    isFetching: isFetchingCheckServerbackup,
  } = useCheckServerStatus(backupServiceUIDCheck, backupServerAddressCheck, finalBackupToken);

  useErrorHandler(errorCheckServerMain, toast);
  useErrorHandler(errorCheckServerbackup, toast);

  // Stabilize server status to prevent flickering
  const mainServerStatus = useStableServerStatus(
    CheckServerDatamain,
    isLoadingCheckServerMain,
    isFetchingCheckServerMain,
    isErrorCheckServerMain
  );

  const backupServerStatus = useStableServerStatus(
    CheckServerDatabackup,
    isLoadingCheckServerbackup,
    isFetchingCheckServerbackup,
    isErrorCheckServerbackup
  );

  // Memoize slates and bugs
  const slates = useMemo(() => {
    return (
      graphicsData?.data?.data?.slate?.map((slate) => ({
        name: slate.Name,
        path: slate.Path.startsWith("http")
          ? slate.Path
          : `http://${dataIp}${slate.Path}`,
      })) || []
    );
  }, [graphicsData, dataIp]);

  const bugs = useMemo(() => {
    return (
      graphicsData?.data?.data?.bug?.map((bug) => ({
        Name: bug.Name,
        path: bug.Path.startsWith("http")
          ? bug.Path
          : `http://${dataIp}${bug.Path}`,
      })) || []
    );
  }, [graphicsData, dataIp]);

  const mutationGraphicsStartStop = useApiMutation({
    endpoint: `${postgraphicsStartStop}`,
    method: "POST",
    options: {},
  });
  return (
    <div className="min-h-screen w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0">
          <CardHeader className="border-b-2 border-zinc-700 p-4">
            <CardTitle className="">Timer     <Button className="float-end m-0" onClick={() => { 
              navigate("/lobby"); 
              window.location.reload(); // Reload the page to refresh the lobby
            }}>
              <ArrowLeftFromLineIcon />Back to Lobby
            </Button></CardTitle>
        
           
          </CardHeader>
          <CardContent className="pt-6 text-center">
            <TimerComponent />
            <Card className="border-0 shadow-lg w-[30rem]">
              <CardHeader className="border-b-2 border-zinc-700 p-4 text-start">
                <CardTitle>Service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex items-center gap-2 mt-1">
                  {mainServerAddressCheck && (
                    <div className="flex flex-col">
                      <Label className="mb-2">Main IP</Label>
                      <Button
                        className={
                          mainServerStatus === null
                            ? "bg-[#3A3A3A] text-white" // Loading state
                            : mainServerStatus
                            ? "bg-[#3A3A3A] text-white" // Green (Encoding)
                            : "animated-button focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800" // Red (Not Encoding)
                        }
                      >
                        <span
                          className={`pulse ${
                            mainServerStatus === null
                              ? ""
                              : mainServerStatus
                              ? "green-color"
                              : "red-color"
                          }`}
                        ></span>
                        {mainServerAddressCheck || "N/A"}
                      </Button>
                    </div>
                  )}
                  {backupServerAddressCheck && (
                    <div className="flex flex-col">
                      <Label className="mb-2">Backup IP</Label>
                      <Button
                        className={
                          backupServerStatus === null
                            ? "bg-[#3A3A3A] text-white" // Loading state
                            : backupServerStatus
                            ? "bg-[#3A3A3A] text-white" // Green (Encoding)
                            : "animated-button focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800" // Red (Not Encoding)
                        }
                      >
                        <span
                          className={`pulse ${
                            backupServerStatus === null
                              ? ""
                              : backupServerStatus
                              ? "green-color"
                              : "red-color"
                          }`}
                        ></span>
                        {backupServerAddressCheck || "N/A"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <Suspense fallback={<CustomLoader />}>
          <SSaiCard 
          mainServerStatus={mainServerStatus}
          backupServerStatus={backupServerStatus}
          />
        </Suspense>
      </div>

      <Card className="mt-4 border-0">
        <CardHeader className="border-b-2 border-zinc-700 p-4">
          <CardTitle>Graphics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Suspense fallback={<CustomLoader />}>
                <Slates
                  slates={slates}
                  isLoading={isLoadingGraphics}
                  isError={!!errorGraphics}
                  mainServerStatus={mainServerStatus}
                  backupServerStatus={backupServerStatus}
                  // refetchMainConfig={refetchMainConfig}
                  // refetchbackupConfig={refetchbackupConfig}
                  mutationGraphicsStartStop={mutationGraphicsStartStop}
                />
              </Suspense>
            </div>
            <div className="space-y-2">
              <Suspense fallback={<CustomLoader />}>
                <ScrollComponent
                  mutationGraphicsStartStop={mutationGraphicsStartStop}
                  mainServerStatus={mainServerStatus}
                  backupServerStatus={backupServerStatus}
                  // refetchMainConfig={refetchMainConfig}
                  // refetchbackupConfig={refetchbackupConfig}
                />
              </Suspense>
            </div>
            <div className="space-y-2">
              <Suspense fallback={<CustomLoader />}>
                <LogoBugComponents
                  bugs={bugs}
                  isLoading={isLoadingGraphics}
                  isError={!!errorGraphics}
                  mutationGraphicsStartStop={mutationGraphicsStartStop}
                  mainServerStatus={mainServerStatus}
                  backupServerStatus={backupServerStatus}
                  // refetchMainConfig={refetchMainConfig}
                  // refetchbackupConfig={refetchbackupConfig}
                />
              </Suspense>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

