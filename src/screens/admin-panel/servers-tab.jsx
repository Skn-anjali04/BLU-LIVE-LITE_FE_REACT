import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddServerDialog } from "./dilog-boxes/add-server-dialog";
import { AssignInstanceDialog } from "./dilog-boxes/assign-instance-dialog";
import { AlertDialogDelete } from "./dilog-boxes/alerts-dialog-delete";
import { useApiMutation } from "@/utils/helpers/api/apihooks/useApiMutation";
import { toast } from "@/hooks/use-toast";
import {
  getAllServersPath,
  postAssignInstToUsersPath,
  postUnassignInstanceUserPath,
} from "@/utils/helpers/api/apiConstant";
import CustomLoader from "@/components/custom-components/custom-loader";
import { Label } from "@/components/ui/label";
import { useApiGetQuery } from "@/utils/helpers/api/apihooks/useApiGetQuery";
import { cn } from "@/lib/utils";
import Combobox from "@/components/custom-components/ComboBox";

export const ServersTab = React.memo(
  ({ data, isLoading, isError, error, refetch, refachUser }) => {
    const serverListData = data?.data?.data || [];

    // Initialize state from sessionStorage with keys specific to ServersTab
    const [addServerOpen, setAddServerOpen] = useState(false);
    const [selectedServerIp, setSelectedServerIp] = useState(() => {
      return sessionStorage.getItem("serversTab_selectedServerIp") || null;
    });
    const [activeIp, setActiveIp] = useState(() => {
      return sessionStorage.getItem("serversTab_activeIp") || null;
    });
    const [activeTab, setActiveTab] = useState(() => {
      return sessionStorage.getItem("serversTab_activeTab") || "main";
    });
    const [selectedServer, setSelectedServer] = useState(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [actionConfig, setActionConfig] = useState({
      title: "",
      description: "",
      onConfirm: null,
    });
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedServerId, setSelectedServerId] = useState(() => {
      return sessionStorage.getItem("serversTab_selectedServerId") || null;
    });

    // Save state to sessionStorage whenever it changes
    useEffect(() => {
      sessionStorage.setItem("serversTab_selectedServerIp", selectedServerIp || "");
      sessionStorage.setItem("serversTab_activeIp", activeIp || "");
      sessionStorage.setItem("serversTab_activeTab", activeTab);
      sessionStorage.setItem("serversTab_selectedServerId", selectedServerId || "");
    }, [selectedServerIp, activeIp, activeTab, selectedServerId]);

    // Memoized server options for Combobox
    const serverOptions = useMemo(() => {
      return serverListData.map((server) => {
        const serverId = server?._id;
        const displayValue =
          server.mainServerDns?.trim() || server.mainServerAddress?.trim();
        const combinedValue = JSON.stringify({ serverId, displayValue });
        return {
          value: combinedValue,
          label: displayValue,
        };
      });
    }, [serverListData]);

    // Memoized selected server object
    const selectedServerObject = useMemo(() => {
      return serverListData.find(
        (server) =>
          server.mainServerDns?.trim() === selectedServerIp ||
          server.mainServerAddress?.trim() === selectedServerIp
      );
    }, [selectedServerIp, serverListData]);

    // Validate persisted server data and reset if invalid
    useEffect(() => {
      if (selectedServerIp && !selectedServerObject) {
        setSelectedServerIp(null);
        setSelectedServerId(null);
        setActiveIp(null);
        setActiveTab("main");
        sessionStorage.removeItem("serversTab_selectedServerIp");
        sessionStorage.removeItem("serversTab_activeIp");
        sessionStorage.removeItem("serversTab_activeTab");
        sessionStorage.removeItem("serversTab_selectedServerId");
      }
    }, [selectedServerIp, selectedServerObject]);

    // Determine the IP to fetch based on the active tab
    useEffect(() => {
      if (!selectedServerIp) {
        setActiveIp(null);
        setActiveTab("main");
        return;
      }
      if (activeTab === "main") {
        setActiveIp(selectedServerIp);
      } else if (
        activeTab === "backup" &&
        selectedServerObject?.backupServerAddress
      ) {
        setActiveIp(selectedServerObject.backupServerAddress);
      }
    }, [selectedServerIp, activeTab, selectedServerObject]);

    const {
      data: serversServicData,
      isLoading: isLoadingserversServic,
      refetch: refetchserversServic,
      isError: isErrorserversServic,
      error: errorserversServic,
    } = useApiGetQuery({
      key: ["serversServic", activeIp],
      endpoint: getAllServersPath,
      params: { address: activeIp },
      options: {
        staleTime: 0,
        cacheTime: 0,
        refetchOnMount: true,
        refetchOnWindowFocus: false,
        retry: false,
        enabled: !!activeIp,
      },
    });

    useEffect(() => {
      const errorMessageServic = errorserversServic?.response?.data?.message;
      const errorMessagedecServic =
        errorserversServic?.response?.data?.error?.message;
      if (isErrorserversServic && errorMessagedecServic) {
        toast({
          title: errorMessageServic || "Error",
          description: errorMessagedecServic || "Something went wrong.",
          variant: "destructive",
        });
      }
    }, [isErrorserversServic, errorserversServic]);

    // Update server data when API response changes
    const serverData = useMemo(() => {
      return serversServicData?.data?.data || [];
    }, [serversServicData]);

  

const handleServerChange = useCallback(
  async (combinedValue) => {
    // If combinedValue is empty or invalid, and a server is already selected, do nothing
    if (!combinedValue && selectedServerIp && selectedServerId) {
      return; // Prevent clearing state when re-selecting the same or invalid value
    }

    // If combinedValue is empty, clear the state
    if (!combinedValue) {
      setSelectedServerId(null);
      setSelectedServerIp(null);
      setActiveIp(null);
      setActiveTab("main");
      sessionStorage.setItem("serversTab_selectedServerIp", "");
      sessionStorage.setItem("serversTab_activeIp", "");
      sessionStorage.setItem("serversTab_activeTab", "main");
      sessionStorage.setItem("serversTab_selectedServerId", "");
      return;
    }

    let parsedValue;
    try {
      parsedValue = JSON.parse(combinedValue);
    } catch (e) {
      console.error("Invalid combinedValue format:", combinedValue);
      return; // Prevent processing invalid JSON
    }

    const { serverId, displayValue } = parsedValue;

    // Check if the selected value is the same as the current one
    if (displayValue === selectedServerIp && serverId === selectedServerId) {
      return; // No change needed, prevent unnecessary updates
    }

    // Update state and sessionStorage for new selection
    setSelectedServerId(serverId);
    setSelectedServerIp(displayValue);
    setActiveTab("main");
    setActiveIp(displayValue);
    sessionStorage.setItem("serversTab_selectedServerIp", displayValue);
    sessionStorage.setItem("serversTab_activeIp", displayValue);
    sessionStorage.setItem("serversTab_activeTab", "main");
    sessionStorage.setItem("serversTab_selectedServerId", serverId);

    // Only refetch if activeIp is set and different from the new displayValue
    if (activeIp && activeIp !== displayValue) {
      await refetchserversServic();
    }
  },
  [refetchserversServic, selectedServerIp, selectedServerId, activeIp]
);

    // Handle tab switch (Main/Backup)
    const handleTabSwitch = useCallback(async (tab) => {
      setActiveTab(tab);
      sessionStorage.setItem("serversTab_activeTab", tab);
    }, []);

    // Mutation for unassigning operators
    const mutationUnassignOperater = useApiMutation({
      endpoint: postUnassignInstanceUserPath,
      method: "POST",
      options: {
        onSuccess: (data) => {
          refetchserversServic();
          refachUser();
          const message = data?.data?.message;
          if (message) {
            toast({
              title: "Success",
              description: message,
              variant: "success",
            });
          }
        },
        onError: (error) => {
          const errorMessage = error.response?.data?.message || "Error";
          const errorMessagedec =
            error.response?.data?.error?.message || "Something went wrong.";
          toast({
            title: errorMessage,
            description: errorMessagedec,
            variant: "destructive",
          });
        },
      },
    });

    const handleRemoveUser = useCallback(
      (server, user) => {
        const serviceName = server?.serviceName;
        const serviceId = server.serviceUID;

        const payload = {
          atemeServerId: selectedServerId,
          email: user,
          mainServiceName: serviceName,
          mainServiceUID: serviceId,
        };

        setActionConfig({
          title: "Remove User",
          description: `Are you sure you want to remove "${user}" from this server? This action cannot be undone.`,
          onConfirm: () => {
            mutationUnassignOperater.mutate({ payload });
            setIsAlertOpen(false);
          },
        });

        setIsAlertOpen(true);
      },
      [mutationUnassignOperater, selectedServerId]
    );

    // Mutation for assigning operators
    const mutationAssignOperater = useApiMutation({
      endpoint: postAssignInstToUsersPath,
      method: "POST",
      options: {
        onSuccess: (data) => {
          const message = data?.data?.message;
          if (message) {
            toast({
              title: "Success",
              description: message,
              variant: "success",
            });
          }
          refetchserversServic();
          refachUser();
        },
        onError: (error) => {
          const errorMessage = error.response?.data?.message || "Error";
          const errorMessagedec =
            error.response?.data?.error?.message || "Something went wrong.";
          toast({
            title: errorMessage,
            description: errorMessagedec,
            variant: "destructive",
          });
        },
      },
    });

    const handleAssignUsers = useCallback(
      (users) => {
        mutationAssignOperater.mutate({ payload: users });
      },
      [mutationAssignOperater]
    );

    const handleEditClick = useCallback((server) => {
      setSelectedServer(server);
      setIsDialogOpen(true);
    }, []);

    if (isError) {
      return (
        <p className="text-red-500">
          Error: {error?.message || "Something went wrong."}
        </p>
      );
    }

    return (
      <>
        <Card className="border-0">
          <CardHeader className="p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 xl:px-6">
              {/* Left Section */}
              <div className="flex flex-col sm:flex-row sm:items-end flex-wrap gap-4">
                {serverListData.length > 0 && (
                  <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                    <div className="flex flex-col">
                      <Label className="mb-2">Server IP</Label>
                      <Combobox
                        name="serverIp"
                        value={
                          selectedServerIp
                            ? JSON.stringify({
                                serverId: selectedServerObject?._id,
                                displayValue: selectedServerIp,
                              })
                            : ""
                        }
                        onValueChange={handleServerChange}
                        options={serverOptions}
                        placeholder="Select Server"
                        searchPlaceholder="Search server..."
                        noDataMessage="No servers found."
                        isLoading={isLoading}
                      />
                    </div>

                    {selectedServerObject?.backupServerAddress && (
                      <div className="flex gap-2 flex-wrap">
                        <div className="flex flex-col">
                          <Label className="mb-2">Primary IP</Label>
                          <Button
                            className={cn(
                              "bg-[#3A3A3A] hover:bg-[#444444] text-white",
                              activeTab === "main" && "bg-[#555555]"
                            )}
                            onClick={() => handleTabSwitch("main")}
                          >
                            {selectedServerIp || "N/A"}
                          </Button>
                        </div>
                        <div className="flex flex-col">
                          <Label className="mb-2">Backup IP</Label>
                          <Button
                            className={cn(
                              "bg-[#3A3A3A] hover:bg-[#444444] text-white",
                              activeTab === "backup" && "bg-[#555555]"
                            )}
                            onClick={() => handleTabSwitch("backup")}
                          >
                            {selectedServerObject.backupServerAddress}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Section */}
              <div className="flex sm:justify-end">
                <Button
                  className="text-black text-base"
                  onClick={() => setAddServerOpen(true)}
                >
                  + Add Server
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="overflow-x-auto">
              <Table className="table-base">
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead>Service Name</TableHead>
                    <TableHead>UID</TableHead>
                    <TableHead>Assigned to</TableHead>
                    {selectedServerObject?.mainServerAddress && (
                      <TableHead>Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody className="overflow-hidden">
                  {isLoadingserversServic ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6">
                        <CustomLoader />
                      </TableCell>
                    </TableRow>
                  ) : serverData.length > 0 ? (
                    serverData.map((server) => (
                      <TableRow key={server.serviceUID} className="table-row">
                        <TableCell className="rounded-l-md">
                          {server.serviceName}
                        </TableCell>
                        <TableCell>{server.serviceUID}</TableCell>
                        <TableCell
                          className={`${
                            !selectedServerObject?.mainServerAddress
                              ? "rounded-r-md p-2"
                              : ""
                          }`}
                        >
                          <div className="table-actions">
                            {server.operatorsAssigned?.map((user) => (
                              <span key={user} className="badge">
                                {user}
                                {selectedServerObject?.mainServerAddress && (
                                  <X
                                    className="h-4 w-4 cursor-pointer transition-colors hover:text-red-500"
                                    onClick={() =>
                                      handleRemoveUser(server, user)
                                    }
                                  />
                                )}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        {selectedServerObject?.mainServerAddress && (
                          <TableCell className="rounded-r-md p-2">
                            <Button
                              variant="ghost"
                              className="btn-pencil"
                              size="icon"
                              onClick={() => handleEditClick(server)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <div className="flex justify-center items-center py-6">
                          No Servers Found
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {addServerOpen && (
          <AddServerDialog
            open={addServerOpen}
            onOpenChange={setAddServerOpen}
            refetch={refetch}
          />
        )}


        {isAlertOpen && (
          <AlertDialogDelete
            isOpen={isAlertOpen}
            onClose={() => setIsAlertOpen(false)}
            onConfirm={actionConfig.onConfirm}
            title={actionConfig.title}
            description={actionConfig.description}
            confirmText="Yes"
            cancelText="No"
          />
        )}

        {isDialogOpen && (
          <AssignInstanceDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            instanceData={selectedServer || []}
            onAssign={handleAssignUsers}
            selectedServerObject={selectedServerObject}
          />
        )}
      </>
    );
  }
);
