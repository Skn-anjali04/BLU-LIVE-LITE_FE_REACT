import axios from 'axios';
import { getAccessToken, clearTokens } from '../auth/authService';

// Create an axios instance
const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BLULIVE_API_URL}:${import.meta.env.VITE_BLULIVE_API_PORT}`, // API base URL from .env
  timeout: 10000, // Timeout for requests
});

// Add request interceptor to include the access token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.token = `Bearer ${token}`; // Add the access token in Authorization header
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 Unauthorized errors (token invalid or expired)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearTokens();
      window.location.href = '/'; // Redirect to login on unauthorized error
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;

// import axios from 'axios';
// import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../auth/authService';


// // Create an axios instance
// const axiosInstance = axios.create({
//   baseURL:API_BASE_URL,  // Make sure to set your API base URL here
//   timeout: 10000, // Timeout for requests
// });

// // Add request interceptor to include the access token
// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = getAccessToken();
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;  // Add the access token in Authorization header
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Handle 401 Unauthorized errors (token expired)
// axiosInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
    
//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
//       const refreshToken = getRefreshToken();

//       if (refreshToken) {
//         try {
//           const response = await axios.post('/auth/refresh-token', { token: refreshToken });
//           setTokens(response.data); // Save new tokens
//           originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
//           return axiosInstance(originalRequest); // Retry the original request
//         } catch (refreshError) {
//           clearTokens();
//           window.location.href = '/login';  // Redirect to login if refresh fails
//         }
//       } else {
//         clearTokens();
//         window.location.href = '/login';
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;
