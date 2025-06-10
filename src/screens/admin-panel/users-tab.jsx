import { Trash2, X } from "lucide-react";
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
import { useEffect, useState } from "react";
import { CreateUserDialog } from "./dilog-boxes/create-user-dialog";
import { useApiMutation } from "@/utils/helpers/api/apihooks/useApiMutation";
import {
  postDeleteUser,
  postUnassignInstanceUserPath,
} from "@/utils/helpers/api/apiConstant";
import { toast } from "@/hooks/use-toast";
import { AlertDialogDelete } from "./dilog-boxes/alerts-dialog-delete";
import CustomLoader from "@/components/custom-components/custom-loader";

export function UsersTab({ data, isLoading, isError, error, refetchUsers }) {
  const defaultUserData = data?.data?.data || [];
  const [users, setUsers] = useState(defaultUserData);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [actionConfig, setActionConfig] = useState(null); // Stores configuration for the current action

  // Sync state with the initial data
  useEffect(() => {
    if (defaultUserData && Array.isArray(defaultUserData)) {
      setUsers(defaultUserData);
    }
  }, [defaultUserData]);
  // console.log(defaultUserData, "defaultUserData");

  // API mutation for deleting a user
  const mutationDeleteUser = useApiMutation({
    endpoint: `${postDeleteUser}`,
    method: "DELETE",
    options: {
      onSuccess: (data, variables) => {
        const message = data?.data?.message;
        refetchUsers();

        toast({
          title: "User Deleted",
          description: `${message}`,
          variant: "success",
        });
        setActionConfig(null);
      },
      onError: (error) => {
        const errorMessage = error?.response?.data?.message;
        toast({
          title: "User Delete Error",
          description: errorMessage,
          variant: "destructive",
        });
        setActionConfig(null);
      },
    },
  });
  // API mutation for unassigning an instance
  const mutationUnassignInstanceUser = useApiMutation({
    endpoint: `${postUnassignInstanceUserPath}`,
    method: "POST",
    options: {
      onSuccess: (data, variables) => {
        const message = data?.data?.message;
        refetchUsers();
        toast({
          title: "Instance Unassigned",
          description: `${message}`,
          variant: "success",
        });

        setActionConfig(null);
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.message;
        toast({
          title: "Instance Unassign Error",
          description: errorMessage,
          variant: "destructive",
        });
        setActionConfig(null);
      },
    },
  });

  // Handles delete user
  const handleDeleteUser = (username) => {
    const bodydel = {
      email: username,
    };
    setActionConfig({
      title: "Delete User",
      description: `Are you sure you want to delete user "${username}"? This action cannot be undone.`,
      onConfirm: () => mutationDeleteUser.mutate({ payload: bodydel }),
    });
    setIsAlertOpen(true);
  };

  // Handles unassign instance
  const handleRemoveInstance = (user, instance) => {
    // console.log(user, "user");
    // console.log(instance, "instance");
  
    // Construct the payload
    const payload = {
      atemeServerId: instance?.atemeServerId,
      email: user?.email, 
      mainServiceName: instance?.mainServiceName,
      mainServiceUID: instance?.mainServiceUID, 
    };
  
    // console.log(payload, "payload");
  
    
    setActionConfig({
      title: "Unassign Instance",
      description: `Are you sure you want to unassign the instance "${instance.mainServiceName}" from user "${user.email}"?`,
      onConfirm: () => {
        // Perform the action (e.g., API call) here
        // console.log("Unassigning instance:", payload);
        mutationUnassignInstanceUser.mutate({ payload });
      },
    });
  
    setIsAlertOpen(true); // Open the confirmation dialog
  };
  if (isLoading) return <CustomLoader />;
  if (isError)
    return (
      <p className="text-red-500">
        Error: {error?.message || "Something went wrong."}
      </p>
    );
  return (
    <Card className="border-0">
  <CardHeader className="p-4">
    <div className="flex justify-end">
      <Button
        className="bg-[#D3D3D3] hover:bg-gray-400 text-black"
        onClick={() => setIsCreateDialogOpen(true)}
      >
        + Create User
      </Button>
    </div>
  </CardHeader>
  <CardContent className="p-4 pt-0">
    {isLoading ? (
      <CustomLoader />
    ) : (
      <div className="overflow-x-auto">
        <Table className="table-base">
          <TableHeader>
            <TableRow className="table-header">
              <TableHead>Username</TableHead>
              <TableHead>User Role</TableHead>
              <TableHead>Instance Assigned</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="overflow-hidden">
            {users?.map((user, index) => (
              <TableRow key={index} className="table-row">
                <TableCell className="rounded-l-md">{user.email}</TableCell>
                <TableCell>{user?.userRole?.toLowerCase()}</TableCell>
                <TableCell className="p-2">
                  <div className="table-actions">
                    {user?.serviceAssigned?.map((instance, index) => (
                      <span key={index} className="badge">
                        {instance.mainServiceName}
                        <X
                          className="h-4 w-4 cursor-pointer transition-colors hover:text-red-500"
                          onClick={() => handleRemoveInstance(user, instance)}
                        />
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="rounded-r-md p-4">
                  {["admin", "tech"].includes(user.userRole.toLowerCase()) ? (
                    <Trash2 className="h-5 w-5 text-gray-400 cursor-not-allowed" />
                  ) : (
                    <Trash2
                      className="h-5 w-5 cursor-pointer hover:text-black-400 transition-transform duration-300 ease-in-out transform hover:scale-110"
                      onClick={() => handleDeleteUser(user.email)}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )}
  </CardContent>
  <CreateUserDialog
    open={isCreateDialogOpen}
    onOpenChange={setIsCreateDialogOpen}
    refetchUsers={refetchUsers}
  />

  {actionConfig && (
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
</Card>
  );
}
