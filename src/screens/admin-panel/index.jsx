
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/ui/navbar";
import { ServersTab } from "./servers-tab"; // Ensure this is memoized
import { UsersTab } from "./users-tab"; // Ensure this is memoized
import { LogsTab } from "./logs-tab"; // Ensure this is memoized
import { ServerDetailsTab } from "./server-details-tab"; // Ensure this is memoized
import { useApiGetQuery } from "@/utils/helpers/api/apihooks/useApiGetQuery";
import {
  getServerListPath,
  getUsersPath,
} from "@/utils/helpers/api/apiConstant";

const AdminPanel = () => {
  // const [status, setStatus] = useState("active");
  const {
    data: serversListData,
    isLoading: isLoadingServersList,
    isError: isErrorServersList,
    error: errorServersList,
    refetch: refetchServersList,
  } = useApiGetQuery({
    key: ["serverslist" ], // Add status for caching and refetching
    endpoint: getServerListPath,  // Base API path
    params: { status:"active" },           // Query parameters (e.g., status=all)
    options: {
      retry: false,   
      cacheTime: 0, 
      staleTime: 0,
      refetchOnMount: true, 
      refetchOnWindowFocus: true,            // Disable retries on failure
    },
  });
  
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
    error: errorUsers,
    refetch: refetchUsers,
  } = useApiGetQuery({
    key: "users",
    endpoint: `${getUsersPath}`,
    params: {
      status: "active", // Add status=all
      userRole: "all", // Add userRole=all
    },
    options: {
      // staleTime: 1000 * 60 * 5,
      // cacheTime: 1000 * 60 * 10,
      retry: false
    },
  });

  // console.log(serversListData,"serversListData")

  return (
   
    <div>
        <Tabs defaultValue="servers" className="w-full ">
          <TabsList className="overflow-x-auto">
            {["Servers", "Users", "Server Details", "Logs"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab.toLowerCase().replace(" ", "-")}
                className="text-nowrap"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="servers">
            <ServersTab
              data={serversListData}
              isLoading={isLoadingServersList}
              isError={isErrorServersList}
              error={errorServersList}
              refetch={refetchServersList} 
              refachUser={refetchUsers}

            />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab
              data={usersData}
              isLoading={isLoadingUsers}
              isError={isErrorUsers}
              error={errorUsers}
              refetchUsers={refetchUsers}
            />
          </TabsContent>
          <TabsContent value="server-details">
            <ServerDetailsTab
            data={serversListData}
             isLoading= {isLoadingServersList}
             isError= {isErrorServersList}
             error={errorServersList}
             refetch= {refetchServersList}
            />
          </TabsContent>
          <TabsContent value="logs">
            
            <LogsTab/>
          </TabsContent>
        </Tabs>
        </div>
 
  );
};

export default React.memo(AdminPanel);
