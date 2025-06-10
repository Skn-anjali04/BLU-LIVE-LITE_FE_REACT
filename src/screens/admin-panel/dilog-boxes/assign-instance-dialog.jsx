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
import { Input } from "@/components/ui/input";
import {
  getAllServersPath,
  getOperatorsPath,
} from "@/utils/helpers/api/apiConstant";
import { useApiGetQuery } from "@/utils/helpers/api/apihooks/useApiGetQuery";
import { toast } from "@/hooks/use-toast";
import Combobox from "@/components/custom-components/ComboBox";

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

  const {
    data: getOperatorData,
    error: GetOperatererror,
    refetch: refetchGetOperator,
    isLoading: isOperatorLoading,
  } = useApiGetQuery({
    key: "getoperator",
    endpoint: `${getOperatorsPath}`,
    params: {
      status: "active",
      userRole: "operator",
    },
    options: {
      enabled: false,
    },
  });

  const {
    data: serversServicData,
    error: errorserversServicError,
    refetch: refetchserversServic,
    isLoading: isBackupServiceLoading,
  } = useApiGetQuery({
    key: ["serversServic"],
    endpoint: getAllServersPath,
    params: { address: selectedServerObject?.backupServerAddress },
    options: {
      staleTime: 0,
      cacheTime: 0,
      retry: false,
      enabled: !!selectedServerObject?.backupServerAddress,
    },
  });

  useErrorHandler(GetOperatererror, toast);
  useErrorHandler(errorserversServicError, toast);

  useEffect(() => {
    if (open) {
      refetchGetOperator();
      if (selectedServerObject?.backupServerAddress) {
        refetchserversServic();
      }
    }
  }, [open, selectedServerObject?.backupServerAddress, refetchGetOperator, refetchserversServic]);

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
      selectedUser: instanceData?.operatorsAssigned || [], // Pre-select all assigned operators
      selectedBackupService: "",
    },
    validate: (values) => {
      const validationErrors = {};

      if (!values.selectedUser || values.selectedUser.length === 0) {
        validationErrors.selectedUser = "At least one operator is required.";
      } else if (
        values.selectedUser.includes(instanceData?.serviceName) &&
        !selectedServerObject?.backupServerAddress
      ) {
        validationErrors.selectedUser =
          "Operator cannot match the main service without a backup.";
      }

      if (selectedServerObject?.backupServerAddress) {
        if (!values.selectedBackupService) {
          validationErrors.selectedBackupService = "Backup service is required.";
        }
      }
      return validationErrors;
    },
    onSubmit: (values) => {
      const selectedBackup = serviceBackupData.find(
        (service) => service.serviceUID === values.selectedBackupService
      );
      const payload = {
        email: values.selectedUser, // Array of selected operator emails
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
    // Filter out operators already assigned in instanceData.operatorsAssigned
    const assignedOperators = instanceData?.operatorsAssigned || [];
    return users
      .filter((user) => !assignedOperators.includes(user))
      .map((user) => ({
        value: user,
        label: user,
      }));
  }, [users, instanceData?.operatorsAssigned]);

  const backupServiceOptions = useMemo(() => {
    return serviceBackupData.map((service) => ({
      value: service.serviceUID,
      label: service.serviceName,
    }));
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
              <div className="space-y-1">
                <label className="text-sm text-gray-400">Main IP</label>
                <div>{selectedServerObject?.mainServerAddress || "N/A"}</div>
              </div>
              {selectedServerObject?.backupServerAddress && (
                <div className="space-y-1">
                  <label className="text-sm text-gray-400">Backup IP</label>
                  <div>{selectedServerObject?.backupServerAddress}</div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div
                className={`grid gap-4 ${
                  selectedServerObject?.backupServerAddress
                    ? "grid-cols-1 md:grid-cols-2"
                    : "grid-cols-1"
                }`}
              >
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

                {selectedServerObject?.backupServerAddress && (
                  <div className="space-y-2">
                    <Label>Backup Services</Label>
                    <Combobox
                      name="selectedBackupService"
                      value={formik.values.selectedBackupService}
                      onValueChange={(value) =>
                        formik.setFieldValue("selectedBackupService", value)
                      }
                      options={backupServiceOptions}
                      placeholder="Select backup service"
                      searchPlaceholder="Search backup service..."
                      noDataMessage="No backup service found."
                      isLoading={isBackupServiceLoading}
                      error={formik.errors.selectedBackupService}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Select Operators</Label>
              <Combobox
                name="selectedUser"
                value={formik.values.selectedUser} // Array of selected emails
                onValueChange={(value) =>
                  formik.setFieldValue("selectedUser", value)
                }
                options={operatorOptions} // Only unassigned operators
                placeholder="Select Operators"
                searchPlaceholder="Search operators..."
                noDataMessage="No operators found."
                isLoading={isOperatorLoading}
                error={formik.errors.selectedUser}
                isMulti // Enable multi-select
              />
            </div>
          </div>

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
              disabled={isOperatorLoading || isBackupServiceLoading}
            >
              Assign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
