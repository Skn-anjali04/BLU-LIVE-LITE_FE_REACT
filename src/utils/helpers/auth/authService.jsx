// Store tokens in sessionStorage
// export const setTokens = ({ accessToken, refreshToken }) => {
//     sessionStorage.setItem('accessToken', accessToken);
//     sessionStorage.setItem('refreshToken', refreshToken);
//   };

import { encryptData } from "./encrypt-decrypt";

export const setTokens = ({ accessToken ,userRole}) => {

    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('userRole',encryptData(userRole));
  };
  
  export const getSesstionClear =()=>{
    sessionStorage.clear()
  }
  // Retrieve access token from sessionStorage
  export const getAccessToken = () => sessionStorage.getItem('accessToken');
  // export const getuserRole = () => sessionStorage.getItem('userRole');
  
  // Retrieve refresh token from sessionStorage
//   export const getRefreshToken = () => sessionStorage.getItem('refreshToken');
  
  // Clear tokens from sessionStorage (logout)
  export const clearTokens = () => {
    sessionStorage.removeItem('accessToken');
    // sessionStorage.setItem('userRole', userRole);
    // sessionStorage.removeItem('refreshToken');
  };
  