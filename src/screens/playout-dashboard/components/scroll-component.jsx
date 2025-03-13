import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { LoaderCircle, Plus } from "lucide-react";
import { CreateScrollDialog } from "./create-scroll-dialog";
import { useApiGetQuery } from "@/utils/helpers/api/apihooks/useApiGetQuery";
import { getScroller } from "@/utils/helpers/api/apiConstant";
import { useToast } from "@/hooks/use-toast";
import { cloneDeep } from "lodash";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useInstance } from "@/components/custom-components/InstanceContext";
import { useConfig } from "@/components/custom-components/ConfigContext";

const ScrollComponent = React.memo(({ mutationGraphicsStartStop, backupServerStatus, mainServerStatus }) => {
  const { 
    getMainConfig, 
    setMainConfigSync, 
    getBackupConfig, 
    setBackupConfigSync 
  } = useConfig();

  const { instanceName, setInstanceName, instanceDataText, setInstanceDataText } = useInstance();
  const { toast } = useToast();
  const [isScrollDialogOpen, setIsScrollDialogOpen] = useState(false);
  const [selectedScroll, setSelectedScroll] = useState(null);
  const [scrollItems, setScrollItems] = useState([]);
  const [startFlag, setStartFlag] = useState(false);
  const [startFlagStop, setStartFlagStop] = useState(false);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  // Use ConfigContext instead of local state
  const ScrollConfig = getMainConfig();
  const backupServicesConfig = getBackupConfig();
  const ScrollActive = useMemo(
    () => ScrollConfig?.Device?.Template?.Tracks?.VideoTracks[0]?.ScrollingTexts || [],
    [ScrollConfig]
  );

  const instanceScrollData = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("instanceName")) || {};
    } catch (error) {
      console.error("Error parsing sessionStorage data:", error);
      return {};
    }
  }, []);

  const { atemeServerId, backupServiceUID, mainServiceUID } = instanceScrollData;
  const serviceUID = mainServiceUID || backupServiceUID;

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

  const {
    data: dataScroll,
    isLoading: isLoadingScroll,
    isError: isErrorScroll,
    error: errorScroll,
    refetch: refetchScroll,
  } = useApiGetQuery({
    key: "fetchscroll",
    endpoint: getScroller,
    params: { atemeServerId, serviceUID },
    options: { enabled: !!atemeServerId, retry: false },
  });

  // Poll sessionStorage for initial config loading if not in context
  useEffect(() => {
    if (!ScrollConfig && !isConfigLoaded) {
      const interval = setInterval(() => {
        const config = sessionStorage.getItem("mainServicesConfig");
        if (config) {
          setMainConfigSync(JSON.parse(config));
          setIsConfigLoaded(true);
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else if (ScrollConfig) {
      setIsConfigLoaded(true);
    }
  }, [ScrollConfig, isConfigLoaded, setMainConfigSync]);

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
    if (dataScroll?.data?.data?.length) {
      setScrollItems(
        dataScroll?.data?.data?.map((item, index) => ({
          id: String(index + 1),
          text: item,
        }))
      );
    }
  }, [dataScroll]);

  const handleScrollClick = useCallback((text) => {
    setSelectedScroll(text);
  }, []);

  const isAnyScrollActive = useMemo(() => {
    return ScrollActive?.some(
      ({ Enabled, Text }) =>
        Enabled && scrollItems.some(({ text }) => text === Text)
    );
  }, [ScrollActive, scrollItems]);

  const isSelectedScrollActive = useMemo(
    () =>
      selectedScroll &&
      ScrollActive?.some(
        ({ Text, Enabled }) => Text === selectedScroll && Enabled
      ),
    [selectedScroll, ScrollActive]
  );

  const handleScrollStart = useCallback(() => {
    if (!selectedScroll) {
      toast({
        title: "Error",
        description: "No scroll selected",
        variant: "destructive",
      });
      return;
    }

    if (isSelectedScrollActive) {
      toast({
        title: "Error",
        description: "Selected scroll is already active",
        variant: "destructive",
      });
      return;
    }

    const updatedConfig = cloneDeep(ScrollConfig);
    let CreateScrollObj = {
      Enabled: true,
      Emulation: false,
      Text: selectedScroll,
      FontFile: "default.ttf",
      TextHeight: 100,
      TextColor: "FFFFFF",
      TextTransparency: 0,
      Speed: 10,
      Direction: "Right to Left",
      Duration: 0,
      BoxHeight: 5,
      BoxWidth: 80,
      BoxColor: "000000",
      BoxTransparency: 100,
      BoxVerticalPosition: 85,
    };

    if (updatedConfig.Device.Template.Tracks.VideoTracks[0].ScrollingTexts?.length === 0) {
      updatedConfig.Device.Template.Tracks.VideoTracks[0].ScrollingTexts = [CreateScrollObj];
    } else {
      updatedConfig.Device.Template.Tracks.VideoTracks[0].ScrollingTexts =
        updatedConfig.Device.Template.Tracks.VideoTracks[0].ScrollingTexts?.map(
          (scroll) => {
            return {
              ...scroll,
              Enabled: true,
              Text: selectedScroll,
              BoxTransparency: 100,
              Direction: "Right to Left",
            };
          }
        );
    }

    let updatedConfigBackup;
    if (backupServicesConfig) {
      updatedConfigBackup = cloneDeep(backupServicesConfig);
      if (updatedConfigBackup.Device.Template.Tracks.VideoTracks[0].ScrollingTexts?.length === 0) {
        updatedConfigBackup.Device.Template.Tracks.VideoTracks[0].ScrollingTexts = [CreateScrollObj];
      } else {
        updatedConfigBackup.Device.Template.Tracks.VideoTracks[0].ScrollingTexts =
          updatedConfigBackup.Device.Template.Tracks.VideoTracks[0].ScrollingTexts?.map(
            (scroll) => {
              return {
                ...scroll,
                Enabled: true,
                Text: selectedScroll,
                BoxTransparency: 100,
                Direction: "Right to Left",
              };
            }
          );
      }
    }

    let payload;
    if (
      mainServiceUIDPayload &&
      mainServerAddressPayload &&
      backupServiceUIDPayload &&
      backupServerAddressPayload &&
      mainServiceToken &&
      selectedScroll &&
      backupServiceToken &&
      updatedConfigBackup
    ) {
      payload = {
        mainServiceUID: mainServiceUIDPayload,
        mainServiceObj: updatedConfig,
        mainServiceAddress: mainServerAddressPayload,
        mainServiceToken: mainServiceToken,
        mainServiceName: mainServiceNamePayload,
        graphicName: selectedScroll,
        graphicType: "scroll",
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
      !backupServiceToken &&
      !backupServerAddressPayload
    ) {
      payload = {
        mainServiceUID: mainServiceUIDPayload,
        mainServiceObj: updatedConfig,
        mainServiceAddress: mainServerAddressPayload,
        mainServiceToken: mainServiceToken,
        mainServiceName: mainServiceNamePayload,
        graphicName: selectedScroll,
        graphicType: "scroll",
        graphicAction: "start",
        isBackupAvailable: false,
      };
    } else {
      console.log("error payload not found");
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
          if (updatedConfigBackup) {
            setBackupConfigSync(updatedConfigBackup);
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
    selectedScroll,
    isSelectedScrollActive,
    ScrollConfig,
    backupServicesConfig,
    toast,
    mutationGraphicsStartStop,
    setMainConfigSync,
    setBackupConfigSync,
  ]);

  const handleScrollStop = useCallback(() => {
    const updatedConfig = cloneDeep(ScrollConfig);
    const scrollText = ScrollActive?.[0]?.Text;
    updatedConfig.Device.Template.Tracks.VideoTracks[0].ScrollingTexts =
      updatedConfig.Device.Template.Tracks.VideoTracks[0].ScrollingTexts?.map(
        (scroll) => {
          return {
            ...scroll,
            Enabled: false,
            Text: scrollText,
          };
        }
      );

    let updatedConfigBackup;
    if (backupServicesConfig) {
      updatedConfigBackup = cloneDeep(backupServicesConfig);
      const scrollTextBackup = ScrollActive?.[0]?.Text;
      updatedConfigBackup.Device.Template.Tracks.VideoTracks[0].ScrollingTexts =
        updatedConfigBackup.Device.Template.Tracks.VideoTracks[0].ScrollingTexts?.map(
          (scroll) => {
            return {
              ...scroll,
              Enabled: false,
              Text: scrollTextBackup,
            };
          }
        );
    }

    let payload;
    if (
      mainServiceUIDPayload &&
      mainServerAddressPayload &&
      backupServiceUIDPayload &&
      backupServerAddressPayload &&
      mainServiceToken &&
      backupServiceToken &&
      updatedConfigBackup
    ) {
      payload = {
        mainServiceUID: mainServiceUIDPayload,
        mainServiceObj: updatedConfig,
        mainServiceAddress: mainServerAddressPayload,
        mainServiceToken: mainServiceToken,
        mainServiceName: mainServiceNamePayload,
        graphicName: scrollText,
        graphicType: "scroll",
        graphicAction: "stop", // Fixed from "start" to "stop"
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
      !backupServiceUIDPayload &&
      !backupServerAddressPayload
    ) {
      payload = {
        mainServiceUID: mainServiceUIDPayload,
        mainServiceObj: updatedConfig,
        mainServiceAddress: mainServerAddressPayload,
        mainServiceToken: mainServiceToken,
        mainServiceName: mainServiceNamePayload,
        graphicName: scrollText,
        graphicType: "scroll",
        graphicAction: "stop", // Fixed from "start" to "stop"
        isBackupAvailable: false,
      };
    } else {
      toast({
        title: "Error",
        description: "Payload creation failed. Please check the conditions.",
        variant: "destructive",
      });
    }

    setStartFlagStop(true);
    mutationGraphicsStartStop.mutate(
      { payload },
      {
        onSuccess: (data) => {
          setMainConfigSync(updatedConfig); // Update context instead of local state
          if (updatedConfigBackup) {
            setBackupConfigSync(updatedConfigBackup);
          }
          setStartFlagStop(false);
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
    isAnyScrollActive,
    mutationGraphicsStartStop,
    ScrollConfig,
    backupServicesConfig,
    toast,
    setMainConfigSync,
    setBackupConfigSync,
  ]);

  const CheckServiceMain = (instanceDataText === "Primary"&& mainServerStatus === false);
  const CheckBackup = (instanceDataText === "Backup" && backupServerStatus === false);

  return (
    <Card className="mt-4 border-0">
      <CardHeader className="py-3 px-4">
        <CardTitle>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <span
                className={`${
                  isAnyScrollActive ? "pulse green-color" : "pulse red-color"
                }`}
              ></span>
              <span>Scroll</span>
            </div>
            <Button
              variant="default"
              size="icon"
              className="rounded-full bg-blue-400 hover:bg-white transition-colors mr-2 h-6 w-6"
              onClick={() => setIsScrollDialogOpen(true)}
              disabled={CheckBackup || CheckServiceMain}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] bg-zinc-700 rounded-md p-2">
          {isLoadingScroll ? (
            <div className="text-white">Loading...</div>
          ) : isErrorScroll ? (
            <div className="text-red-500">
              Error: {errorScroll?.message || "Failed to fetch data"}
            </div>
          ) : scrollItems?.length === 0 ? (
            <div className="text-gray-400 text-center py-4">
              No data available
            </div>
          ) : (
            scrollItems?.map((item) => {
              const maxLength = 45;
              const shouldTruncate = item.text.length > maxLength;
              const truncatedText = shouldTruncate
                ? `${item.text.slice(0, maxLength)}...`
                : item.text;

              return (
                <React.Fragment key={item.id}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`relative py-1 px-2 hover:bg-zinc-600 rounded cursor-pointer font-medium 
                          ${
                            ScrollActive?.some(
                              ({ Text, Enabled }) => Text === item?.text && Enabled
                            )
                              ? "bg-green-500 hover:!bg-green-500 "
                              : selectedScroll === item?.text
                              ? "bg-zinc-600"
                              : ""
                          }`}
                          onClick={() => handleScrollClick(item.text)}
                        >
                          {truncatedText}
                          {selectedScroll === item.text && (
                            <span className="float-left mr-2 text-green-500">
                              ▶
                            </span>
                          )}
                        </div>
                      </TooltipTrigger>
                      {shouldTruncate && (
                        <TooltipContent className="bg-white text-black text-sm font-medium">
                          <p className="max-w-[300px] break-words">
                            {item.text}
                          </p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                  <Separator className="bg-zinc-400" />
                </React.Fragment>
              );
            })
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="flex justify-end w-full">
        <div className="flex justify-end gap-2">
          <Button
            onClick={handleScrollStart}
            disabled={
              isAnyScrollActive || 
              (mutationGraphicsStartStop.isPending && startFlag) || 
              CheckBackup || 
              CheckServiceMain
            }
          >
            {mutationGraphicsStartStop.isPending && startFlag ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              "Start"
            )}
          </Button>
          <Button
            onClick={handleScrollStop}
            variant="destructive"
            disabled={
              !isAnyScrollActive || 
              (mutationGraphicsStartStop.isPending && startFlagStop) || 
              CheckServiceMain || 
              CheckBackup
            }
          >
            {mutationGraphicsStartStop.isPending && startFlagStop ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              "Stop"
            )}
          </Button>
        </div>
      </CardFooter>

      <CreateScrollDialog
        open={isScrollDialogOpen}
        onOpenChange={setIsScrollDialogOpen}
        setScrollItems={setScrollItems}
        initialItems={scrollItems}
        refetchScroll={refetchScroll}
      />
    </Card>
  );
});

export default ScrollComponent;
