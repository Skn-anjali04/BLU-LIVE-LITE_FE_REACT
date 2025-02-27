 

import { useState } from "react"
import { Pencil, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AssignInstanceDialog } from "./dilog-boxes/assign-instance-dialog"


export function ServersTabDemo() {
  const [selectedServer, setSelectedServer] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [serverData, setServerData] = useState([
    {
      name: "fancode",
      uid: "abccf185-bc27-46b1-a406-c544baab5134",
      assignedTo: ["Omkar", "operator11"],
    },
    {
      name: "english-1003-p-74bb73ee8a97",
      uid: "15f56c06-9227-4838-92a7-850c17f75185",
      assignedTo: [],
    },
  ])

  const handleEditClick = (server) => {
    setSelectedServer(server)
    setIsDialogOpen(true)
  }

  const handleAssignUsers = (users) => {
    if (selectedServer) {
      setServerData(prevData => 
        prevData.map(server => 
          server.uid === selectedServer.uid
            ? { ...server, assignedTo: users }
            : server
        )
      )
    }
  }

  const handleRemoveUser = (serverUid, userToRemove) => {
    setServerData(prevData => 
      prevData.map(server => 
        server.uid === serverUid
          ? { ...server, assignedTo: server.assignedTo.filter(user => user !== userToRemove) }
          : server
      )
    )
  }

  return (
    <>
      <Card className="bg-[#2A2A2A] border-0">
        <CardHeader className="p-4">
          <div className="flex justify-between items-center">
            <div className="text-gray-300">Current Server: 34.100.232.244</div>
            <Button className="bg-[#D3D3D3] hover:bg-gray-400 text-black">
              + Add Server
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-transparent">
                  <TableHead className="text-gray-400 font-normal">Name</TableHead>
                  <TableHead className="text-gray-400 font-normal">UID</TableHead>
                  <TableHead className="text-gray-400 font-normal">Assigned to</TableHead>
                  <TableHead className="text-gray-400 font-normal">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serverData?.map((server) => (
                  <TableRow key={server.uid} className="border-gray-700/50 hover:bg-transparent">
                    <TableCell>{server.name}</TableCell>
                    <TableCell>{server.uid}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        {server?.assignedTo?.map((user) => (
                          <span key={user} className="bg-gray-700 px-3 py-1 rounded-full flex items-center gap-2">
                            {user}
                            <button 
                              className="hover:text-gray-400"
                              onClick={() => handleRemoveUser(server?.uid, user)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:bg-gray-700"
                        onClick={() => handleEditClick(server)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AssignInstanceDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        instanceName={selectedServer?.name || ""}
        assignedUsers={selectedServer?.assignedTo || []}
        onAssign={handleAssignUsers}
      />
    </>
  )
}

