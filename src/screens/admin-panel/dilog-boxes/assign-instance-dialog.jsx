import { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  getAllServersPath,
  getOperatorsPath,
} from "@/utils/helpers/api/apiConstant";
import { useApiGetQuery } from "@/utils/helpers/api/apihooks/useApiGetQuery";
import { toast } from "@/hooks/use-toast";

export function AssignInstanceDialog({
  open,
  onOpenChange,
  instanceData,
  onAssign,
  selectedServerObject,
}) {
  const [users, setUsers] = useState([]);
  const [serviceBackupData, setServiceBackupData] = useState([]);
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
  const { data: getOperatorData, error:GetOperatererror,refetch: refetchGetOperator } = useApiGetQuery(
    {
      key: "getoperator",
      endpoint: `${getOperatorsPath}`,
      params: {
        status: "active",
        userRole: "operator",
      },
      options: {
        enabled: false,
      },
    }
  );


  const { data: serversServicData,error:errorserversServicError, refetch: refetchserversServic } =
    useApiGetQuery({
      key: ["serversServic"],
      endpoint: getAllServersPath,
      params: { address: selectedServerObject?.backupServerAddress },
      options: {
        // staleTime: 1000 * 60 * 1,
        // cacheTime: 1000 * 60 * 2
        staleTime: 0, 
     cacheTime: 0,
        retry: false,
        enabled:!!selectedServerObject?.backupServerAddress
      },
    });
    useErrorHandler(GetOperatererror,toast)
    useErrorHandler(errorserversServicError,toast)

  useEffect(() => {
    if (open) {
      refetchGetOperator();
      if (selectedServerObject?.backupServerAddress) {
        refetchserversServic();
      }
    }
  }, [open, selectedServerObject?.backupServerAddress]);

  useEffect(() => {
    if (serversServicData?.data?.data) {
      setServiceBackupData(serversServicData.data.data);
    }
  }, [serversServicData]);

  useEffect(() => {
    const userDataAPi = getOperatorData?.data?.data;
    if (Array.isArray(userDataAPi)) {
      setUsers(userDataAPi.map((user) => user.email));
    } else {
      console.error("Invalid API response format: Expected an array of users.");
      setUsers([]);
    }
  }, [getOperatorData]);

  const formik = useFormik({
    initialValues: {
      selectedUser: "",
      selectedBackupService: "",
    },
    validate: (values) => {
      const validationErrors = {};

      // Check if a user (operator) is selected
      if (!values.selectedUser) {
        validationErrors.selectedUser = "Operator is required.";
      } else if (
        values.selectedUser === instanceData?.serviceName &&
        !selectedServerObject?.backupServerAddress
      ) {
        validationErrors.selectedUser =
          "Operator cannot match the main service without a backup.";
      }

      // Conditionally validate the backup service
      if (selectedServerObject?.backupServerAddress) {
        if (!values.selectedBackupService) {
          validationErrors.selectedBackupService =
            "Backup service is required.";
        }
      }
      return validationErrors;
    },
    onSubmit: (values) => {
      const selectedBackup = serviceBackupData.find(
        (service) => service.serviceUID === values.selectedBackupService
      );
      const payload = {
        email: values.selectedUser,
        atemeServerId: selectedServerObject._id,
        mainServiceName: instanceData.serviceName,
        mainServiceUID: instanceData.serviceUID,
        isBackupAvailable: !!selectedServerObject?.backupServerAddress,
        backupServiceName: selectedBackup?.serviceName || "",
        backupServiceUID: selectedBackup?.serviceUID || "",
      };

      onAssign(payload);
      onOpenChange(false);
    },
  });

  
  const operatorOptions = useMemo(() => {
    return users?.map((user, indexData) => (
      <SelectItem key={indexData} value={user}>
        {user}
      </SelectItem>
    ));
  }, [users]);

  const backupServiceOptions = useMemo(() => {
    return serviceBackupData.map((service, index) => (
      <SelectItem key={index} value={service.serviceUID}>
        {service.serviceName}
      </SelectItem>
    ));
  }, [serviceBackupData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-[#2A2A2A] border-0 p-0 gap-0 text-white"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-xl">Assign Service</DialogTitle>
        </DialogHeader>
        <form onSubmit={formik.handleSubmit}>
          <div className="space-y-4 p-4 pt-2">
            <div className="flex justify-evenly items-center text-white border-b border-dotted border-gray-600 pb-1">
              {/* Main IP */}
              <div className="space-y-1">
                <label className="text-sm text-gray-400">Main IP</label>
                <div>{selectedServerObject?.mainServerAddress || "N/A"}</div>
              </div>

              {/* Backup IP */}
              {selectedServerObject?.backupServerAddress && (
                <div className="space-y-1">
                  <label className="text-sm text-gray-400">Backup IP</label>
                  <div>{selectedServerObject?.backupServerAddress}</div>
                </div>
              )}
            </div>

            {/* Main and Backup Services */}
            <div className="space-y-2">
              <div
                className={`grid gap-4 ${
                  selectedServerObject?.backupServerAddress
                    ? "grid-cols-1 md:grid-cols-2"
                    : "grid-cols-1"
                }`}
              >
                {/* Main Service */}
                <div className="space-y-2">
                  <Label>Main Services</Label>
                  <Input
                    type="text"
                    value={instanceData?.serviceName || "N/A"}
                    readOnly
                    className={`${
                      selectedServerObject?.backupServerAddress ? "" : "w-full"
                    }`}
                  />
                </div>

                {/* Backup Service */}
                {selectedServerObject?.backupServerAddress && (
                  <div className="space-y-2">
                    <Label>Backup Services</Label>
                    <Select
                      name="selectedBackupService"
                      value={formik.values.selectedBackupService}
                      onValueChange={(value) =>
                        formik.setFieldValue("selectedBackupService", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select backup service" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#3A3A3A] text-white border-0 hover:bg-[#444444]">
                        {backupServiceOptions.length > 0 ? (
                          backupServiceOptions
                        ) : (
                          <SelectItem disabled>No data found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {formik.errors.selectedBackupService && (
                      <div className="text-red-500 text-sm">
                        {formik.errors.selectedBackupService}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Select Operator */}
            <div>
              <Label>Select Operator</Label>
              <Select
                name="selectedUser"
                value={formik.values.selectedUser}
                onValueChange={(value) =>
                  formik.setFieldValue("selectedUser", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Operator" />
                </SelectTrigger>
                <SelectContent className="bg-[#3A3A3A] border-0 text-white hover:bg-[#444444]">
                  {operatorOptions.length > 0 ? (
                    operatorOptions
                  ) : (
                    <SelectItem disabled>No data found</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {formik.errors.selectedUser && (
                <div className="text-red-500 text-sm">
                  {formik.errors.selectedUser}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 p-4 bg-[#333333]">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-gray-300 hover:text-white hover:bg-[#444444]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gray-300 hover:bg-gray-400 text-black"
            >
              Assign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
