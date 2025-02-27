// import { Navigate } from "react-router-dom";

// const ProtectedRoute = ({ children, requiredRole }) => {
//   const isAuthenticated = Boolean(sessionStorage.getItem("accessToken"));
//   const userRole = sessionStorage.getItem("userRole")?.toLowerCase();
//   console.log(requiredRole,"1234")
//   if (!isAuthenticated || userRole !== requiredRole) {
//     return <Navigate to="/" replace />;
//   }

//   return children;
// };

// export default ProtectedRoute;
import { decryptData } from "@/utils/helpers/auth/encrypt-decrypt";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRoles }) => {
  // const isAuthenticated = Boolean(sessionStorage.getItem("accessToken"));
  // const userRoleData = sessionStorage.getItem("userRole");
  // const userRole = decryptData(userRoleData)?.toLowerCase()
  // // Check if the user role is one of the allowed roles
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
