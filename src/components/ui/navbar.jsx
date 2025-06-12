
import { LogOut, Menu, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import appLogo from "@/assets/images/app-white-logo.png"
import { toast } from "@/hooks/use-toast"
import { useLocation, useNavigate } from "react-router-dom"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { decryptData } from "@/utils/helpers/auth/encrypt-decrypt"
import { useInstance } from "../custom-components/InstanceContext"

export function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { instanceName, instanceDataText, isInstanceLoaded } = useInstance()

  const userRole = decryptData(sessionStorage.getItem("userRole"))
  const userName = decryptData(sessionStorage.getItem("user"))

  const handleLogout = () => {
    sessionStorage.clear()
    localStorage.clear()
    navigate("/")
    toast({
      title: "LogOut",
      description: "Logout successfully!",
      variant: "success",
    })
  }

  const showInstanceInfo = isInstanceLoaded && location.pathname.includes("dashboard")

  return (
    <nav className="flex top-0 left-0 right-0 z-50 items-center justify-between px-4 md:px-6 py-4 bg-[#716c6c] border-b border-gray-800">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <img
          src={appLogo || "/placeholder.svg"}
          alt="BluLive Life"
          width={120}
          height={40}
          className="h-6 md:h-8 w-auto"
        />
      </div>

      {/* Desktop Instance Info */}
      {showInstanceInfo && instanceName && instanceDataText && (
        <h1 className="hidden md:block text-lg xl:text-xl font-bold text-white text-center">
          {instanceName}
          {instanceDataText && ` (${instanceDataText})`}
        </h1>
      )}

      {/* Desktop User Info & Logout */}
      <div className="hidden md:flex items-center gap-4">
        <span className="font-medium text-white text-sm lg:text-base">username: {userName}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="p-0 bg-transparent hover:bg-gray-600 outline-none hover:text-white text-white"
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

      {/* Mobile Dropdown Menu */}
      <div className="sm:hidden">
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="text-white hover:bg-gray-600">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent
      align="end"
      className="w-64 bg-[#4a4a4a] text-white border border-gray-700 shadow-lg z-50"
    >
      {/* Mobile Instance Info */}
      {showInstanceInfo && instanceName && instanceDataText && (
        <>
          <div className="p-4">
            <p className="font-semibold text-white">{instanceName}</p>
            <p className="text-xs text-gray-300">{instanceDataText}</p>
          </div>
          <DropdownMenuSeparator className="bg-gray-600" />
        </>
      )}

      {/* User Info Section */}
      <div className="p-4 flex items-center gap-3">
        <div className="bg-gray-600 rounded-full p-2">
          <User className="h-5 w-5 text-gray-300" />
        </div>
        <div className="flex flex-col">
          <span className="text-white font-medium text-sm">{userName}</span>
          <span className="text-gray-300 text-xs">Role: {userRole || "tech"}</span>
        </div>
      </div>

      <DropdownMenuSeparator className="bg-gray-600" />

      {/* Logout */}
      <DropdownMenuItem
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2 text-rose-400 hover:bg-[#5a5a5a] cursor-pointer"
      >
        <LogOut className="h-5 w-5" />
        <span className="font-medium">LogOut</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>

    </nav>
  )
}



