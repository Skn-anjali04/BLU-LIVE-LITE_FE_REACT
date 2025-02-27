import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApiGetQuery } from "@/utils/helpers/api/apihooks/useApiGetQuery";

export const ServersTab = React.memo(
  ({ data, isLoading, isError, error, refetch, refachUser }) => {
    const serverListData = data?.data?.data || [];
    const [addServerOpen, setAddServerOpen] = useState(false);
    const [mainSelectedIp, setMainSelectedIp] = useState(null);
    const [selectedServer, setSelectedServer] = useState(null);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [actionConfig, setActionConfig] = useState({
      title: "",
      description: "",
      onConfirm: null,
    });
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedServerId, setSelectedServerId] = useState(null);

    const serverOptions = useMemo(() => {
      return serverListData.map((server, index) => {
        const serverId = server?._id;
        const displayValue =
          server.mainServerDns?.trim() || server.mainServerAddress?.trim();
        const combinedValue = JSON.stringify({ serverId, displayValue });

        return (
          <SelectItem key={index} value={combinedValue}>
            {displayValue}
          </SelectItem>
        );
      });
    }, [serverListData]);

    // Memoized selected server object
    const selectedServerObject = useMemo(() => {
      return serverListData.find(
        (server) =>
          server.mainServerDns?.trim() === mainSelectedIp ||
          server.mainServerAddress?.trim() === mainSelectedIp
      );
    }, [mainSelectedIp, serverListData]);

    const {
      data: serversServicData,
      isLoading: isLoadingserversServic,
      refetch: refetchserversServic,
      isError:isErrorserversServic,
      error:errorserversServic
  } = useApiGetQuery({
      key: ["serversServic", mainSelectedIp],
      endpoint: getAllServersPath,
      params: { address: mainSelectedIp },
      options: {
          staleTime: 0,  // No stale data
          cacheTime: 0,  // Prevent caching
          refetchOnMount: true,  // Always fetch fresh data
          refetchOnWindowFocus: false, // Don't fetch on tab switch
          retry: false,
          enabled: !!mainSelectedIp,
          initialData: { data: { data: [] } }, // Ensure clean initial state
      },
  });
  
 
    useEffect(() => {
      const errorMessageServic = errorserversServic?.response?.data?.message;
      const errorMessagedecServic = errorserversServic?.response?.data?.error?.message;
      if(isErrorserversServic&&errorMessagedecServic){
        toast({
          title:  errorMessageServic,
          description: errorMessagedecServic,
          variant: "destructive",
        });
      }
    }, [isErrorserversServic,errorserversServic])
    
    if (isLoadingserversServic) {
      return <CustomLoader />;
  }
    // Update server data when API response changes
    const serverData = useMemo(() => {
      return serversServicData?.data?.data || [];
    }, [serversServicData]);

    // const handleServerChange = useCallback((combinedValue) => {
    //   // Parse the JSON string to get serverId and displayValue
    //   const { serverId, displayValue } = JSON.parse(combinedValue);
    //   setSelectedServerId(serverId);
    //   setMainSelectedIp(displayValue); // Update the selected IP
    //   queryClient.setQueryData(["serversServic", displayValue], { data: { data: [] } });
    //   // Fetch fresh data
    //   refetchserversServic();
    // }, []);

    // Handle backup IP button click
    const handleServerChange = useCallback(async (combinedValue) => {
      const { serverId, displayValue } = JSON.parse(combinedValue);
      setSelectedServerId(serverId);
      setMainSelectedIp(displayValue);
  
      // 1️⃣ Manually clear stale data before fetching
      queryClient.setQueryData(["serversServic", displayValue], { data: { data: [] } });
  
      // 2️⃣ Force refetch after resetting data
      await refetchserversServic();
  }, []);
  
    
    const handleBackupIpClick = useCallback(() => {
      if (selectedServerObject?.backupServerAddress) {
        setMainSelectedIp(selectedServerObject.backupServerAddress);
      }
    }, [selectedServerObject]);

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
          // const errorMessage =
          //   error.response?.data?.message || "Error occurred.";
          const errorMessage = error.response?.data?.message ||"Error";
          const errorMessagedec = error.response?.data?.error?.message||"Something went wrong.";
          toast({
            title: errorMessage ,
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
            setIsAlertOpen(false); // Ensure dialog closes after mutation
          },
        });

        setIsAlertOpen(true); // Open dialog
      },
      [mutationUnassignOperater]
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
          const errorMessage = error.response?.data?.message||"Error";
          const errorMessagedec = error.response?.data?.error?.message ||"Something went wrong.";
          toast({
            title: errorMessage,
            description: errorMessagedec,
            variant: "destructive",
          });
        },
      },
    });

    // Handle assigning users
    const handleAssignUsers = useCallback(
      (users) => {
        mutationAssignOperater.mutate({ payload: users });
      },
      [mutationAssignOperater]
    );

    // Handle edit click
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
            <div className="flex justify-between items-center">
              <div>
                {serverListData.length > 0 && (
                  <div className="flex gap-6">
                    <div className="flex flex-col">
                      <Label className="mb-2">Server IP</Label>
                      {/* <Select
                        value={mainSelectedIp}
                        onValueChange={handleServerChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Server" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#3A3A3A] border-0 text-white hover:bg-[#444444]">
                          {serverOptions}
                        </SelectContent>
                      </Select> */}
                      <Select
                        value={JSON.stringify({
                          serverId: selectedServerObject?._id,
                          displayValue: mainSelectedIp,
                        })}
                        onValueChange={handleServerChange}
                      >
                        <SelectTrigger>
                          <SelectValue>
                            {/* Display the currently selected IP */}
                            {mainSelectedIp || "Select Server"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-[#3A3A3A] border-0 text-white hover:bg-[#444444]">
                          {serverOptions}
                        </SelectContent>
                      </Select>
                    </div>
                    {selectedServerObject?.backupServerAddress && (
                    <div className="flex flex-col">
                      <Label className="mb-2">Backup IP</Label>
                    
                        <Button
                          className="bg-[#3A3A3A] hover:bg-[#444444] text-white"
                          onClick={handleBackupIpClick}
                        >
                          {selectedServerObject.backupServerAddress}
                        </Button>
                
                    </div>
                    
                  )}
                  </div>
                )}
              </div>

              <Button
                className="text-black text-base"
                onClick={() => setAddServerOpen(true)}
              >
                + Add Server
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoadingserversServic ? (
              <CustomLoader />
            ) : (
              <div className="overflow-x-auto">
                <Table className="table-base">
                  <TableHeader>
                    <TableRow className="table-header">
                      <TableHead>Service Name</TableHead>
                      <TableHead>UID</TableHead>
                      <TableHead>Assigned to</TableHead>
                      {selectedServerObject?.mainServerAddress && (
                      <TableHead>Actions</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serverData.length > 0 ? (
                      serverData.map((server) => (
                        <TableRow key={server.serviceUID} className="table-row">
                          <TableCell className="rounded-l-md">
                            {server.serviceName}
                          </TableCell>
                          <TableCell>{server.serviceUID}</TableCell>
                          <TableCell className={`${!selectedServerObject?.mainServerAddress ? 'rounded-r-md p-2' : ''}`}>

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
                          {selectedServerObject?.mainServerAddress && ( <TableCell className="rounded-r-md p-2">
                            <Button
                              variant="ghost"
                              className="btn-pencil"
                              size="icon"
                              onClick={() => handleEditClick(server)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>)}
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
            )}
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

