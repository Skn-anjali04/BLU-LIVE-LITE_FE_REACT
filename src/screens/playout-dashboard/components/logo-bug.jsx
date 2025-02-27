import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { cloneDeep } from "lodash";
import { LoaderCircle } from "lucide-react";
import { useInstance } from "@/components/custom-components/InstanceContext";
import { useConfig } from "@/components/custom-components/ConfigContext";

const LogoBugComponents = React.memo(
  ({ bugs, isLoading, isError, mutationGraphicsStartStop, backupServerStatus, mainServerStatus }) => {
    const { 
      getMainConfig, 
      setMainConfigSync, 
      getBackupConfig, 
      setBackupConfigSync 
    } = useConfig();
    
    const { instanceName, setInstanceName, instanceDataText, setInstanceDataText } = useInstance();
    const { toast } = useToast();
    const [selectedLogoBug, setSelectedLogoBug] = useState(null);
    const [logoBugItems, setLogoBugItems] = useState([]);
    const [isConfigLoaded, setIsConfigLoaded] = useState(false);
    const [hoveredSlate, setHoveredSlate] = useState(null);
    const [hoverTimeout, setHoverTimeout] = useState(null);
    const [startFlagLogo, setStartFlagLogo] = useState(false);
    const [stopFlag, setStopFlag] = useState(false);

    // Use ConfigContext instead of local state and direct sessionStorage
    const logoBugConfig = getMainConfig();
    const backupServicesConfig = getBackupConfig();

    const ServerAllData = sessionStorage.getItem("serviceAllData");
    const parsedServerAllData = ServerAllData ? JSON.parse(ServerAllData) : {};
    const mainServiceToken = sessionStorage.getItem("mainTokenData");
    const backupServiceToken = sessionStorage.getItem("backupTokenData");

    const {
      mainServerAddress: mainServerAddressPayload,
      mainServiceName: mainServiceNamePayload,
      mainServiceUID: mainServiceUIDPayload,
      backupServiceUID: backupServiceUIDPayload,
      backupServiceName: backupServiceNamePayload,
      backupServerAddress: backupServerAddressPayload,
    } = parsedServerAllData ?? {};

    // Poll sessionStorage for initial config loading if not in context
    useEffect(() => {
      if (!logoBugConfig && !isConfigLoaded) {
        const interval = setInterval(() => {
          const config = sessionStorage.getItem("mainServicesConfig");
          if (config) {
            setMainConfigSync(JSON.parse(config));
            setIsConfigLoaded(true);
            clearInterval(interval);
          }
        }, 1000);
        return () => clearInterval(interval);
      } else if (logoBugConfig) {
        setIsConfigLoaded(true);
      }
    }, [logoBugConfig, isConfigLoaded, setMainConfigSync]);

    // Optional: Poll for backup config if needed
    useEffect(() => {
      if (!backupServicesConfig && !isConfigLoaded) {
        const interval = setInterval(() => {
          const config = sessionStorage.getItem("backupServicesConfig");
          if (config) {
            setBackupConfigSync(JSON.parse(config));
            setIsConfigLoaded(true);
            clearInterval(interval);
          }
        }, 1000);
        return () => clearInterval(interval);
      }
    }, [backupServicesConfig, isConfigLoaded, setBackupConfigSync]);

    // Set the logoBugItems similar to ScrollItems
    useEffect(() => {
      if (bugs?.length) {
        setLogoBugItems(
          bugs.map((item, index) => ({
            id: String(index + 1),
            text: item.Name,
            path: item.path,
          }))
        );
      }
    }, [bugs]);

    // Handle error fetching bugs
    useEffect(() => {
      if (isError) {
        toast({
          title: "Error",
          description: "Failed to fetch bugs",
          variant: "destructive",
        });
      }
    }, [isError, toast]);

    // Get active logo bugs from the config
    const logoBugActive = useMemo(
      () =>
        logoBugConfig?.Device?.Template?.Tracks?.VideoTracks[0]?.LogoInsertions,
      [logoBugConfig]
    );
    const activeLogoBugsCount = logoBugActive?.filter(
      ({ Enable }) => Enable
    ).length;

    const isSelectedLogoBugActive = useMemo(
      () =>
        logoBugActive?.some(
          ({ FileName, Enable }) => FileName === selectedLogoBug && Enable
        ) || false,
      [selectedLogoBug, logoBugActive]
    );

    // Handle start of logo/bug
    const handleLogoBugStart = useCallback(() => {
      if (!selectedLogoBug) {
        toast({
          title: "Error",
          description: "No logo/bug selected",
          variant: "destructive",
        });
        return;
      }

      if (isSelectedLogoBugActive) {
        toast({
          title: "Error",
          description: "Selected logo/bug is already active",
          variant: "destructive",
        });
        return;
      }

      let updatedConfig = cloneDeep(logoBugConfig);
      const logoInsertions =
        updatedConfig.Device.Template.Tracks.VideoTracks[0].LogoInsertions;
      if (logoInsertions.length === 0) {
        toast({
          title: "Error",
          description: "No active logo/bug found",
          variant: "destructive",
        });
        return;
      }
      const logoInsertionIndex = logoInsertions.findIndex(
        (logoBug) => !logoBug.Enable
      );
      if (logoInsertionIndex !== -1) {
        const updatedLogoInsertion = {
          ...logoInsertions[logoInsertionIndex],
          FileName: selectedLogoBug,
          Enable: true,
          Top: 0,
          Left: 0,
          Size: 1000,
        };
        logoInsertions[logoInsertionIndex] = updatedLogoInsertion;
      }
      updatedConfig.Device.Template.Tracks.VideoTracks[0].LogoInsertions =
        logoInsertions;

      let updatedConfigBackup;
      if (backupServicesConfig) {
        updatedConfigBackup = cloneDeep(backupServicesConfig);
        const logoInsertionsBackup =
          updatedConfigBackup.Device.Template.Tracks.VideoTracks[0].LogoInsertions;
        const logoInsertionIndexBackup = logoInsertionsBackup.findIndex(
          (logoBug) => !logoBug.Enable
        );
        if (logoInsertionIndexBackup !== -1) {
          const updatedLogoInsertion = {
            ...logoInsertionsBackup[logoInsertionIndexBackup],
            FileName: selectedLogoBug,
            Enable: true,
            Top: 0,
            Left: 0,
            Size: 1000,
          };
          logoInsertionsBackup[logoInsertionIndexBackup] = updatedLogoInsertion;
        }
        updatedConfigBackup.Device.Template.Tracks.VideoTracks[0].LogoInsertions =
          logoInsertionsBackup;
      }

      let payload;
      if (
        mainServiceUIDPayload &&
        mainServerAddressPayload &&
        backupServiceUIDPayload &&
        backupServerAddressPayload &&
        mainServiceToken &&
        selectedLogoBug &&
        backupServiceToken &&
        updatedConfigBackup
      ) {
        payload = {
          mainServiceUID: mainServiceUIDPayload,
          mainServiceObj: updatedConfig,
          mainServiceAddress: mainServerAddressPayload,
          mainServiceToken: mainServiceToken,
          mainServiceName: mainServiceNamePayload,
          graphicName: selectedLogoBug,
          graphicType: "logo",
          graphicAction: "start",
          isBackupAvailable: true,
          backupServiceUID: backupServiceUIDPayload,
          backupServiceObj: updatedConfigBackup,
          backupServiceAddress: backupServerAddressPayload,
          backupServiceToken: backupServiceToken,
          backupServiceName: backupServiceNamePayload,
        };
      } else if (
        mainServiceUIDPayload &&
        mainServiceToken &&
        mainServerAddressPayload &&
        selectedLogoBug &&
        !backupServiceUIDPayload &&
        !backupServiceToken
      ) {
        payload = {
          mainServiceUID: mainServiceUIDPayload,
          mainServiceObj: updatedConfig,
          mainServiceAddress: mainServerAddressPayload,
          mainServiceToken: mainServiceToken,
          mainServiceName: mainServiceNamePayload,
          graphicName: selectedLogoBug,
          graphicType: "logo",
          graphicAction: "start",
          isBackupAvailable: false,
        };
      } else {
        toast({
          title: "Error",
          description: "Payload creation failed. Please check the conditions.",
          variant: "destructive",
        });
      }

      setStartFlagLogo(true);
      mutationGraphicsStartStop.mutate(
        { payload },
        {
          onSuccess: (data) => {
            setMainConfigSync(updatedConfig); // Update context instead of local state
            if (updatedConfigBackup) {
              setBackupConfigSync(updatedConfigBackup);
            }
            setStartFlagLogo(false);
            const message = data?.data?.message;
            // toast({
            //   title: "LOGO/BUG Status",
            //   description: message,
            //   variant: "success",
            // });
          },
          onError: (error) => {
            const errorMessage = error.response?.data?.message;
            const errorMessagedec = error.response?.data?.error?.message;
            toast({
              title: errorMessage || "Error",
              description: errorMessagedec || "Something went wrong.",
              variant: "destructive",
            });
          },
        }
      );
    }, [
      selectedLogoBug,
      isSelectedLogoBugActive,
      logoBugConfig,
      backupServicesConfig,
      toast,
      mutationGraphicsStartStop,
      setMainConfigSync,
      setBackupConfigSync,
    ]);

    // Handle stop of logo/bug
    const handleLogoBugStop = useCallback(() => {
      if (!selectedLogoBug) {
        toast({
          title: "Error",
          description: "No logo/bug selected",
          variant: "destructive",
        });
        return;
      }

      if (!isSelectedLogoBugActive) {
        toast({
          title: "Error",
          description: "Selected logo/bug is not active",
          variant: "destructive",
        });
        return;
      }

      const activeLogoBug = logoBugActive.find(
        (logoBug) => logoBug.Enable === true
      );

      if (!activeLogoBug) {
        toast({
          title: "Error",
          description: "No active logo/bug found",
          variant: "destructive",
        });
        return;
      }

      const activeLogoText = activeLogoBug.FileName;

      let updatedConfig = cloneDeep(logoBugConfig);
      const logoInsertions =
        updatedConfig.Device.Template.Tracks.VideoTracks[0].LogoInsertions;
      const index = logoInsertions.findIndex(
        (logoBug) => logoBug.FileName === selectedLogoBug
      );
      if (index !== -1) {
        logoInsertions[index] = { ...logoInsertions[index], Enable: false };
        updatedConfig.Device.Template.Tracks.VideoTracks[0].LogoInsertions =
          logoInsertions;
      }

      let updatedConfigStopBackup;
      if (backupServicesConfig) {
        updatedConfigStopBackup = cloneDeep(backupServicesConfig);
        const logoInsertionsStopBackup =
          updatedConfigStopBackup.Device.Template.Tracks.VideoTracks[0].LogoInsertions;
        const indexBackup = logoInsertionsStopBackup.findIndex(
          (logoBug) => logoBug.FileName === selectedLogoBug
        );
        if (indexBackup !== -1) {
          logoInsertionsStopBackup[indexBackup] = { 
            ...logoInsertionsStopBackup[indexBackup], 
            Enable: false 
          };
          updatedConfigStopBackup.Device.Template.Tracks.VideoTracks[0].LogoInsertions =
            logoInsertionsStopBackup;
        }
      }

      let payload;
      if (
        mainServiceUIDPayload &&
        mainServerAddressPayload &&
        backupServiceUIDPayload &&
        backupServerAddressPayload &&
        mainServiceToken &&
        activeLogoText &&
        backupServiceToken &&
        updatedConfigStopBackup
      ) {
        payload = {
          mainServiceUID: mainServiceUIDPayload,
          mainServiceObj: updatedConfig,
          mainServiceAddress: mainServerAddressPayload,
          mainServiceToken: mainServiceToken,
          mainServiceName: mainServiceNamePayload,
          graphicName: activeLogoText,
          graphicType: "logo",
          graphicAction: "stop",
          isBackupAvailable: true,
          backupServiceUID: backupServiceUIDPayload,
          backupServiceObj: updatedConfigStopBackup,
          backupServiceAddress: backupServerAddressPayload,
          backupServiceToken: backupServiceToken,
          backupServiceName: backupServiceNamePayload,
        };
      } else if (
        mainServiceUIDPayload &&
        mainServiceToken &&
        mainServerAddressPayload &&
        activeLogoText &&
        !backupServerAddressPayload &&
        !backupServiceUIDPayload
      ) {
        payload = {
          mainServiceUID: mainServiceUIDPayload,
          mainServiceObj: updatedConfig,
          mainServiceAddress: mainServerAddressPayload,
          mainServiceToken: mainServiceToken,
          mainServiceName: mainServiceNamePayload,
          graphicName: activeLogoText,
          graphicType: "logo",
          graphicAction: "stop",
          isBackupAvailable: false,
        };
      } else {
        toast({
          title: "Error",
          description: "Payload creation failed. Please check the conditions.",
          variant: "destructive",
        });
      }

      setStopFlag(true);
      mutationGraphicsStartStop.mutate(
        { payload },
        {
          onSuccess: (data) => {
            setMainConfigSync(updatedConfig); // Update context instead of local state
            if (updatedConfigStopBackup) {
              setBackupConfigSync(updatedConfigStopBackup);
            }
            setStopFlag(false);
            const message = data?.data?.message;
            // toast({
            //   title: "Logo/Bug Status",
            //   description: message,
            //   variant: "success",
            // });
          },
          onError: (error) => {
            const errorMessage = error.response?.data?.message;
            const errorMessagedec = error.response?.data?.error?.message;
            toast({
              title: errorMessage || "Error",
              description: errorMessagedec || "Something went wrong.",
              variant: "destructive",
            });
          },
        }
      );
    }, [
      logoBugConfig,
      backupServicesConfig,
      toast,
      logoBugActive,
      mutationGraphicsStartStop,
      selectedLogoBug,
      setMainConfigSync,
      setBackupConfigSync,
    ]);

    // Handle logo/bug click
    const handleLogoBugClick = (text) => {
      setSelectedLogoBug(text);
    };

    const handleMouseEnter = useCallback((slate) => {
      const timeout = setTimeout(() => {
        setHoveredSlate(slate);
      }, 1000);
      setHoverTimeout(timeout);
    }, []);

    const handleMouseLeave = useCallback(() => {
      clearTimeout(hoverTimeout);
      setHoveredSlate(null);
    }, [hoverTimeout]);

    const CheckServiceMain = (instanceDataText === "Primary" && mainServerStatus === false);
    const CheckBackup = (instanceDataText === "Backup" && backupServerStatus === false);

    return (
      <Card className="mt-4 border-0">
        <CardHeader className="p-4">
          <CardTitle>
            <span>Logo/Bug</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : isError ? (
            <div className="text-red-500">Error loading bugs</div>
          ) : (
            <ScrollArea className="h-[200px] bg-zinc-700 rounded-md p-2">
              {logoBugItems?.map((item) => (
                <React.Fragment key={item.id}>
                  <div
                    className={`relative py-1 px-2 hover:bg-zinc-600 rounded cursor-pointer font-medium 
                    ${
                      logoBugActive?.filter(
                        ({ FileName, Enable }) =>
                          FileName === item?.text && Enable
                      ).length > 0
                        ? "bg-green-500 hover:!bg-green-500 "
                        : selectedLogoBug === item?.text
                        ? "bg-zinc-600"
                        : ""
                    }`}
                    onClick={() => handleLogoBugClick(item.text)}
                    onMouseEnter={() => handleMouseEnter(item)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {selectedLogoBug === item.text && (
                      <span className="float-left mr-2 text-green-500">
                        ▶
                      </span>
                    )}
                    {item.text}
                    {hoveredSlate?.text === item?.text && (
                      <div className="fixed max-w-[128px] max-h-[128px] right-[20%] top-[65%] p-2 bg-zinc-400 border shadow-md rounded z-50">
                        <img
                          src={item?.path}
                          alt={item?.text}
                          className="w-full h-full min-w-full min-h-full object-contain"
                          onError={(e) => (e.target.style.display = "none")}
                        />
                      </div>
                    )}
                  </div>
                  <Separator className="my-1 bg-zinc-400" />
                </React.Fragment>
              ))}
            </ScrollArea>
          )}
        </CardContent>

        <CardFooter className="flex justify-end w-full">
          <div className="flex justify-end gap-2">
            <Button
              disabled={
                activeLogoBugsCount >= 4 ||
                (mutationGraphicsStartStop.isPending && startFlagLogo) || 
                CheckBackup || 
                CheckServiceMain
              }
              onClick={handleLogoBugStart}
            >
              {mutationGraphicsStartStop.isPending && startFlagLogo ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                "  Start"
              )}
            </Button>
            <Button
              disabled={
                activeLogoBugsCount === 0 ||
                (mutationGraphicsStartStop.isPending && stopFlag) || 
                CheckBackup || 
                CheckServiceMain
              }
              onClick={handleLogoBugStop}
              variant="destructive"
            >
              {mutationGraphicsStartStop.isPending && stopFlag ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                "  Stop"
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  }
);

export default LogoBugComponents;

//   Card,
//   CardContent,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Separator } from "@/components/ui/separator";
// import React, { useState, useCallback, useEffect, useMemo } from "react";
// import { useToast } from "@/hooks/use-toast";
// import { cloneDeep } from "lodash";
// import { LoaderCircle } from "lucide-react";
// import { useInstance } from "@/components/custom-components/InstanceContext";

// const LogoBugComponents = React.memo(
//   ({ bugs, isLoading, isError, mutationGraphicsStartStop,backupServerStatus,mainServerStatus}) => {
//     const { intanceName, setIntanceName, intanceDataText, setIntanceDataText } = useInstance();
//     const { toast } = useToast();
//     const [selectedLogoBug, setSelectedLogoBug] = useState(null);
//     const [logoBugItems, setLogoBugItems] = useState([]);
//     const [isConfigLoaded, setIsConfigLoaded] = useState(false);
//     const [hoveredSlate, setHoveredSlate] = useState(null);
//     const [hoverTimeout, setHoverTimeout] = useState(null);
//     const [startFlagLogo, setStartFlagLogo] = useState(false);
//     const [stopFlag, setStopFlag] = useState(false);

//     // Fetch and manage LogoBug Config from sessionStorage
//     const [logoBugConfig, setLogoBugConfig] = useState(() => {
//       const config = sessionStorage.getItem("mainServicesConfig");
//       if (config) {
//         setIsConfigLoaded(true);
//         return JSON.parse(config);
//       }
//       return null;
//     });

//     // const ServerAllData = JSON.parse(sessionStorage.getItem("serviceAllData"));
//     const ServerAllData = sessionStorage.getItem("serviceAllData");
//     const parsedServerAllData = ServerAllData ? JSON.parse(ServerAllData) : {};
//     const mainServiceToken = sessionStorage.getItem("mainTokenData");
//     const backupServiceToken = sessionStorage.getItem("backupTokenData");
//     const backupServicesConfig = JSON.parse(
//       sessionStorage.getItem("backupServicesConfig")
//     );

//     const {
//       mainServerAddress: mainServerAddressPayload,
//       mainServiceName: mainServiceNamePayload,
//       mainServiceUID: mainServiceUIDPayload,
//       backupServiceUID: backupServiceUIDPayload,
//       backupServiceName: backupServiceNamePayload,
//       backupServerAddress: backupServerAddressPayload,
//     } = parsedServerAllData ?? {};

//     // Poll sessionStorage for the config if it's not initially available
//     useEffect(() => {
//       if (!logoBugConfig && !isConfigLoaded) {
//         const interval = setInterval(() => {
//           const config = sessionStorage.getItem("mainServicesConfig");
//           if (config) {
//             setLogoBugConfig(JSON.parse(config));
//             setIsConfigLoaded(true);
//             clearInterval(interval);
//           }
//         }, 1000);
//         return () => clearInterval(interval);
//       }
//     }, [logoBugConfig, isConfigLoaded]);

//     // Set the logoBugItems similar to ScrollItems
//     useEffect(() => {
//       if (bugs?.length) {
//         setLogoBugItems(
//           bugs.map((item, index) => ({
//             id: String(index + 1),
//             text: item.Name,
//             path: item.path,
//           }))
//         );
//       }
//     }, [bugs]);

//     // Handle error fetching bugs
//     useEffect(() => {
//       if (isError) {
//         toast({
//           title: "Error",
//           description: "Failed to fetch bugs",
//           variant: "destructive",
//         });
//       }
//     }, [isError, toast]);
//     // Get active logo bugs from the config
//     const logoBugActive = useMemo(
//       () =>
//         logoBugConfig?.Device?.Template?.Tracks?.VideoTracks[0]?.LogoInsertions,
//       [logoBugConfig]
//     );
//     const activeLogoBugsCount = logoBugActive?.filter(
//       ({ Enable }) => Enable
//     ).length;

//     const isSelectedLogoBugActive = useMemo(
//       () =>
//         logoBugActive?.some(
//           ({ FileName, Enable }) => FileName === selectedLogoBug && Enable
//         ) || false,
//       [selectedLogoBug, logoBugActive]
//     );

//     // Handle start of logo/bug
//     const handleLogoBugStart = useCallback(() => {
//       if (!selectedLogoBug) {
//         toast({
//           title: "Error",
//           description: "No logo/bug selected",
//           variant: "destructive",
//         });
//         return;
//       }

//       if (isSelectedLogoBugActive) {
//         toast({
//           title: "Error",
//           description: "Selected logo/bug is already active",
//           variant: "destructive",
//         });
//         return;
//       }

//       let updatedConfig = cloneDeep(logoBugConfig);
//       const logoInsertions =
//         updatedConfig.Device.Template.Tracks.VideoTracks[0].LogoInsertions;
//         if (logoInsertions.length===0) {
//           toast({
//             title: "Error",
//             description: "No active logo/bug found",
//             variant: "destructive",
//           });
//           return;
//         }
//       const logoInsertionIndex = logoInsertions.findIndex(
//         (logoBug) => !logoBug.Enable
//       );
//       if (logoInsertionIndex !== -1) {
//         const updatedLogoInsertion = {
//           ...logoInsertions[logoInsertionIndex],
//           FileName: selectedLogoBug,
//           Enable: true,
//           Top: 0,
//           Left: 0,
//           Size: 1000,
//         };
//         logoInsertions[logoInsertionIndex] = updatedLogoInsertion;
//       }
//       updatedConfig.Device.Template.Tracks.VideoTracks[0].LogoInsertions =
//         logoInsertions;
//         let updatedConfigBackup;
//         if(backupServicesConfig!==null&& backupServicesConfig!=undefined){
//          updatedConfigBackup = cloneDeep(backupServicesConfig);
//         const logoInsertionsBackup =
//           updatedConfigBackup.Device.Template.Tracks.VideoTracks[0].LogoInsertions;
//         const logoInsertionIndexBackup = logoInsertionsBackup.findIndex(
//           (logoBug) => !logoBug.Enable
//         );
//         if (logoInsertionIndexBackup !== -1) {
//           const updatedLogoInsertion = {
//             ...logoInsertionsBackup[logoInsertionIndexBackup],
//             FileName: selectedLogoBug,
//             Enable: true,
//             Top: 0,
//             Left: 0,
//             Size: 1000,
//           };
//           logoInsertionsBackup[logoInsertionIndexBackup] = updatedLogoInsertion;
//         }
//         updatedConfigBackup.Device.Template.Tracks.VideoTracks[0].LogoInsertions =
//           logoInsertionsBackup;
//       }

//       let payload;
//       if (
//         mainServiceUIDPayload &&
//         mainServerAddressPayload &&
//         backupServiceUIDPayload &&
//         backupServerAddressPayload &&
//         mainServiceToken &&
//         selectedLogoBug &&
//         backupServiceToken&&
//         updatedConfigBackup
//       ) {
//         payload = {
//           mainServiceUID: mainServiceUIDPayload,
//           mainServiceObj: updatedConfig,
//           mainServiceAddress: mainServerAddressPayload,
//           mainServiceToken: mainServiceToken,
//           mainServiceName: mainServiceNamePayload,
//           graphicName: selectedLogoBug,
//           graphicType: "logo",
//           graphicAction: "start",
//           isBackupAvailable: true,
//           backupServiceUID: backupServiceUIDPayload,
//           backupServiceObj: updatedConfigBackup,
//           backupServiceAddress: backupServerAddressPayload,
//           backupServiceToken: backupServiceToken,
//           backupServiceName: backupServiceNamePayload,
//         };
//       } else if (
//         mainServiceUIDPayload &&
//         mainServiceToken &&
//         mainServerAddressPayload &&
//         selectedLogoBug&&
//         !backupServiceUIDPayload&&
//         !backupServiceToken
//       ) {
//         payload = {
//           mainServiceUID: mainServiceUIDPayload,
//           mainServiceObj: updatedConfig,
//           mainServiceAddress: mainServerAddressPayload,
//           mainServiceToken: mainServiceToken,
//           mainServiceName: mainServiceNamePayload,
//           graphicName: selectedLogoBug,
//           graphicType: "logo",
//           graphicAction: "start",
//           isBackupAvailable: false,
//         };
//       } else {
//         // console.log("error payload not found");
//         toast({
//           title: "Error",
//           description: "Payload creation failed. Please check the conditions.",
//           variant: "destructive",
//         });
//       }
//       setStartFlagLogo(true);
//       mutationGraphicsStartStop.mutate(
//         { payload },
//         {
//           onSuccess: (data) => {
//             sessionStorage.setItem(
//               "mainServicesConfig",
//               JSON.stringify(updatedConfig)
//             );
//             if(backupServicesConfig!==null&& backupServicesConfig!=undefined){
//             sessionStorage.setItem(
//               "backupServicesConfig",
//               JSON.stringify(updatedConfigBackup)
//             );}
//             setLogoBugConfig(updatedConfig);
//             setStartFlagLogo(false);
//             const message = data?.data?.message;
//             // toast({
//             //   title: "LOGO/BUG Status",
//             //   description: message,
//             //   variant: "success",
//             // });
//           },
//           onError: (error) => {
//             const errorMessage = error.response?.data?.message;
//             const errorMessagedec = error.response?.data?.error?.message;
//             toast({
//               title: errorMessage ||"Error",
//               description: errorMessagedec ||"Something went wrong.",
//               variant: "destructive",
//             });
//           },
//         }
//       );
//     }, [
//       selectedLogoBug,
//       isSelectedLogoBugActive,
//       logoBugConfig,
//       toast,
//       mutationGraphicsStartStop,
//     ]);

//     // Handle stop of logo/bug
//     const handleLogoBugStop = useCallback(() => {
//       if (!selectedLogoBug) {
//         toast({
//           title: "Error",
//           description: "No logo/bug selected",
//           variant: "destructive",
//         });
//         return;
//       }

//       if (!isSelectedLogoBugActive) {
//         toast({
//           title: "Error",
//           description: "Selected logo/bug is not active",
//           variant: "destructive",
//         });
//         return;
//       }

//       // Find the active logo/bug
//       const activeLogoBug = logoBugActive.find(
//         (logoBug) => logoBug.Enable === true
//       );

//       if (!activeLogoBug) {
//         toast({
//           title: "Error",
//           description: "No active logo/bug found",
//           variant: "destructive",
//         });
//         return;
//       }

//       const activeLogoText = activeLogoBug.FileName;

//       let updatedConfig = cloneDeep(logoBugConfig);
//       const logoInsertions =
//         updatedConfig.Device.Template.Tracks.VideoTracks[0].LogoInsertions;
//       // Find the index of the selected logo bug
//       const index = logoInsertions.findIndex(
//         (logoBug) => logoBug.FileName === selectedLogoBug
//       );
//       if (index !== -1) {
//         // Update only the matched logoBug
//         logoInsertions[index] = { ...logoInsertions[index], Enable: false };
//         updatedConfig.Device.Template.Tracks.VideoTracks[0].LogoInsertions =
//           logoInsertions;
//       }
//       let updatedConfigStopBackup
//       if(backupServicesConfig!==null&& backupServicesConfig!=undefined){
//        updatedConfigStopBackup = cloneDeep(backupServicesConfig);
//       const logoInsertionsStopBackup =
//         updatedConfigStopBackup.Device.Template.Tracks.VideoTracks[0].LogoInsertions;
//       // Find the index of the selected logo bug
//       const indexBackup = logoInsertionsStopBackup.findIndex(
//         (logoBug) => logoBug.FileName === selectedLogoBug
//       );
//       if (indexBackup !== -1) {
//         // Update only the matched logoBug
//         logoInsertionsStopBackup[indexBackup] = { ...logoInsertionsStopBackup[indexBackup], Enable: false };
//         updatedConfigStopBackup.Device.Template.Tracks.VideoTracks[0].LogoInsertions =
//           logoInsertionsStopBackup;
//       }
//     }
//       let payload;
//       if (
//         mainServiceUIDPayload &&
//         mainServerAddressPayload &&
//         backupServiceUIDPayload &&
//         backupServerAddressPayload &&
//         mainServiceToken &&
//         activeLogoText &&
//         backupServiceToken&&
//         updatedConfigStopBackup
//       ) {
//         payload = {
//           mainServiceUID: mainServiceUIDPayload,
//           mainServiceObj: updatedConfig,
//           mainServiceAddress: mainServerAddressPayload,
//           mainServiceToken: mainServiceToken,
//           mainServiceName: mainServiceNamePayload,
//           graphicName: activeLogoText,
//           graphicType: "logo",
//           graphicAction: "stop",
//           isBackupAvailable: true,
//           backupServiceUID: backupServiceUIDPayload,
//           backupServiceObj:updatedConfigStopBackup,
//           backupServiceAddress: backupServerAddressPayload,
//           backupServiceToken: backupServiceToken,
//           backupServiceName: backupServiceNamePayload,
//         };
//       } else if (
//         mainServiceUIDPayload &&
//         mainServiceToken &&
//         mainServerAddressPayload &&
//         activeLogoText&&
//         !backupServerAddressPayload&&
//         !backupServiceUIDPayload
//       ) {
//         payload = {
//           mainServiceUID: mainServiceUIDPayload,
//           mainServiceObj: updatedConfig,
//           mainServiceAddress: mainServerAddressPayload,
//           mainServiceToken: mainServiceToken,
//           mainServiceName: mainServiceNamePayload,
//           graphicName: activeLogoText,
//           graphicType: "logo",
//           graphicAction: "stop",
//           isBackupAvailable: false,
//         };
//       } else {
//         // console.log("error payload not found");
//         toast({
//           title: "Error",
//           description: "Payload creation failed. Please check the conditions.",
//           variant: "destructive",
//         });
//       }
//       setStopFlag(true);
//       mutationGraphicsStartStop.mutate(
//         { payload },
//         {
//           onSuccess: (data) => {
//             sessionStorage.setItem(
//               "mainServicesConfig",
//               JSON.stringify(updatedConfig)
//             );
//             if(backupServicesConfig!==null&& backupServicesConfig!=undefined){
//             sessionStorage.setItem(
//               "backupServicesConfig",
//               JSON.stringify(updatedConfigStopBackup)
//             );}
//             setLogoBugConfig(updatedConfig);
//             setStopFlag(false);
//             const message = data?.data?.message;
//             // toast({
//             //   title: "Logo/Bug Status",
//             //   description: message,
//             //   variant: "success",
//             // });
//           },
//           onError: (error) => {
//             const errorMessage = error.response?.data?.message;
//             const errorMessagedec = error.response?.data?.error?.message;
//             toast({
//               title: errorMessage ||"Error",
//               description: errorMessagedec ||"Something went wrong.",
//               variant: "destructive",
//             });
//           },
//         }
//       );
//     }, [
//       logoBugConfig,
//       toast,
//       logoBugActive,
//       mutationGraphicsStartStop,
//       selectedLogoBug,
//     ]);

//     // Handle logo/bug click
//     const handleLogoBugClick = (text) => {
//       setSelectedLogoBug(text);
//     };

//     const handleMouseEnter = useCallback((slate) => {
//       const timeout = setTimeout(() => {
//         setHoveredSlate(slate);
//       }, 1000);
//       setHoverTimeout(timeout);
//     }, []);

//     const handleMouseLeave = useCallback(() => {
//       clearTimeout(hoverTimeout);
//       setHoveredSlate(null);
//     }, [hoverTimeout]);
//     const CkeckServicemain= (intanceDataText==="Primary"&&mainServerStatus !== null&&mainServerStatus ===false)
//     const CheckBacup=(intanceDataText==="Backup"&&backupServerStatus ===false)
//     return (
//       <Card className="mt-4 border-0">
//         <CardHeader className="p-4">
//           <CardTitle>
//             <span>Logo/Bug</span>
//           </CardTitle>
//         </CardHeader>
//         <CardContent>
//           {isLoading ? (
//             <div>Loading...</div>
//           ) : isError ? (
//             <div className="text-red-500">Error loading bugs</div>
//           ) : (
//             <ScrollArea className="h-[200px] bg-zinc-700 rounded-md p-2">
//               {logoBugItems?.map((item) => (
//                 <React.Fragment key={item.id}>
//                   <div
//                     className={`relative py-1 px-2 hover:bg-zinc-600 rounded cursor-pointer font-medium 
//                     ${
//                       logoBugActive?.filter(
//                         ({ FileName, Enable }) =>
//                           FileName === item?.text && Enable
//                       ).length > 0
//                         ? "bg-green-500 hover:!bg-green-500 "
//                         : selectedLogoBug === item?.text
//                         ? "bg-zinc-600"
//                         : ""
//                     }`}
//                     onClick={() => handleLogoBugClick(item.text)}
//                     onMouseEnter={() => handleMouseEnter(item)}
//                     onMouseLeave={handleMouseLeave}
//                   >
//                     {selectedLogoBug === item.text && (
//                       <span className="float-left mr-2 text-green-500">
//                         &#9654;
//                       </span>
//                     )}
//                     {item.text}
//                     {hoveredSlate?.text === item?.text && (
//                       <div className="fixed max-w-[128px] max-h-[128px] right-[20%] top-[65%] p-2 bg-zinc-400 border shadow-md rounded z-50">
//                         <img
//                           src={item?.path}
//                           alt={item?.text}
//                           className="w-full h-full min-w-full min-h-full object-contain"
//                           onError={(e) => (e.target.style.display = "none")}
//                         />
//                       </div>
//                     )}
//                   </div>
//                   <Separator className="my-1 bg-zinc-400" />
//                 </React.Fragment>
//               ))}
//             </ScrollArea>
//           )}
//         </CardContent>

//         <CardFooter className="flex justify-end w-full">
//           <div className="flex justify-end gap-2">
//             <Button
//               disabled={
//                 activeLogoBugsCount >= 4 ||
//                 (mutationGraphicsStartStop.isPending && startFlagLogo)||CheckBacup||CkeckServicemain
//               }
//               onClick={handleLogoBugStart}
//             >
//               {mutationGraphicsStartStop.isPending && startFlagLogo ? (
//                 <LoaderCircle className="animate-spin" />
//               ) : (
//                 "  Start"
//               )}
//             </Button>
//             <Button
//               disabled={
//                 activeLogoBugsCount === 0 ||
//                 (mutationGraphicsStartStop.isPending && stopFlag)||CheckBacup||CkeckServicemain
//               }
//               onClick={handleLogoBugStop}
//               variant="destructive"
//             >
//               {mutationGraphicsStartStop.isPending && stopFlag ? (
//                 <LoaderCircle className="animate-spin" />
//               ) : (
//                 "  Stop"
//               )}
//             </Button>
//           </div>
//         </CardFooter>
//       </Card>
//     );
//   }
// );

// export default LogoBugComponents;