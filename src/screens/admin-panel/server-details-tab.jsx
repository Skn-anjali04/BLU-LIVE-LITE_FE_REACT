import React, { useEffect, useState, useMemo, useCallback } from "react";
import { LoaderCircle, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApiMutation } from "@/utils/helpers/api/apihooks/useApiMutation";
import { postdeleteServerDetails } from "@/utils/helpers/api/apiConstant";
import { AlertDialogDelete } from "./dilog-boxes/alerts-dialog-delete";
import { AddServerDialog } from "./dilog-boxes/add-server-dialog";
import { toast } from "@/hooks/use-toast";
import CustomLoader from "@/components/custom-components/custom-loader";

export function ServerDetailsTab({ data, isLoading, isError, error, refetch }) {
  const defaultServerDetails = useMemo(() => data?.data?.data || [], [data]);

  const [serverDetails, setServerDetails] = useState(defaultServerDetails);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState(null);
  const [addServerOpen, setAddServerOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("edit");
  const [serverDataForEdit, setServerDataForEdit] = useState(null);
  useEffect(() => {
    if (data?.data?.data) {
      setServerDetails(data.data.data);
    }
  }, [data]);
  

  const mutationdeleteServerDetails = useApiMutation({
    endpoint: `${postdeleteServerDetails}`,
    method: "DELETE",
    options: {
      onSuccess: (data) => {
        const message = data?.data?.message;
        refetch();
        toast({
          title: "Server Deleted",
          description: message,
          variant: "success",
        });
        setIsAlertOpen(false);
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message;
        const errorMessagedec = error.response?.data?.error?.message;
        toast({
          title: errorMessage||"Error",
          description: errorMessagedec||"Something went wrong.",
          variant: "destructive",
        });
        setIsAlertOpen(false);
      },
    },
  });

  const handleDeleteServer = useCallback((server) => {
    setSelectedServer(server);
    setIsAlertOpen(true);
  }, []);

  const confirmDeleteServer = useCallback(() => {
    if (selectedServer) {
      const body = { atemeServerId: selectedServer?._id };
      mutationdeleteServerDetails.mutate({ payload: body });
    }
  }, [selectedServer, mutationdeleteServerDetails]);

  const handleEditServer = useCallback((mainIp,server) => {
    setDialogMode("edit");
    // console.log(server,"serverserver")
    setSelectedServer(mainIp);
    setAddServerOpen(true);
    setServerDataForEdit(server)
  }, []);

  // Rendering a loader or error message when data is loading or error occurs
  
  if (isLoading) return <CustomLoader />;
  if (isError) return <p className="text-red-500">Error: {error?.response?.data?.error?.message || "Something went wrong."}</p>;

  return (
    <>
      <Card className="border-0">
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <Table className="table-base">
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead>Primary Address</TableHead>
                  <TableHead>Backup Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serverDetails.length > 0 ? (
                  serverDetails.map((server,index) => (
                    <TableRow key={index} className="table-row">
                      <TableCell className="rounded-l-md">{server.mainServerAddress}</TableCell>
                      <TableCell> {server.backupServerAddress ? server.backupServerAddress : "-"}</TableCell>
                      <TableCell className="rounded-r-md">
                        <div className="flex gap-2">
                          <Pencil
                            className="h-5 w-5 cursor-pointer transition-colors hover:text-black-400"
                            onClick={() => handleEditServer(server.mainServerAddress,server)}
                          />
                          <Trash2
                            className="h-5 w-5 cursor-pointer transition-colors hover:text-red-500"
                            onClick={() => handleDeleteServer(server)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      No server details available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {isAlertOpen && (
        <AlertDialogDelete
          isOpen={isAlertOpen}
          onClose={() => setIsAlertOpen(false)}
          onConfirm={confirmDeleteServer}
          title="Delete Server"
          description={`Are you sure you want to delete the server "${selectedServer?.mainIp}"? This action cannot be undone.`}
          confirmText="Yes"
          cancelText="No"
        />
      )}

      {addServerOpen && (
        <AddServerDialog
          open={addServerOpen}
          onOpenChange={() => setAddServerOpen(false)}
          refetch={refetch}
          mode={dialogMode}
          serverData={serverDataForEdit} // Pass server data for editing
        />
      )}
    </>
  );
}
