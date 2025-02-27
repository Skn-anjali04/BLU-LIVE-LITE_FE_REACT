import { Navbar } from "@/components/ui/navbar";
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import LobbyTable from "./lobbyTable";
function PlayoutDashboard() {
  return (
    <div >
     
        <Card className=" border-0">
          <CardHeader className="p-4">
            <b>User Lobby</b>
          </CardHeader>
          <CardContent className="p-4 pt-0 overflow-hidden">
            <div className="overflow-x-auto">
             
            <LobbyTable/>
            </div>
          </CardContent>
        </Card>
      
    </div>
  );
}

export default PlayoutDashboard;
