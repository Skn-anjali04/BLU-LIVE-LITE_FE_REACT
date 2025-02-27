import { LogOut, Moon, CloudSun } from "lucide-react";
import { Button } from "@/components/ui/button";
import appLogo from "@/assets/images/app-white-logo.png";
import { toast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { decryptData } from "@/utils/helpers/auth/encrypt-decrypt";
import { useInstance } from "../custom-components/InstanceContext";

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { instanceName, instanceDataText, isInstanceLoaded } = useInstance(); // Use context

  const userRole = decryptData(sessionStorage.getItem("userRole"));
  const userName = decryptData(sessionStorage.getItem("user"));

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    navigate("/");
    toast({
      title: "LogOut",
      description: "Logout successfully!",
      variant: "success",
    });
  };

  // Only show instance info if the path does NOT include "dashboard"
  const showInstanceInfo = isInstanceLoaded && location.pathname.includes("dashboard");

  return (
    <nav className="flex top-0 left-0 right-0 z-50 items-center justify-between px-6 py-4 bg-[#716c6c] border-b border-gray-800">
      <div className="flex items-center gap-2">
        <img
          src={appLogo}
          alt="BluLive Life"
          width={120}
          height={40}
          className="h-8 w-auto"
        />
      </div>
      {showInstanceInfo && instanceName && (
        <h1 className="text-xl font-bold">
          {instanceName}
          {instanceDataText && ` (${instanceDataText})`}
        </h1>
      )}
      <div className="flex items-center gap-4">
        <span className="font-medium">username: {userName}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="p-0 bg-transparent hover:bg-gray-600 outline-none hover:text-white"
                size="icon"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-700 text-white border-none">
              <p>LogOut {userRole}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </nav>
  );
}


