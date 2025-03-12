
import { decryptData } from "@/utils/helpers/auth/encrypt-decrypt";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRoles }) => {
  const isAuthenticated = Boolean(sessionStorage.getItem("accessToken"));
  const userRoleData = sessionStorage.getItem("userRole");

  // Ensure that userRoleData is not null and that decryptData does not return null
  const userRole = userRoleData ? decryptData(userRoleData)?.toLowerCase() : null;

  if (!isAuthenticated || !requiredRoles?.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
