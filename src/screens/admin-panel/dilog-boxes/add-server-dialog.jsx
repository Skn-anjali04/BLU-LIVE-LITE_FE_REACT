import React, { useState, useRef, useEffect } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Formik, Form } from "formik";
import {
  getServerInfoPath,
  postCreateServerPath,
  posteditServerPath,
} from "@/utils/helpers/api/apiConstant";
import { useApiMutation } from "@/utils/helpers/api/apihooks/useApiMutation";
import { toast } from "@/hooks/use-toast";
import {
  DNS_REGEX,
  IP_ADDRESS_REGEX,
  PASSWORD_REGEX,
} from "@/utils/helpers/regex";
import { useApiGetQuery } from "@/utils/helpers/api/apihooks/useApiGetQuery";

export const AddServerDialog = React.memo(
  ({ open, onOpenChange, refetch, mode = "add", serverData }) => {
    const [showPrimaryPassword, setShowPrimaryPassword] = useState(false);
    const [showPrimaryConfirmPassword, setShowPrimaryConfirmPassword] =
      useState(false);
    const [showBackupPassword, setShowBackupPassword] = useState(false);
    const [showBackupConfirmPassword, setShowBackupConfirmPassword] =
      useState(false);
    const [addBackup, setAddBackup] = useState(false);
    const formikRef = useRef();

    const mutationCreateServer = useApiMutation({
      endpoint: postCreateServerPath,
      method: "POST",
      options: {
        onSuccess: (data) => {
          // console.log(data, "usertab");
          const message = data?.data?.message;
          refetch();
          onOpenChange(false); // Close the dialog
          toast({
            title: "Server Created",
            description: `${message}`,
            variant: "success",
          });
        },
        onError: (error) => {
          const errorMessage = error.response?.data?.message ||"Error";
          const errorMessagedec = error.response?.data?.error?.message ||"Something went wrong.";
          toast({
            title: errorMessage,
            description:errorMessagedec,
            variant: "destructive",
          });
        },
      },
    });

    const mutationEditServer = useApiMutation({
      endpoint: posteditServerPath,
      method: "PUT",
      options: {
        onSuccess: (data) => {
          const message = data?.data?.message;
          refetch();
          onOpenChange(false); // Close the dialog
          toast({
            title: "Server Updated",
            description: `${message}`,
            variant: "success",
          });
        },
        onError: (error) => {
          const errorMessage = error.response?.data?.message ||"Error";
          const errorMessagedec = error.response?.data?.error?.message || "Something went wrong.";
          toast({
            title: errorMessage,
            description: errorMessagedec,
            variant: "destructive",
          });
        },
      },
    });
    // console.log(serverData?._id, "serverData111111111111111111111");
    const atemeServerIdmy = serverData?._id;

    const {
      data: dataServerInfo,
      isLoading: isLoadingServerInfo,
      isError: isErrorServerInfo,
      error: errorServerInfo,
      refetch: refetchServerInfo,
    } = useApiGetQuery({
      key: "fetchServerInfo",
      endpoint: getServerInfoPath,
      params: { atemeServerId: atemeServerIdmy },
      options: { enabled: !!atemeServerIdmy && mode === "edit", retry: false },
    });

    // Pre-fill form with API data when fetched
    useEffect(() => {
      if (mode === "edit" && dataServerInfo?.data?.data) {
        const serverInfo = dataServerInfo.data.data;
        formikRef.current?.setValues({
          mainServerAddress: serverInfo.mainServerAddress || "",
          mainServerPassword: serverInfo.mainServerPassword || "",
          primaryConfirmPassword: serverInfo.mainServerPassword || "",
          backupServerAddress: serverInfo.backupServerAddress || "",
          backupServerPassword: serverInfo.backupServerPassword || "",
          backupConfirmPassword: serverInfo.backupServerPassword || "",
        });
        setAddBackup(!!serverInfo.backupServerAddress);
      }
    }, [dataServerInfo, mode]);

    const handleSubmit = (values) => {
      if (mode === "add") {
        const payload = {
          mainServerAddress: values.mainServerAddress,
          mainServerPassword: values.mainServerPassword,
          ...(addBackup && {
            backupServerAddress: values.backupServerAddress,
            backupServerPassword: values.backupServerPassword,
          }),
        };
        // console.log(payload,"payloadprimary")
        mutationCreateServer.mutate({ payload });
      } else if (mode === "edit") {
        let payload = {
          atemeServerId: atemeServerIdmy,
          removeBackup: false,
          editBackupServerData: false,
          editMainServerData: false,
          // Coming from state
        };

        // Check if the main server data has changed
        const isMainServerChanged =
          values.mainServerAddress !==
            dataServerInfo?.data?.data?.mainServerAddress ||
          values.mainServerPassword !==
            dataServerInfo?.data?.data?.mainServerPassword;

        // Check if the backup server data has changed
        const isBackupServerChanged =
          values.backupServerAddress !==
            dataServerInfo?.data?.data?.backupServerAddress ||
          values.backupServerPassword !==
            dataServerInfo?.data?.data?.backupServerPassword;

        if (!addBackup) {
          payload.removeBackup = true;
          payload.editBackupServerData = false;
          // console.log(0);
        }
        // Condition 1: Remove all backup data if addBackup is false
        if (isBackupServerChanged && !addBackup) {
          payload.removeBackup = true;
          payload.editBackupServerData = false;
          payload.backupServerAddress = "";
          payload.backupServerPassword = "";
          // console.log("1");
        }

        // Condition 2: Main server changed & remove all backup data
        if (isMainServerChanged && !addBackup) {
          payload.editMainServerData = true;
          payload.removeBackup = true;
          payload.editBackupServerData = false;
          payload.mainServerAddress = values.mainServerAddress;
          payload.mainServerPassword = values.mainServerPassword;
          // console.log("2");
        }
        // Condition 3: Main & Backup Changed
        else if (isMainServerChanged && isBackupServerChanged) {
          payload.editMainServerData = true;
          payload.editBackupServerData = true;
          payload.mainServerAddress = values.mainServerAddress;
          payload.mainServerPassword = values.mainServerPassword;
          payload.backupServerAddress = values.backupServerAddress;
          payload.backupServerPassword = values.backupServerPassword;
          // console.log("3");
        }
        // Condition 4: Only Main Changed
        else if (isMainServerChanged) {
          payload.editMainServerData = true;
          payload.mainServerAddress = values.mainServerAddress;
          payload.mainServerPassword = values.mainServerPassword;
          // console.log("4");
        }
        // Condition 5: Only Backup Changed
        else if (isBackupServerChanged && addBackup) {
          payload.editBackupServerData = true;
          payload.backupServerAddress = values.backupServerAddress;
          payload.backupServerPassword = values.backupServerPassword;
          // console.log("5");
        }

        // console.log(payload, "222222222222222222222222222222222222222228888");
        mutationEditServer.mutate({ payload });
      }
    };
    if (isErrorServerInfo) {
      return <div>Error loading server info: {errorServerInfo?.message}</div>;
    }

    return (
      
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            formikRef.current?.resetForm(); // Reset form on cancel
            onOpenChange(false);
          }
        }}
      >
        <DialogContent
          className="bg-[#2A2A2A] border-gray-800 text-white max-h-[400px] flex flex-col overflow-hidden"
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {mode === "add" ? "Add Server" : "Edit Server"}
            </DialogTitle>
          </DialogHeader>
          <Formik
            innerRef={formikRef}
            initialValues={{
              mainServerAddress: "",
              mainServerPassword: "",
              primaryConfirmPassword: "",
              backupServerAddress: "",
              backupServerPassword: "",
              backupConfirmPassword: "",
            }}
            validate={(values) => {
              const errors = {};
              if (!values.mainServerAddress) {
                errors.mainServerAddress =
                  "Primary server address (IP or DNS) is required";
              } else if (
                !IP_ADDRESS_REGEX.test(values.mainServerAddress) &&
                !DNS_REGEX.test(values.mainServerAddress)
              ) {
                errors.mainServerAddress =
                  "Invalid format. Enter a valid IP or DNS address";
              }

              if (!values.mainServerPassword) {
                errors.mainServerPassword = "Primary password is required";
              } else if (!PASSWORD_REGEX.test(values.mainServerPassword)) {
                errors.mainServerPassword =
                  "Password must be in between 8-15 characters , include a digit, a special character, and a mix of letters.";
              }
              if (values.mainServerPassword !== values.primaryConfirmPassword) {
                errors.primaryConfirmPassword = "Passwords do not match";
              }
              if (addBackup) {
                if (!values.backupServerAddress) {
                  errors.backupServerAddress =
                    "Backup server address (IP or DNS) is required";
                } else if (
                  !IP_ADDRESS_REGEX.test(values.backupServerAddress) &&
                  !DNS_REGEX.test(values.backupServerAddress)
                ) {
                  errors.backupServerAddress =
                    "Invalid format. Enter a valid IP or DNS address";
                }
                if (!values.backupServerPassword) {
                  errors.backupServerPassword = "Backup password is required";
                } else if (!PASSWORD_REGEX.test(values.backupServerPassword)) {
                  errors.backupServerPassword =
                    "Password must be between 8-15 characters, include a digit, a special character, and a mix of letters.";
                }
                if (
                  values.backupServerPassword !== values.backupConfirmPassword
                ) {
                  errors.backupConfirmPassword =
                    "Backup passwords do not match";
                }
              }
              return errors;
            }}
            onSubmit={handleSubmit}
          >
            {({ handleChange, handleBlur, values, errors, touched }) => (
              <Form className="flex-1 overflow-y-auto space-y-4 p-4">
                <div className="space-y-2">
                  <Label htmlFor="mainServerAddress">
                    Primary Server Address
                  </Label>
                  <Input
                    id="mainServerAddress"
                    name="mainServerAddress"
                    value={values.mainServerAddress}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="Primary Server Address"
                    className={`border ${
                      errors.mainServerAddress && touched.mainServerAddress
                        ? "border-red-500"
                        : ""
                    }`}
                  />
                  {errors.mainServerAddress && touched.mainServerAddress && (
                    <div className="text-red-500 text-sm">
                      {errors.mainServerAddress}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mainServerPassword">
                    Primary Server Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="mainServerPassword"
                      name="mainServerPassword"
                      type={showPrimaryPassword ? "text" : "password"}
                      value={values.mainServerPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`bg-transparent pr-10 border ${
                        errors.mainServerPassword && touched.mainServerPassword
                          ? "border-red-500"
                          : ""
                      }`}
                    />
                    <span
                      className="absolute right-0 top-0 h-full px-3 py-2 cursor-pointer"
                      onClick={() =>
                        setShowPrimaryPassword(!showPrimaryPassword)
                      }
                    >
                      {showPrimaryPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </span>
                  </div>
                  {errors.mainServerPassword && touched.mainServerPassword && (
                    <div className="text-red-500 text-sm">
                      {errors.mainServerPassword}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primaryConfirmPassword">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="primaryConfirmPassword"
                      name="primaryConfirmPassword"
                      type={showPrimaryConfirmPassword ? "text" : "password"}
                      value={values.primaryConfirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`bg-transparent pr-8 border ${
                        errors.primaryConfirmPassword &&
                        touched.primaryConfirmPassword
                          ? "border-red-500"
                          : ""
                      }`}
                    />
                    <span
                      className="absolute right-0 top-0 h-full px-3 py-2 cursor-pointer"
                      onClick={() =>
                        setShowPrimaryConfirmPassword(
                          !showPrimaryConfirmPassword
                        )
                      }
                    >
                      {showPrimaryConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </span>
                  </div>
                  {errors.primaryConfirmPassword &&
                    touched.primaryConfirmPassword && (
                      <div className="text-red-500 text-sm">
                        {errors.primaryConfirmPassword}
                      </div>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="addBackup"
                    checked={addBackup}
                    onCheckedChange={() => setAddBackup(!addBackup)}
                  />
                  <Label htmlFor="addBackup">Add Backup Server</Label>
                </div>

                {addBackup && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="backupServerAddress">
                        Backup Server Address
                      </Label>
                      <Input
                        id="backupServerAddress"
                        name="backupServerAddress"
                        value={values.backupServerAddress}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Backup Server Address"
                        className={`bg-transparent border ${
                          errors.backupServerAddress &&
                          touched.backupServerAddress
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                      {errors.backupServerAddress &&
                        touched.backupServerAddress && (
                          <div className="text-red-500 text-sm">
                            {errors.backupServerAddress}
                          </div>
                        )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backupServerPassword">
                        Backup Server Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="backupServerPassword"
                          name="backupServerPassword"
                          type={showBackupPassword ? "text" : "password"}
                          value={values.backupServerPassword}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`bg-transparent pr-8 border ${
                            errors.backupServerPassword &&
                            touched.backupServerPassword
                              ? "border-red-500"
                              : ""
                          }`}
                        />
                        <span
                          className="absolute right-0 top-0 h-full px-3 py-2 cursor-pointer"
                          onClick={() =>
                            setShowBackupPassword(!showBackupPassword)
                          }
                        >
                          {showBackupPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </span>
                      </div>
                      {errors.backupServerPassword &&
                        touched.backupServerPassword && (
                          <div className="text-red-500 text-sm">
                            {errors.backupServerPassword}
                          </div>
                        )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backupConfirmPassword">
                        Confirm Backup Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="backupConfirmPassword"
                          name="backupConfirmPassword"
                          type={showBackupConfirmPassword ? "text" : "password"}
                          value={values.backupConfirmPassword}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className={`bg-transparent pr-8 border ${
                            errors.backupConfirmPassword &&
                            touched.backupConfirmPassword
                              ? "border-red-500"
                              : ""
                          }`}
                        />
                        <span
                          className="absolute right-0 top-0 h-full px-3 py-2 cursor-pointer"
                          onClick={() =>
                            setShowBackupConfirmPassword(
                              !showBackupConfirmPassword
                            )
                          }
                        >
                          {showBackupConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </span>
                      </div>
                      {errors.backupConfirmPassword &&
                        touched.backupConfirmPassword && (
                          <div className="text-red-500 text-sm">
                            {errors.backupConfirmPassword}
                          </div>
                        )}
                    </div>
                  </>
                )}

                <DialogFooter>
                  <Button
                    variant="cancel_btn"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  {/* <Button type="submit">{mode === "add" ? "Create" : "Update"}</Button> */}
                  <Button type="submit">
                    {mutationCreateServer.isPending ? (
                      <LoaderCircle className="animate-spin text-blue-500" /> // Loader for "Create"
                    ) : mutationEditServer.isPending ? (
                      <LoaderCircle className="animate-spin text-green-500" /> // Loader for "Update"
                    ) : mode === "add" ? (
                      "Create"
                    ) : (
                      "Update"
                    )}
                  </Button>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>
    );
  }
);

