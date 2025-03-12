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
import React, { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import CustomLoader from "@/components/custom-components/custom-loader";
import { cloneDeep } from "lodash";
import { postgraphicsSlateStop } from "@/utils/helpers/api/apiConstant";
import { useApiMutation } from "@/utils/helpers/api/apihooks/useApiMutation";
import { LoaderCircle } from "lucide-react";
import { useInstance } from "@/components/custom-components/InstanceContext";
import { useConfig } from "@/components/custom-components/ConfigContext";

const Slates = React.memo(
  ({ slates, isLoading, isError, mutationGraphicsStartStop, backupServerStatus, mainServerStatus }) => {
    const { 
      getMainConfig, 
      setMainConfigSync, 
      getBackupConfig, 
      setBackupConfigSync 
    } = useConfig();

    const { instanceName, setInstanceName, instanceDataText, setInstanceDataText } = useInstance();
    const [selectedSlate, setSelectedSlate] = useState(null);
    const [hoveredSlate, setHoveredSlate] = useState(null);
    const [hoverTimeout, setHoverTimeout] = useState(null);
    const [isConfigLoaded, setIsConfigLoaded] = useState(false);
    const [startFlag, setStartFlag] = useState(false);
    const { toast } = useToast();

    // Use ConfigContext instead of local state
    const SlectConfig = getMainConfig();
    const backupServicesConfig = getBackupConfig();

    const SlatesActive = SlectConfig?.Device?.Template?.GlobalConfiguration?.APIBlackout?.LocalFilename;
    const isBlackoutEnabled = SlectConfig?.GlobalConfiguration?.EnableBlackout;

    const ServerAllData = sessionStorage.getItem("serviceAllData");
    const parsedServerAllData = ServerAllData ? JSON.parse(ServerAllData) : {};
    const mainServiceToken = sessionStorage.getItem("mainTokenData");
    const backupServiceToken = sessionStorage.getItem("backupTokenData");

    const {
      mainServerAddress = "",
      mainServiceName = "",
      mainServiceUID = "",
      backupServiceUID = "",
      backupServiceName = "",
      backupServerAddress = "",
    } = parsedServerAllData ?? {};

    // Poll sessionStorage for initial config loading if not in context
    useEffect(() => {
      if (!SlectConfig && !isConfigLoaded) {
        const interval = setInterval(() => {
          const config = sessionStorage.getItem("mainServicesConfig");
          if (config) {
            setMainConfigSync(JSON.parse(config));
            setIsConfigLoaded(true);
            clearInterval(interval);
          }
        }, 1000);
        return () => clearInterval(interval);
      } else if (SlectConfig) {
        setIsConfigLoaded(true);
      }
    }, [SlectConfig, isConfigLoaded, setMainConfigSync]);

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

    useEffect(() => {
      if (isError) {
        toast({
          title: "Error",
          description: "Failed to fetch slates",
          variant: "destructive",
        });
      }
    }, [isError, toast]);

    const handleSlateClick = useCallback((slate) => {
      setSelectedSlate(slate);
    }, []);

    const handleMouseEnter = useCallback((slate) => {
      const timeout = setTimeout(() => {
        setHoveredSlate(slate.name);
      }, 1000);
      setHoverTimeout(timeout);
    }, []);

    const handleMouseLeave = useCallback(() => {
      clearTimeout(hoverTimeout);
      setHoveredSlate(null);
    }, [hoverTimeout]);

    const mutationGraphicSlateStop = useApiMutation({
      endpoint: `${postgraphicsSlateStop}`,
      method: "POST",
      options: {},
    });

    const handleStart = useCallback(() => {
      if (!selectedSlate) {
        toast({
          title: "Error",
          description: "No slate selected",
          variant: "destructive",
        });
        return;
      }

      const updatedConfig = cloneDeep(SlectConfig);
      updatedConfig.Device.Template.GlobalConfiguration.APIBlackout.LocalFilename = selectedSlate.name;
      updatedConfig.GlobalConfiguration.EnableBlackout = true;

      let updateConfigBackup;
      if (backupServicesConfig) {
        updateConfigBackup = cloneDeep(backupServicesConfig);
        updateConfigBackup.Device.Template.GlobalConfiguration.APIBlackout.LocalFilename = selectedSlate.name;
        updateConfigBackup.GlobalConfiguration.EnableBlackout = true;
      }

      let payload;
      if (
        mainServiceUID &&
        mainServerAddress &&
        backupServiceUID &&
        backupServerAddress &&
        mainServiceToken &&
        selectedSlate &&
        backupServiceToken &&
        updateConfigBackup
      ) {
        payload = {
          mainServiceUID: mainServiceUID,
          mainServiceObj: updatedConfig,
          mainServiceAddress: mainServerAddress,
          mainServiceToken: mainServiceToken,
          mainServiceName: mainServiceName,
          graphicName: selectedSlate?.name,
          graphicType: "slate",
          graphicAction: "start",
          isBackupAvailable: true,
          backupServiceUID: backupServiceUID,
          backupServiceObj: updateConfigBackup,
          backupServiceAddress: backupServerAddress,
          backupServiceToken: backupServiceToken,
          backupServiceName: backupServiceName,
        };
      } else if (mainServiceUID && mainServiceToken && mainServerAddress && !backupServerAddress && !backupServiceUID) {
        payload = {
          mainServiceUID: mainServiceUID,
          mainServiceObj: updatedConfig,
          mainServiceAddress: mainServerAddress,
          mainServiceToken: mainServiceToken,
          mainServiceName: mainServiceName,
          graphicName: selectedSlate?.name,
          graphicType: "slate",
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

      setStartFlag(true);
      mutationGraphicsStartStop.mutate(
        { payload },
        {
          onSuccess: (data) => {
            setMainConfigSync(updatedConfig); // Update context instead of local state
            if (updateConfigBackup) {
              setBackupConfigSync(updateConfigBackup);
            }
            setStartFlag(false);
            const message = data?.data?.message;
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
      selectedSlate,
      SlectConfig,
      backupServicesConfig,
      mutationGraphicsStartStop,
      toast,
      setMainConfigSync,
      setBackupConfigSync,
    ]);

    const handleStop = useCallback(() => {
      if (!isBlackoutEnabled) {
        toast({
          title: "Error",
          description: "Blackout is already disabled",
          variant: "destructive",
        });
        return;
      }

      const updatedConfig = cloneDeep(SlectConfig);
      updatedConfig.GlobalConfiguration.EnableBlackout = false;

      let updatedConfigBackup;
      if (backupServicesConfig) {
        updatedConfigBackup = cloneDeep(backupServicesConfig);
        updatedConfigBackup.GlobalConfiguration.EnableBlackout = false;
      }

      let payload;
      if (
        mainServiceUID &&
        mainServerAddress &&
        backupServiceUID &&
        backupServerAddress &&
        mainServiceToken &&
        backupServiceToken
      ) {
        payload = {
          mainServiceUID: mainServiceUID,
          mainServiceAddress: mainServerAddress,
          mainServiceToken: mainServiceToken,
          mainServiceName: mainServiceName,
          graphicName: SlatesActive,
          isBackupAvailable: true,
          backupServiceUID: backupServiceUID,
          backupServiceAddress: backupServerAddress,
          backupServiceToken: backupServiceToken,
          backupServiceName: backupServiceName,
        };
      } else if (mainServiceUID && mainServerAddress && mainServiceToken && !backupServiceToken && !backupServerAddress) {
        payload = {
          mainServiceUID: mainServiceUID,
          mainServiceAddress: mainServerAddress,
          mainServiceToken: mainServiceToken,
          mainServiceName: mainServiceName,
          graphicName: SlatesActive,
          isBackupAvailable: false,
        };
      } else {
        console.error("Error: Missing main service details!");
        toast({
          title: "Error",
          description: "Payload creation failed. Please check the conditions.",
          variant: "destructive",
        });
      }

      mutationGraphicSlateStop.mutate(
        { payload },
        {
          onSuccess: (data) => {
            setMainConfigSync(updatedConfig); // Update context instead of local state
            if (updatedConfigBackup) {
              setBackupConfigSync(updatedConfigBackup);
            }
            const message = data?.data?.message;
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
      isBlackoutEnabled,
      SlectConfig,
      backupServicesConfig,
      mutationGraphicSlateStop,
      toast,
      setMainConfigSync,
      setBackupConfigSync,
    ]);

    if (!isConfigLoaded) {
      return <div>Loading configuration...</div>;
    }
    const CheckServiceMain = (instanceDataText === "Primary" && mainServerStatus === false);
    const CheckBackup = (instanceDataText === "Backup" && backupServerStatus === false);

    return (
      <div>
        <Card className="mt-4 border-0">
          <CardHeader className="p-4">
            <CardTitle>
              <div className="flex items-center gap-2">
                <span className={`${isBlackoutEnabled && !isError ? "pulse green-color" : "pulse red-color"}`}></span>
                Slates
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <CustomLoader />
            ) : isError ? (
              <div className="text-red-500">
                Error loading slates. Please try again.
              </div>
            ) : (
              <ScrollArea className="h-[200px] bg-zinc-700 rounded-md p-2">
                {slates.map((slate) => (
                  <React.Fragment key={slate.name}>
                    <div
                      className={`relative py-1 px-2 hover:bg-zinc-600 rounded cursor-pointer font-medium ${
                        SlatesActive === slate?.name && isBlackoutEnabled
                          ? "bg-green-500 hover:!bg-green-500"
                          : selectedSlate?.name === slate.name
                          ? "bg-zinc-600"
                          : ""
                      }`}
                      onClick={() => handleSlateClick(slate)}
                      onMouseEnter={() => handleMouseEnter(slate)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {slate.name}
                      {selectedSlate?.name === slate.name && (
                        <span className="float-left mr-2 text-green-500">
                          ▶
                        </span>
                      )}
                      {hoveredSlate === slate.name && (
                        <div className="fixed max-w-[128px] max-h-[128px] left-[20%] top-[65%] p-2 bg-zinc-400 border shadow-md rounded z-50">
                          <img
                            src={slate.path}
                            alt={slate.name}
                            className="w-100 h-100 object-contain"
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
                onClick={handleStart}
                disabled={isBlackoutEnabled || startFlag || CheckBackup || CheckServiceMain}
              >
                {mutationGraphicsStartStop.isPending && startFlag ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  "Start"
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={handleStop}
                disabled={!isBlackoutEnabled || mutationGraphicSlateStop.isPending || CheckBackup || CheckServiceMain}
              >
                {mutationGraphicSlateStop.isPending ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  "Stop"
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }
);

export default Slates;
