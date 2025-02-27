import { useQuery } from "@tanstack/react-query";
import { fetchData } from "../apiService";


// export const useApiGetQuery = ({ key, endpoint, params, options = {} }) => {
//   return useQuery({
//     queryKey: [key, params], // Cache key based on endpoint and params
//     queryFn: () => fetchData(endpoint, params, { headers: options.headers }),
//     ...options,
//   });
// };

export const useApiGetQuery = ({ key, endpoint, params, options = {} }) => {
  return useQuery({
    queryKey: [key, params], // Cache key based on endpoint and params
    queryFn: () => fetchData(endpoint, params, { headers: options.headers }),
    enabled: options.enabled, // Default to true if not specified
       networkMode: 'always',
    ...options,
  });
};
// import { useQuery } from "@tanstack/react-query";
// import { fetchData } from "../apiService";

// export const useApiGetQuery = ({ key, endpoint, params, options = {} }) => {
//   const { data, isLoading, isError, error, refetch } = useQuery({
//     queryKey: [key, params], // Cache key based on endpoint and params
//     queryFn: () => fetchData(endpoint, params),
//     ...options,
//   });

//   return { data, isLoading, isError, error, refetch };
// };

// import { useQuery } from "@tanstack/react-query";
// import { fetchData } from "../apiService";


// // export const useApiGetQuery = ({ key, endpoint, params, options = {} }) => {
// //   return useQuery({
// //     queryKey: [key, params], // Cache key based on endpoint and params
// //     queryFn: () => fetchData(endpoint, params, { headers: options.headers }),
// //     ...options,
// //   });
// // };

// export const useApiGetQuery = ({ key, endpoint, params, options = {} }) => {
//   return useQuery({
//     queryKey: [key, params], // Cache key based on endpoint and params
//     queryFn: () => fetchData(endpoint, params, { headers: options.headers }),
//     enabled: options.enabled, // Default to true if not specified
//     ...options,
//   });
// };
// // import { useQuery } from "@tanstack/react-query";
// // import { fetchData } from "../apiService";

// // export const useApiGetQuery = ({ key, endpoint, params, options = {} }) => {
// //   const { data, isLoading, isError, error, refetch } = useQuery({
// //     queryKey: [key, params], // Cache key based on endpoint and params
// //     queryFn: () => fetchData(endpoint, params),
// //     ...options,
// //   });

// //   return { data, isLoading, isError, error, refetch };
// // };
