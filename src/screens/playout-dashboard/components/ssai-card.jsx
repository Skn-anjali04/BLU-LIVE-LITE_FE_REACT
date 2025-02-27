import { useState, useEffect } from "react";
import { useFormik } from "formik";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApiMutation } from "@/utils/helpers/api/apihooks/useApiMutation";
import {
  getScteData,
  postcuein,
  postcueqout,
} from "@/utils/helpers/api/apiConstant";
import { toast } from "@/hooks/use-toast";
import { useApiGetQuery } from "@/utils/helpers/api/apihooks/useApiGetQuery";
import { LoaderCircle } from "lucide-react";
import { useInstance } from "@/components/custom-components/InstanceContext";
import { useConfig } from "@/components/custom-components/ConfigContext";

const SSaiCard = ({ backupServerStatus, mainServerStatus }) => {
  const { getMainConfig, getBackupConfig } = useConfig();
  const { instanceName, setInstanceName, instanceDataText, setInstanceDataText } = useInstance();
  
  const [remainingTime, setRemainingTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [cueInFlag, setCueInFlag] = useState(false);
  const [ssaiData, setSsaiData] = useState({
    mainacquisitionId: "",
    mainlisteningPort: "",
    backupacquisitionId: "",
    backuplisteningPort: "",
  });

  const getServiceAllData = JSON.parse(sessionStorage.getItem("serviceAllData"));

  const mutationCueOut = useApiMutation({
    endpoint: `${postcueqout}`,
    method: "POST",
    options: {
      onSuccess: (data) => {
        if (formik.values.duration > 0) {
          const now = Date.now();
          setStartTime(now);
          setRemainingTime(parseInt(formik.values.duration, 10));
          setIsRunning(true);

          localStorage.setItem("ssaiDuration", formik.values.duration.toString());
          localStorage.setItem("ssaiStartTime", now.toString());
          localStorage.setItem("repeatInterval", formik.values.repeatInterval.toString());
          localStorage.setItem("autoSCTE", formik.values.autoSCTE.toString());
          localStorage.setItem("cueouttype", "true");
          setCueInFlag(false);
        }
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message;
        toast({
          title: "Cue Out Failed",
          description: errorMessage || "Something went wrong.",
          variant: "destructive",
        });
      },
    },
  });

  const mutationCueIN = useApiMutation({
    endpoint: `${postcuein}`,
    method: "POST",
    options: {
      onSuccess: (data) => {
        localStorage.setItem("cueouttype", "false");
        setCueInFlag(true);
        localStorage.removeItem("ssaiDuration");
        localStorage.removeItem("ssaiStartTime");
        localStorage.removeItem("ssaiEndTime");
        localStorage.removeItem("repeatInterval");
        localStorage.removeItem("autoSCTE");
        setCueInFlag(false);
        clearInterval(intervalId);
        setIntervalId(null);
        setIsRunning(false);
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message;
        toast({
          title: "Cue In Failed",
          description: errorMessage || "Something went wrong.",
          variant: "destructive",
        });
      },
    },
  });

  // Fetch config data from ConfigContext
  useEffect(() => {
    const fetchConfigData = () => {
      const mainConfig = getMainConfig();
      const backupConfig = getBackupConfig();

      if (mainConfig) {
        const acquisitionId =
          mainConfig?.Device?.Template?.Tracks?.DataTracks[0]?.Encoding.Scte35?.ESAM?.AcquisitionPointId || "";
        const listeningPort =
          mainConfig?.Device?.Template?.Tracks?.DataTracks[0]?.Encoding.Scte35?.ESAM?.ListeningPort || "";

        setSsaiData((prevData) => ({
          ...prevData,
          mainacquisitionId: acquisitionId,
          mainlisteningPort: listeningPort,
        }));
      } else {
        // Fallback to sessionStorage if context is not yet loaded
        const config = sessionStorage.getItem("mainServicesConfig");
        if (config) {
          const parsedConfig = JSON.parse(config);
          const acquisitionId =
            parsedConfig?.Device?.Template?.Tracks?.DataTracks[0]?.Encoding.Scte35?.ESAM?.AcquisitionPointId || "";
          const listeningPort =
            parsedConfig?.Device?.Template?.Tracks?.DataTracks[0]?.Encoding.Scte35?.ESAM?.ListeningPort || "";

          setSsaiData((prevData) => ({
            ...prevData,
            mainacquisitionId: acquisitionId,
            mainlisteningPort: listeningPort,
          }));
        }
      }

      if (backupConfig) {
        const backupAcquisitionId =
          backupConfig?.Device?.Template?.Tracks?.DataTracks[0]?.Encoding.Scte35?.ESAM?.AcquisitionPointId || "";
        const backupListeningPort =
          backupConfig?.Device?.Template?.Tracks?.DataTracks[0]?.Encoding.Scte35?.ESAM?.ListeningPort || "";

        setSsaiData((prevData) => ({
          ...prevData,
          backupacquisitionId: backupAcquisitionId,
          backuplisteningPort: backupListeningPort,
        }));
      } else {
        // Fallback to sessionStorage if context is not yet loaded
        const configbck = sessionStorage.getItem("backupServicesConfig");
        if (configbck) {
          const parsedConfigbck = JSON.parse(configbck);
          const backupAcquisitionId =
            parsedConfigbck?.Device?.Template?.Tracks?.DataTracks[0]?.Encoding.Scte35?.ESAM?.AcquisitionPointId || "";
          const backupListeningPort =
            parsedConfigbck?.Device?.Template?.Tracks?.DataTracks[0]?.Encoding.Scte35?.ESAM?.ListeningPort || "";

          setSsaiData((prevData) => ({
            ...prevData,
            backupacquisitionId: backupAcquisitionId,
            backuplisteningPort: backupListeningPort,
          }));
        }
      }
    };

    // Initial fetch
    fetchConfigData();

    // Polling logic
    const interval = setInterval(() => {
      fetchConfigData();
    }, 1000); // Check every second

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [getMainConfig, getBackupConfig]);

  useEffect(() => {
    if (ssaiData.mainacquisitionId) {
      formik.setValues((prev) => ({
        ...prev,
        acquisitionId: ssaiData.mainacquisitionId,
      }));
    }
  }, [ssaiData]);

  const formik = useFormik({
    initialValues: {
      enableReinitialize: true,
      ssaiType: "Splice Signaling",
      upid: "",
      duration: "",
      acquisitionId: ssaiData?.mainacquisitionId || "",
      repeatInterval: "",
      autoSCTE: false,
    },
    validate: (values) => {
      const errors = {};
      if (!values.duration) {
        errors.duration = "Duration is required";
      } else if (isNaN(values.duration) || values.duration <= 0) {
        errors.duration = "Duration must be a positive number";
      }
      if (!values.acquisitionId) {
        errors.acquisitionId = "Acquisition ID is required";
      }
      if (
        values.repeatInterval &&
        (isNaN(values.repeatInterval) || values.repeatInterval <= 0)
      ) {
        errors.repeatInterval = "Repeat interval must be a positive number";
      }
      return errors;
    },
    onSubmit: (values) => {},
  });

  const spliceData = formik.values.ssaiType === "Splice Signaling" ? "splice" : "time";

  const {
    data: SctyNewData,
    isLoading: isLoadingSctyNew,
    refetch: refetchSctyNew,
    isError: isErrorSctyNew,
    error: errorSctyNew,
  } = useApiGetQuery({
    key: ["SctyNew"],
    endpoint: getScteData,
    params: {
      serverAddress: getServiceAllData?.mainServerAddress,
      serviceName: getServiceAllData?.mainServiceName,
      serviceUID: getServiceAllData?.mainServiceUID,
      SCTEType: spliceData,
    },
    options: {
      staleTime: 0,
      cacheTime: 0,
      retry: false,
      refetchOnMount: true,
      enabled: !!(
        getServiceAllData?.mainServerAddress &&
        getServiceAllData?.mainServiceName &&
        getServiceAllData?.mainServiceUID &&
        spliceData
      ),
    },
  });

  useEffect(() => {
    const data = SctyNewData?.data?.data;

    if (data && Object.keys(data).length === 0) {
      localStorage.removeItem("ssaiDuration");
      localStorage.removeItem("ssaiStartTime");
      localStorage.removeItem("ssaiEndTime");
      localStorage.removeItem("cueouttype");
      return;
    }
    if (data) {
      const { duration, startDateTime, endDateTime } = data;

      formik.setFieldValue("duration", duration?.toString());

      if (startDateTime && endDateTime) {
        const end = new Date(endDateTime).getTime();
        const now = Date.now();
        const startTimeConverted = new Date(startDateTime).getTime();

        if (now < end) {
          const remaining = Math.floor((end - now) / 1000);
          setRemainingTime(remaining);
          setIsRunning(true);

          localStorage.setItem("ssaiDuration", duration.toString());
          localStorage.setItem("ssaiStartTime", startTimeConverted.toString());
          localStorage.setItem("ssaiEndTime", end.toString());
        }
      }
    }
  }, [SctyNewData]);

  useEffect(() => {
    const savedDuration = localStorage.getItem("ssaiDuration");
    const savedStartTime = localStorage.getItem("ssaiStartTime");
    const savedRepeatInterval = localStorage.getItem("repeatInterval");
    const savedAutoSCTE = localStorage.getItem("autoSCTE");

    if (savedDuration && savedStartTime) {
      const parsedDuration = parseInt(savedDuration, 10);
      const parsedStartTime = parseInt(savedStartTime, 10);
      const parsedRepeatInterval = savedRepeatInterval ? parseInt(savedRepeatInterval, 10) : "";
      const parsedAutoSCTE = savedAutoSCTE === "true";

      if (!isNaN(parsedDuration) && !isNaN(parsedStartTime)) {
        const now = Date.now();
        const elapsedTime = Math.floor((now - parsedStartTime) / 1000);
        const updatedRemainingTime = Math.max(parsedDuration - elapsedTime, 0);

        setRemainingTime(updatedRemainingTime);
        setIsRunning(updatedRemainingTime > 0);
        setStartTime(parsedStartTime);

        formik.setFieldValue("duration", parsedDuration.toString());
        formik.setFieldValue("repeatInterval", parsedRepeatInterval);
        formik.setFieldValue("autoSCTE", parsedAutoSCTE);

        if (updatedRemainingTime <= 0) {
          localStorage.removeItem("ssaiDuration");
          localStorage.removeItem("ssaiStartTime");
        }
      }
    }
  }, [SctyNewData]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isRunning && remainingTime > 0) {
        localStorage.setItem("ssaiDuration", formik.values.duration.toString());
        localStorage.setItem("ssaiStartTime", startTime.toString());
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isRunning, remainingTime, startTime]);

  useEffect(() => {
    let interval;

    if (isRunning && remainingTime > 0) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsedTime = Math.floor((now - startTime) / 1000);
        const updatedRemainingTime = Math.max(parseInt(formik.values.duration, 10) - elapsedTime, 0);
        if (!formik.values.autoSCTE) {
          if (updatedRemainingTime > 0) {
            localStorage.setItem("cueouttype", "true");
          } else {
            localStorage.setItem("cueouttype", "false");
          }
        }
        setRemainingTime(updatedRemainingTime);
        if (updatedRemainingTime <= 0) {
          clearInterval(interval);
          setIsRunning(false);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, remainingTime, startTime]);

  let cueOutFlag = localStorage.getItem("cueouttype");
  useEffect(() => {
    if (
      !mutationCueOut.isPending &&
      cueOutFlag &&
      remainingTime === 0 &&
      formik.values.autoSCTE &&
      formik.values.repeatInterval > 0
    ) {
      const id = setTimeout(() => {
        handleCueOut();
      }, formik.values.repeatInterval * 1000);
      setIntervalId(id);
      return () => clearTimeout(id);
    }
  }, [remainingTime, formik.values.autoSCTE]);

  const handleCueOut = async () => {
    const errors = await formik.validateForm();
    if (mainServerStatus === false) {
      toast({
        title: "Error",
        description: "Service is stopped",
        variant: "destructive",
      });
      return;
    }

    if (Object.keys(errors).length > 0) {
      formik.setTouched({
        duration: true,
        acquisitionId: true,
      });
      toast({
        title: "Error",
        description: "Main Service: Acquisition ID or Listening Port is missing!",
        variant: "destructive",
      });
      return;
    }

    const checkMainBackup =
      ssaiData.mainacquisitionId &&
      ssaiData.backupacquisitionId &&
      formik.values.duration &&
      getServiceAllData &&
      ssaiData;
    const checkMain =
      ssaiData.mainacquisitionId &&
      formik.values.duration &&
      getServiceAllData &&
      ssaiData;

    let payload;
    if (checkMainBackup) {
      payload = {
        signallingType: spliceData,
        mainDuration: `${formik.values?.duration}`,
        mainAcquisitionId: formik.values.acquisitionId,
        mainServiceName: getServiceAllData.mainServiceName,
        mainServiceUID: getServiceAllData.mainServiceUID,
        mainServiceAddress: getServiceAllData.mainServerAddress,
        mainServicePort: `${ssaiData.mainlisteningPort}`,
        isBackupAvailable: true,
        backupDuration: `${formik.values?.duration}`,
        backupAcquisitionId: ssaiData.backupacquisitionId,
        backupServiceName: getServiceAllData.backupServiceName,
        backupServiceUID: getServiceAllData.backupServiceUID,
        backupServiceAddress: getServiceAllData.backupServerAddress,
        backupServicePort: `${ssaiData.backuplisteningPort}`,
      };
    } else if (checkMain) {
      payload = {
        signallingType: spliceData,
        mainDuration: `${formik.values?.duration}`,
        mainAcquisitionId: formik.values.acquisitionId,
        mainServiceName: getServiceAllData.mainServiceName,
        mainServiceUID: getServiceAllData.mainServiceUID,
        mainServiceAddress: getServiceAllData.mainServerAddress,
        mainServicePort: `${ssaiData.mainlisteningPort}`,
        isBackupAvailable: false,
      };
    }

    if (payload) {
      try {
        mutationCueOut.mutate({ payload });
      } catch (error) {
        toast({
          title: "Error",
          description: "Payload creation failed. Please check the conditions.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Error",
        description: "Payload creation failed. Please check the conditions.",
        variant: "destructive",
      });
    }
  };

  const handleCueIn = () => {
    if (mainServerStatus === false) {
      toast({
        title: "Error",
        description: "Service is stopped",
        variant: "destructive",
      });
      return;
    }

    const checkMainBackup =
      ssaiData.mainacquisitionId &&
      ssaiData.backupacquisitionId &&
      getServiceAllData &&
      ssaiData;
    const checkMain =
      ssaiData.mainacquisitionId && getServiceAllData && ssaiData;

    let payload;
    if (checkMainBackup) {
      payload = {
        signallingType: spliceData,
        mainAcquisitionId: formik.values.acquisitionId,
        mainServiceName: getServiceAllData.mainServiceName,
        mainServiceUID: getServiceAllData.mainServiceUID,
        mainServiceAddress: getServiceAllData.mainServerAddress,
        mainServicePort: `${ssaiData.mainlisteningPort}`,
        isBackupAvailable: true,
        backupAcquisitionId: ssaiData.backupacquisitionId,
        backupServiceName: getServiceAllData.backupServiceName,
        backupServiceUID: getServiceAllData.backupServiceUID,
        backupServiceAddress: getServiceAllData.backupServerAddress,
        backupServicePort: `${ssaiData.backuplisteningPort}`,
      };
    } else if (checkMain) {
      payload = {
        signallingType: spliceData,
        mainAcquisitionId: formik.values.acquisitionId,
        mainServiceName: getServiceAllData.mainServiceName,
        mainServiceUID: getServiceAllData.mainServiceUID,
        mainServiceAddress: getServiceAllData.mainServerAddress,
        mainServicePort: `${ssaiData.mainlisteningPort}`,
        isBackupAvailable: false,
      };
    }

    if (payload) {
      mutationCueIN.mutate({ payload });
    } else {
      toast({
        title: "Error",
        description: "Payload creation failed. Please check the conditions.",
        variant: "destructive",
      });
    }
  };
// console.log(instanceDataText,"mainServerStatus",mainServerStatus)
  const CheckServiceMain = (instanceDataText === "Primary" && mainServerStatus === false);
  const CheckBackup = (instanceDataText === "Backup" && backupServerStatus === false);
// console.log(CheckBackup,CheckServiceMain,"c..........")
  return (
    <Card className="border-0">
      <CardHeader className="border-b-2 border-zinc-700 p-4">
        <CardTitle>SSAI</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            formik.handleSubmit(e);
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="col-span-2">
              <div className="space-y-1">
                <Label>SSAI Type</Label>
                <Select
                  name="ssaiType"
                  value={formik.values.ssaiType}
                  onValueChange={(value) => formik.setFieldValue("ssaiType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#3A3A3A] border-0 text-white hover:bg-[#444444]">
                    <SelectItem value="Splice Signaling">Splice Signaling</SelectItem>
                    <SelectItem value="Time Signaling">Time Signaling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="space-y-2">
                  <Label>Durations Sec.</Label>
                  <Input
                    name="duration"
                    type="number"
                    value={formik.values.duration}
                    onChange={formik.handleChange}
                    disabled={formik.values.autoSCTE}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.duration && formik.errors.duration ? (
                    <div className="text-red-500 text-sm">{formik.errors.duration}</div>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Acquisition ID</Label>
                  <Input
                    name="acquisitionId"
                    value={formik?.values?.acquisitionId}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={true}
                  />
                  {formik.touched.acquisitionId && formik.errors.acquisitionId ? (
                    <div className="text-red-500 text-sm">{formik.errors.acquisitionId}</div>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="space-y-2">
                  <Label>Repeat Interval Sec.</Label>
                  <Input
                    name="repeatInterval"
                    type="number"
                    value={formik.values.repeatInterval}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={!formik.values.autoSCTE}
                  />
                  {formik.touched.repeatInterval && formik.errors.repeatInterval ? (
                    <div className="text-red-500 text-sm">{formik.errors.repeatInterval}</div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <Checkbox
                    name="autoSCTE"
                    checked={formik.values.autoSCTE}
                    onCheckedChange={(checked) => {
                      formik.setFieldValue("autoSCTE", checked);
                      if (!checked) {
                        formik.setFieldValue("repeatInterval", "");
                      }
                    }}
                  />
                  <Label>Auto SCTE</Label>
                </div>
              </div>
            </div>
            <div className="col-span-1 h-full flex flex-col justify-center">
              <Card className="border-0 shadow-lg bg-zinc-800">
                <CardHeader>
                  <CardTitle className="text-center">Live Sec.</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 flex justify-center items-center">
                  <h1 className="text-6xl font-mono text-red-400">{remainingTime}</h1>
                </CardContent>
              </Card>
            </div>
          </div>
          <CardFooter className="border-t-2 border-zinc-700 p-0 pt-3 flex align-middle justify-end w-full">
            <div className="flex justify-end gap-2">
              <Button
                variant="destructive"
                type="submit"
                onClick={handleCueOut}
                disabled={
                  CheckBackup || CheckServiceMain ||
                  mutationCueOut.isPending ||
                  (cueInFlag === false ? formik.values.duration <= 0 : formik.values.duration >= 0 && remainingTime !== 0) ||
                  cueOutFlag === "true" ||
                  (formik.values.autoSCTE && cueOutFlag === "true" && remainingTime !== 0 && formik.values.repeatInterval !== 0)
                }
              >
                {mutationCueOut.isPending ? <LoaderCircle className="animate-spin" /> : "Cue Out"}
              </Button>
              <Button
                type="submit"
                disabled={
                  CheckBackup || CheckServiceMain ||
                  mutationCueIN.isPending ||
                  cueOutFlag !== "true" || 
                  cueInFlag === "true" || 
                  (mainServerStatus !== null && mainServerStatus === false)
                }
                onClick={handleCueIn}
              >
                {mutationCueIN.isPending ? <LoaderCircle className="animate-spin" /> : "Cue In"}
              </Button>
            </div>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
};

export default SSaiCard;
// import { useState, useEffect } from "react";
// import { useFormik } from "formik";
// import {
//   Card,
//   CardContent,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Checkbox } from "@/components/ui/checkbox";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { useApiMutation } from "@/utils/helpers/api/apihooks/useApiMutation";
// import {
//   getScteData,
//   postcuein,
//   postcueqout,
// } from "@/utils/helpers/api/apiConstant";
// import { toast } from "@/hooks/use-toast";
// import { useApiGetQuery } from "@/utils/helpers/api/apihooks/useApiGetQuery";
// import { LoaderCircle } from "lucide-react";
// import { useInstance } from "@/components/custom-components/InstanceContext";

// const SSaiCard = ({backupServerStatus,mainServerStatus}) => {
//   const { intanceName, setIntanceName, intanceDataText, setIntanceDataText } = useInstance();
//   const [remainingTime, setRemainingTime] = useState(0); // Remaining time in seconds
//   const [isRunning, setIsRunning] = useState(false); // Timer running state
//   const [intervalId, setIntervalId] = useState(null); // Interval ID for repeat logic
//   const [startTime, setStartTime] = useState(null);
//   const [cueInFlag, setCueInFlag] = useState(false) // Track when the timer started
//   const [ssaiData, setSsaiData] = useState({
//     mainacquisitionId: "",
//     mainlisteningPort: "",
//     backupacquisitionId: "",
//     backuplisteningPort: "",
//   });
//   const getServiceAllData = JSON.parse(
//     sessionStorage.getItem("serviceAllData")
//   );

//   const mutationCueOut = useApiMutation({
//     endpoint: `${postcueqout}`,
//     method: "POST",
//     options: {
//     //   networkMode: 'always', // Ensure the mutation runs regardless of network status
//     // retry: false,
//       onSuccess: (data) => {
//         // console.log("SUCESS CUE OUT",data)
//         if (formik.values.duration > 0) {
//           const now = Date.now();
//           setStartTime(now);
//           setRemainingTime(parseInt(formik.values.duration, 10));
//           setIsRunning(true);
  
//           // Store values in localStorage
         
//           localStorage.setItem("ssaiDuration", formik.values.duration.toString());
//           localStorage.setItem("ssaiStartTime", now.toString());
//           localStorage.setItem(
//             "repeatInterval",
//             formik.values.repeatInterval.toString()
//           );
//           localStorage.setItem("autoSCTE", formik.values.autoSCTE.toString());
//           localStorage.setItem("cueouttype", "true");
//           setCueInFlag(false)
//         }
//       },
//       onError: (error) => {
//         // console.log(error,"Timeout for requests")
//         const errorMessage = error.response?.data?.message;
//         toast({
//           title: "cued out Faild",
//           description: errorMessage ||"Something went wrong.",
//           variant: "destructive",
//         });
//       },
//     },
//   });
//   const mutationCueIN = useApiMutation({
//     endpoint: `${postcuein}`,
//     method: "POST",
//     options: {
//       onSuccess: (data) => {
//         // localStorage.clear();
//         localStorage.setItem("cueouttype", "false");
//         setCueInFlag(true)
//         // Reset cueOutFlag to disable Cue In
//         localStorage.removeItem("ssaiDuration");
//         localStorage.removeItem("ssaiStartTime");
//         localStorage.removeItem("ssaiEndTime");
//         localStorage.removeItem("repeatInterval");
//         localStorage.removeItem("autoSCTE");
//         setCueInFlag(false)
//         clearInterval(intervalId);
//         setIntervalId(null);
    
//         // setRemainingTime(0);
//         setIsRunning(false);
//       },
//       onError: (error) => {
//         const errorMessage = error.response?.data?.message;
//         toast({
//           title: "cue in faild",
//           description: errorMessage ||"Something went wrong.",
//           variant: "destructive",
//         });
//       },
//     },
//   });

//   useEffect(() => {
//     const fetchConfigData = () => {
//       const config = sessionStorage.getItem("mainServicesConfig");
//       const configbck = sessionStorage.getItem("backupServicesConfig");
//       if (config) {
//         const parsedConfig = JSON.parse(config);
//         const acquisitionId =
//           parsedConfig?.Device?.Template?.Tracks?.DataTracks[0]?.Encoding.Scte35
//             ?.ESAM?.AcquisitionPointId || "";
//         const listeningPort =
//           parsedConfig?.Device?.Template?.Tracks?.DataTracks[0]?.Encoding.Scte35
//             ?.ESAM?.ListeningPort || "";

//         setSsaiData((prevData) => ({
//           ...prevData,
//           mainacquisitionId: acquisitionId,
//           mainlisteningPort: listeningPort,
//         }));
//       }

//       if (configbck) {
//         const parsedConfigbck = JSON.parse(configbck);
//         const backupAcquisitionId =
//           parsedConfigbck?.Device?.Template?.Tracks?.DataTracks[0]?.Encoding
//             .Scte35?.ESAM?.AcquisitionPointId || "";
//         const backupListeningPort =
//           parsedConfigbck?.Device?.Template?.Tracks?.DataTracks[0]?.Encoding
//             .Scte35?.ESAM?.ListeningPort || "";

//         setSsaiData((prevData) => ({
//           ...prevData,
//           backupacquisitionId: backupAcquisitionId,
//           backuplisteningPort: backupListeningPort,
//         }));
//       }
//     };

//     // Polling logic
//     const interval = setInterval(() => {
//       fetchConfigData();
//     }, 1000); // Check every second

//     // Cleanup interval on unmount
//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     if (ssaiData.mainacquisitionId) {
//       formik.setValues((prev) => ({
//         ...prev,
//         acquisitionId: ssaiData.mainacquisitionId,
//       }));
//     }
//   }, [ssaiData]);

//   const formik = useFormik({
//     initialValues: {
//       enableReinitialize: true,
//       ssaiType: "Splice Signaling",
//       upid: "",
//       duration: "",
//       acquisitionId: ssaiData?.mainacquisitionId || "",
//       repeatInterval: "",
//       autoSCTE: false,
//     },
//     validate: (values) => {
//       const errors = {};
//       if (!values.duration) {
//         errors.duration = "Duration is required";
//       } else if (isNaN(values.duration) || values.duration <= 0) {
//         errors.duration = "Duration must be a positive number";
//       }
//       if (!values.acquisitionId) {
//         errors.acquisitionId = "acquisitionId is required";
//       }
//       if (
//         values.repeatInterval &&
//         (isNaN(values.repeatInterval) || values.repeatInterval <= 0)
//       ) {
//         errors.repeatInterval = "Repeat interval must be a positive number";
//       }
//       return errors;
//     },

//     onSubmit: (values) => {
//     },
//   });
//   const spliceData =
//     formik.values.ssaiType === "Splice Signaling" ? "splice" : "time";
//   const {
//     data: SctyNewData,
//     isLoading: isLoadingSctyNew,
//     refetch: refetchSctyNew,
//     isError: isErrorSctyNew,
//     error: errorSctyNew,
//   } = useApiGetQuery({
//     key: ["SctyNew"],
//     endpoint: getScteData,
//     params: {
//       serverAddress: getServiceAllData?.mainServerAddress,
//       serviceName: getServiceAllData?.mainServiceName,
//       serviceUID: getServiceAllData?.mainServiceUID,
//       SCTEType: spliceData,
//     },
//     options: {
//       staleTime: 0,
//       cacheTime: 0,
//       retry: false,
//       // placeholderData: [], // Show empty data while loading
//       refetchOnMount: true, // Always fetch fresh data on mount
//       enabled: !!(
//         getServiceAllData?.mainServerAddress &&
//         getServiceAllData?.mainServiceName &&
//         getServiceAllData?.mainServiceUID &&
//         spliceData
//       ),
//     },
//   });

//   useEffect(() => {
//     const data = SctyNewData?.data?.data;

//     // Check if data is an empty object
//     if (data && Object.keys(data).length === 0) {
//       // Clear localStorage if the data is an empty object
//       localStorage.removeItem("ssaiDuration");
//       localStorage.removeItem("ssaiStartTime");
//       localStorage.removeItem("ssaiEndTime");
//       localStorage.removeItem("cueouttype");
//       return; // Exit early if data is empty
//     }
//     if (data) {
//       const { duration, startDateTime, endDateTime } = data;

//       // Update form values
//       // formik.setFieldValue("ssaiType", value)
//       formik.setFieldValue("duration", duration?.toString());

//       // Calculate remaining time from API response
//       if (startDateTime && endDateTime) {
//         const end = new Date(endDateTime).getTime();
//         const now = Date.now(); // Current time

//         // Convert startDateTime to time format in milliseconds
//         const startTimeConverted = new Date(startDateTime).getTime();

//         if (now < end) {
//           const remaining = Math.floor((end - now) / 1000);
//           setRemainingTime(remaining);
//           setIsRunning(true);

//           // Store the values in localStorage
//           localStorage.setItem("ssaiDuration", duration.toString());
//           localStorage.setItem("ssaiStartTime", startTimeConverted.toString()); // store as converted timestamp
//           localStorage.setItem("ssaiEndTime", end.toString());
//         }
//       }
//     }
//   }, [SctyNewData]);

//   useEffect(() => {
//     const savedDuration = localStorage.getItem("ssaiDuration");
//     const savedStartTime = localStorage.getItem("ssaiStartTime");
//     const savedRepeatInterval = localStorage.getItem("repeatInterval");
//     const savedAutoSCTE = localStorage.getItem("autoSCTE");

//     if (savedDuration && savedStartTime) {
//       const parsedDuration = parseInt(savedDuration, 10);
//       const parsedStartTime = parseInt(savedStartTime, 10);
//       const parsedRepeatInterval = savedRepeatInterval
//         ? parseInt(savedRepeatInterval, 10)
//         : "";
//       const parsedAutoSCTE = savedAutoSCTE === "true"; // Convert string back to boolean
//       // console.log(parsedStartTime, "parsedStartTime", parsedDuration);
//       if (!isNaN(parsedDuration) && !isNaN(parsedStartTime)) {
//         const now = Date.now();
//         const elapsedTime = Math.floor((now - parsedStartTime) / 1000);
//         const updatedRemainingTime = Math.max(parsedDuration - elapsedTime, 0);

//         setRemainingTime(updatedRemainingTime);
//         setIsRunning(updatedRemainingTime > 0);
//         setStartTime(parsedStartTime);

//         formik.setFieldValue("duration", parsedDuration.toString());
//         formik.setFieldValue("repeatInterval", parsedRepeatInterval);
//         formik.setFieldValue("autoSCTE", parsedAutoSCTE);

//         if (updatedRemainingTime <= 0) {
//           localStorage.removeItem("ssaiDuration");
//           localStorage.removeItem("ssaiStartTime");
//         }
//       } else {
//         localStorage.removeItem("ssaiDuration");
//         localStorage.removeItem("ssaiStartTime");
//       }
//     }
//   }, [SctyNewData]);

//   // Save timer state to localStorage before page refresh or logout
//   useEffect(() => {
//     const handleBeforeUnload = () => {
//       if (isRunning && remainingTime > 0) {
//         localStorage.setItem("ssaiDuration", formik.values.duration.toString());
//         // console.log(
//         //   startTime,
//         //   "startTimestartTimestartTimestartTimestartTimestartTimestartTime"
//         // );
//         localStorage.setItem("ssaiStartTime", startTime.toString());
//       }
//     };
//     window.addEventListener("beforeunload", handleBeforeUnload);
//     return () => {
//       window.removeEventListener("beforeunload", handleBeforeUnload);
//     };
//   }, [isRunning, remainingTime, startTime]);

//   // Update the timer every second
//   useEffect(() => {
//     let interval;

//     if (isRunning && remainingTime > 0) {
//       interval = setInterval(() => {
//         const now = Date.now();
//         const elapsedTime = Math.floor((now - startTime) / 1000);
//         const updatedRemainingTime = Math.max(
//           parseInt(formik.values.duration, 10) - elapsedTime,
//           0
//         );
//         if(!formik.values.autoSCTE){
//        if(updatedRemainingTime>0){
//           localStorage.setItem("cueouttype", "true");
//         }
//         else{
//           localStorage.setItem("cueouttype", "false");
//         }}
//         setRemainingTime(updatedRemainingTime);
//         if (updatedRemainingTime <= 0) {
//           clearInterval(interval);
//           setIsRunning(false);
//         }
//       }, 1000);
//     }

//     return () => clearInterval(interval);
//   }, [isRunning, remainingTime, startTime]);

//   // Handle repeat interval logic
//   let cueOutFlag  = localStorage.getItem("cueouttype");
//   useEffect(() => {
// // console.log(formik.values.repeatInterval,"formik.values.repeatInterval > 0")
//     if (!mutationCueOut.isPending&&
//       cueOutFlag  &&
//       remainingTime === 0 &&
//       formik.values.autoSCTE &&
//       formik.values.repeatInterval > 0
//     ) {
//       const id = setTimeout(() => {
//         handleCueOut();
//       }, formik.values.repeatInterval * 1000);
//       setIntervalId(id);
//       return () => clearTimeout(id);
//     }
//   }, [remainingTime, formik.values.autoSCTE]);

//   const handleCueOut = async () => {
   
//     const errors = await formik.validateForm();
//     if (mainServerStatus===false) {
//       toast({
//         title: "Error",
//         description: "Servervic is stoped",
//         variant: "destructive",
//       });
//       return;
//     }
//     // console.log(errors, "formik error");
   
//     if (Object.keys(errors).length > 0) {
//       formik.setTouched({
//         duration: true,
//         acquisitionId: true,
//       });
//       toast({
//         title: "Error",
//         description:
//           "Main Service: Acquisition ID or Listening Port is missing!",
//         variant: "destructive",
//       });
//       return;
//     }

//     const checkMainBackup =
//       ssaiData.mainacquisitionId &&
//       ssaiData.backupacquisitionId &&
//       formik.values.duration &&
//       getServiceAllData &&
//       ssaiData;

//     const checkMain =
//       ssaiData.mainacquisitionId &&
//       formik.values.duration &&
//       getServiceAllData &&
//       ssaiData;
//     let payload;
//     if (checkMainBackup) {
//       payload = {
//         signallingType: spliceData,
//         mainDuration: `${formik.values?.duration}`,
//         mainAcquisitionId: formik.values.acquisitionId,
//         mainServiceName: getServiceAllData.mainServiceName,
//         mainServiceUID: getServiceAllData.mainServiceUID,
//         mainServiceAddress: getServiceAllData.mainServerAddress,
//         mainServicePort: `${ssaiData.mainlisteningPort}`,
//         isBackupAvailable: true,
//         backupDuration: `${formik.values?.duration}`,
//         backupAcquisitionId: ssaiData.backupacquisitionId,
//         backupServiceName: getServiceAllData.backupServiceName,
//         backupServiceUID: getServiceAllData.backupServiceUID,
//         backupServiceAddress: getServiceAllData.backupServerAddress,
//         backupServicePort: `${ssaiData.backuplisteningPort}`,
//       };
//     } else if (checkMain) {
//       payload = {
//         signallingType: spliceData,
//         mainDuration: `${formik.values?.duration}`,
//         mainAcquisitionId: formik.values.acquisitionId,
//         mainServiceName: getServiceAllData.mainServiceName,
//         mainServiceUID: getServiceAllData.mainServiceUID,
//         mainServiceAddress: getServiceAllData.mainServerAddress,
//         mainServicePort: `${ssaiData.mainlisteningPort}`,
//         isBackupAvailable: false,
//       };
//     }

//     if (payload) {
//       try {
//        mutationCueOut.mutate({ payload });
//       //  console.log(ssaiData, "zzzzzzzz");
//       } catch (error) {
//         // console.log(error,"cueout...........!")
//         toast({
//           title: "Errorcueout",
//           description: "Payload creation failed. Please check the conditions.",
//           variant: "destructive",
//         });
//       }
     

//     } else {
//       toast({
//         title: "Error",
//         description: "Payload creation failed. Please check the conditions.",
//         variant: "destructive",
//       });
//     }
//   };

//   const handleCueIn = () => {
//     // localStorage.clear();
//     // clearInterval(intervalId);
//     // setIntervalId(null);

//     // // setRemainingTime(0);
//     // setIsRunning(false);
//         if (mainServerStatus===false) {
//       toast({
//         title: "Error",
//         description: "Servervic is stoped",
//         variant: "destructive",
//       });
//       return;
//     }

//     const spliceData =
//       formik.values.ssaiType === "Splice Signaling" ? "splice" : "time";
//     const checkMainBackup =
//       ssaiData.mainacquisitionId &&
//       ssaiData.backupacquisitionId &&
//       getServiceAllData &&
//       ssaiData;
//     const checkMain =
//       ssaiData.mainacquisitionId && getServiceAllData && ssaiData;

//     let payload;
//     if (checkMainBackup) {
//       payload = {
//         signallingType: spliceData,
//         mainAcquisitionId: formik.values.acquisitionId,
//         mainServiceName: getServiceAllData.mainServiceName,
//         mainServiceUID: getServiceAllData.mainServiceUID,
//         mainServiceAddress: getServiceAllData.mainServerAddress,

//         mainServicePort: `${ssaiData.mainlisteningPort}`,
//         isBackupAvailable: true,
//         backupAcquisitionId: ssaiData.backupacquisitionId,
//         backupServiceName: getServiceAllData.backupServiceName,
//         backupServiceUID: getServiceAllData.backupServiceUID,
//         backupServiceAddress: getServiceAllData.backupServerAddress,
//         backupServicePort: `${ssaiData.backuplisteningPort}`,
//       };
//     } else if (checkMain) {
//       payload = {
//         signallingType: spliceData,
//         mainAcquisitionId: formik.values.acquisitionId,
//         mainServiceName: getServiceAllData.mainServiceName,
//         mainServiceUID: getServiceAllData.mainServiceUID,
//         mainServiceAddress: getServiceAllData.mainServerAddress,
//         mainServicePort: `${ssaiData.mainlisteningPort}`,
//         isBackupAvailable: false,
//       };
//     }

//     if (payload) {
//       // console.log("Payload created:", payload);
//       mutationCueIN.mutate({ payload });
//     } else {
//       toast({
//         title: "Error",
//         description: "Payload creation failed. Please check the conditions.",
//         variant: "destructive",
//       });
//     }
//   };
// // console.log(mutationCueOut.isPending ,
// //   (cueInFlag===false? formik.values.duration <= 0:formik.values.duration >= 0&&remainingTime !==0),
// //    cueOutFlag === "true" ,
// //    (formik.values.autoSCTE&&cueOutFlag === "true"&&remainingTime !==0),"aaa")

// const CkeckServicemain= (intanceDataText==="Primary"&&mainServerStatus ===false)
// const CheckBacup=(intanceDataText==="Backup"&&backupServerStatus ===false)
//   return (
//     <Card className="border-0">
//       <CardHeader className="border-b-2 border-zinc-700 p-4">
//         <CardTitle>SSAI</CardTitle>
//       </CardHeader>
//       <CardContent className="space-y-1">
//         <form
//           onSubmit={(e) => {
//             e.preventDefault(); // Remove this if present
//             formik.handleSubmit(e);
//           }}
//         >
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
//             <div className="col-span-2">
//               <div className="space-y-1">
//                 <Label>SSAI Type</Label>
//                 <Select
//                   name="ssaiType"
//                   value={formik.values.ssaiType}
//                   onValueChange={(value) =>
//                     formik.setFieldValue("ssaiType", value)
//                   }
//                 >
//                   <SelectTrigger>
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent className="bg-[#3A3A3A] border-0 text-white hover:bg-[#444444]">
//                     <SelectItem value="Splice Signaling">
//                       Splice Signaling
//                     </SelectItem>
//                     <SelectItem value="Time Signaling">
//                       Time Signaling
//                     </SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="grid grid-cols-2 gap-1">
//                 <div className="space-y-2">
//                   <Label>Durations Sec.</Label>
//                   <Input
//                     name="duration"
//                     type="number"
//                     value={formik.values.duration}
//                     onChange={formik.handleChange}
//                     disabled={formik.values.autoSCTE}
//                     onBlur={formik.handleBlur}
//                   />
//                   {formik.touched.duration && formik.errors.duration ? (
//                     <div className="text-red-500 text-sm">
//                       {formik.errors.duration}
//                     </div>
//                   ) : null}
//                 </div>
//                 <div className="space-y-2">
//                   <Label>Acquisition ID</Label>
//                   <Input
//                     name="acquisitionId"
//                     value={formik?.values?.acquisitionId}
//                     onChange={formik.handleChange}
//                     onBlur={formik.handleBlur}
//                     disabled={true}
//                   />
//                   {formik.touched.acquisitionId &&
//                   formik.errors.acquisitionId ? (
//                     <div className="text-red-500 text-sm">
//                       {formik.errors.acquisitionId}
//                     </div>
//                   ) : null}
//                 </div>
//               </div>
//               <div className="flex items-center gap-1">
//                 <div className="space-y-2">
//                   <Label>Repeat Interval Sec.</Label>
//                   <Input
//                     name="repeatInterval"
//                     type="number"
//                     value={formik.values.repeatInterval}
//                     onChange={formik.handleChange}
//                     onBlur={formik.handleBlur}
//                     disabled={!formik.values.autoSCTE}
//                   />
//                   {formik.touched.repeatInterval &&
//                   formik.errors.repeatInterval ? (
//                     <div className="text-red-500 text-sm">
//                       {formik.errors.repeatInterval}
//                     </div>
//                   ) : null}
//                 </div>
//                 <div className="flex items-center gap-2 mt-6">
//                   <Checkbox
//                     name="autoSCTE"
//                     checked={formik.values.autoSCTE}
//                     onCheckedChange={(checked) => {
//                       formik.setFieldValue("autoSCTE", checked);
//                       if (!checked) {
//                         formik.setFieldValue("repeatInterval", "");
//                         // localStorage.setItem("cueouttype", "false");
//                       }
//                     }}
//                     className=""
//                   />
//                   <Label>Auto SCTE</Label>
//                 </div>
//               </div>
//             </div>
//             <div className="col-span-1 h-full flex flex-col justify-center">
//               <Card className="border-0 shadow-lg bg-zinc-800">
//                 <CardHeader>
//                   <CardTitle className="text-center">Live Sec.</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-1 flex justify-center items-center">
//                   <h1 className="text-6xl font-mono text-red-400">
//                     {remainingTime}
//                   </h1>
//                 </CardContent>
//               </Card>
//             </div>
//           </div>
//           <CardFooter className="border-t-2 border-zinc-700 p-0 pt-3 flex align-middle justify-end w-full">
//             <div className="flex justify-end gap-2">
//               <Button
//                 variant="destructive"
//                 type="submit"
//                 onClick={handleCueOut}
//                 disabled={
//                   CheckBacup||CkeckServicemain||
//                   mutationCueOut.isPending ||
//                  (cueInFlag===false? formik.values.duration <= 0:formik.values.duration >= 0&&remainingTime !==0)||
//                   cueOutFlag === "true" ||
//                   (formik.values.autoSCTE&&cueOutFlag === "true"&&remainingTime !==0&&formik.values.repeatInterval!==0)
//                 }
//               >
//                 {/* Cue out */}
//                 {mutationCueOut.isPending ? <LoaderCircle className="animate-spin"/> : "Cue Out"} 
//               </Button>
//               <Button
//                 type="submit"
//                 disabled={
//                   CheckBacup||CkeckServicemain ||
//                   mutationCueIN.isPending ||
//                   cueOutFlag !== "true" || 
//                   cueInFlag==="true"||mainServerStatus !== null&&mainServerStatus === false
//                 }
//                 onClick={handleCueIn}
//               >
//                 {mutationCueIN.isPending ? <LoaderCircle className="animate-spin"/> : "Cue in"}              
//               </Button>
//             </div>
//           </CardFooter>
//         </form>
//       </CardContent>
//     </Card>
//   );
// };

// export default SSaiCard;
