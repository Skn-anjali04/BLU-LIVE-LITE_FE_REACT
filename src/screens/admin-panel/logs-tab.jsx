import { useState, useEffect, useRef } from "react";
import { Formik } from "formik";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { saveAs } from "file-saver";
import { toast } from "@/hooks/use-toast";
import { useApiGetQuery } from "@/utils/helpers/api/apihooks/useApiGetQuery";
import { downloadLogs, getlogsServices } from "@/utils/helpers/api/apiConstant";
import CustomLoader from "@/components/custom-components/custom-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoaderCircle } from "lucide-react";

export function LogsTab() {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [jobNames, setJobNames] = useState([]);
  const [serviceNameData, setServiceNameData] = useState(null);
  const hasDownloadedRef = useRef(false);

  /** Fetch Download Data */
  const {
    data: downloadData,
    isLoading: isLoadingDownload,
    isError: isErrorDownload,
    error: downloadApiError,
  } = useApiGetQuery({
    key: ["postLogsdata", startDate, endDate, serviceNameData],
    endpoint: downloadLogs,
    params: { startDate, endDate, serviceName: serviceNameData },
    options: {
      retry: false,
      enabled: !!startDate && !!endDate && !!serviceNameData,
    },
  });

  /** Fetch Job Names */
  const {
    data: logData,
    isLoading: isLoadingLogData,
    isError: isErrorLogs,
    error: logApiError,
  } = useApiGetQuery({
    key: ["postLogsdata", startDate, endDate],
    endpoint: getlogsServices,
    params: { startDate, endDate },
    options: {
      retry: false,
      enabled: !!startDate && !!endDate,
    },
  });



  /** CSV Parsing */
  const parseCSV = (csvString) => {
    const [headerLine, ...lines] = csvString.trim().split("\n");
    const headers = headerLine.split(",");

    return lines.map((line) => {
      const values = line.split(",");
      return headers.reduce((obj, header, index) => {
        obj[header.trim()] = values[index]?.trim() || "";
        return obj;
      }, {});
    });
  };

  /** Convert to CSV */
  const convertToCSV = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      console.error("convertToCSV: Invalid or empty data", data);
      return "";
    }
    const header = Object.keys(data[0]).join(",");
    const rows = data.map((row) =>
      Object.values(row)
        .map((val) => `"${val}"`)
        .join(",")
    );

    return `${header}\n${rows.join("\n")}`;
  };

  /** Handle Download */
  const handleDownload = (data) => {
    let parsedData = typeof data === "string" ? parseCSV(data) : data;

    if (Array.isArray(parsedData) && parsedData.length > 0) {
      const csv = convertToCSV(parsedData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, "download_logs.csv");
      toast({
        title: "Success",
        description: "Logs downloaded successfully!",
        variant: "success",
      });
    } else {
      toast({
        title: "Error",
        description: "No valid data to download.",
        variant: "destructive",
      });
    }
  };

  /** Handle Download Trigger */
  useEffect(() => {
    if (downloadData?.data && !hasDownloadedRef.current) {
      hasDownloadedRef.current = true;
      handleDownload(downloadData.data);

      setTimeout(() => {
        hasDownloadedRef.current = false;
        setStartDate(null);
        setEndDate(null);
        setServiceNameData(null);
        setJobNames([])
      }, 500);
    }
  }, [downloadData]);

  /** Handle Job Data Response */
  useEffect(() => {
    if (logData?.data?.data) {
      setJobNames(logData.data.data.length > 0 ? logData.data.data : []);
      if (!logData.data.data.length) {
        toast({
          title: "No Data",
          description: "No jobs found for selected range.",
          variant: "destructive",
        });
      }
    }
  }, [logData]);

  /** Handle API Errors */
  useEffect(() => {
    if (isErrorDownload && downloadApiError) {
      toast({
        title: "Error",
        description:
          logApiError.response?.data?.message || "Failed to fetch job data.",
        variant: "destructive",
      });
    }
  }, [isErrorDownload,downloadApiError]);

  useEffect(() => {
    if (isErrorLogs && logApiError) {
      setJobNames([]);
      toast({
        title: "Error",
        description:
          logApiError.response?.data?.message || "Failed to fetch job data.",
        variant: "destructive",
      });
    }
  }, [isErrorLogs, logApiError]);

  return (
    <Card className="border-0">
      <CardContent className="p-4">
        <Formik
          initialValues={{ jobName: "", dateRange: [] }}
          validate={(values) => {
            const errors = {};
            if (!values.dateRange[0] || !values.dateRange[1]) {
              errors.dateRange = "Start and End Date are required.";
            }
            return errors;
          }}
          onSubmit={(values, { resetForm }) => {
            setServiceNameData(values.jobName);
            resetForm();
          }}
        >
          {({
            handleChange,
            values,
            errors,
            touched,
            setFieldValue,
            handleSubmit,
          }) => (
            <form
              className="text-white lg:mx-80 xl:mx-80 lg:my-20 xl:my-20"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <Label>Date Range</Label>
                  <DatePicker
                    selected={values.dateRange[0]}
                    onChange={(dates) => {
                      setFieldValue("dateRange", dates);

                      // Check if both start and end dates are selected
                      if (dates && dates.length === 2 && dates[0] && dates[1]) {
                        setStartDate(new Date(dates[0]).toISOString());
                        setEndDate(new Date(dates[1]).toISOString());
                      } else {
                        // If the range selection is not complete, do not set the end date
                        setStartDate(new Date(dates[0]).toISOString());
                        setEndDate(null); // or setEndDate(undefined) depending on your needs
                      }
                    }}
                    startDate={values.dateRange[0]}
                    endDate={values.dateRange[1]}
                    selectsRange
                    className={`bg-transparentflex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${
                      errors.dateRange && touched.dateRange
                        ? "border-red-500"
                        : ""
                    }`}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="StartDate - EndDate"
                  />
                  {errors.dateRange && touched.dateRange && (
                    <div className="text-red-500 text-sm">
                      {errors.dateRange}
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2">
                  <Label>Job Name</Label>
                  <Select
                    disabled={
                      !jobNames.length || isLoadingLogData || isErrorLogs
                    }
                    value={values.jobName}
                    onValueChange={(value) => setFieldValue("jobName", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Job" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#3A3A3A] text-white border-0 hover:bg-[#444444]">
                      {jobNames.map((job, index) => (
                        <SelectItem key={index} value={job.serviceName}>
                          {job.serviceName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button type="submit">
                    {isLoadingDownload ?<LoaderCircle size={64} className="animate-spin text-white" />
: "Download Logs"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </Formik>
      </CardContent>
    </Card>
  );
}


