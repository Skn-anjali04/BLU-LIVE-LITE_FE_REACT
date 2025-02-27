import { useMutation } from "@tanstack/react-query";
import { deleteData, postData, putData } from "../apiService";

export const useApiMutation = ({ endpoint, method, options = {} }) => {
  const mutationFn = ({ payload, headers }) => {
    const config = { data: payload, headers }; // Include headers in the request configuration
    if (method === "POST") return postData(endpoint, payload, config);
    if (method === "PUT") return putData(endpoint, payload, config);
    if (method === "DELETE") return deleteData(endpoint, config);
    throw new Error(`Unsupported method: ${method}`);
  };

  return useMutation({
    mutationFn,
    networkMode: 'always', // Ensures the mutation runs regardless of network status
    retry: false,
    ...options,
  });
};

// import { useMutation } from "@tanstack/react-query";
// import { deleteData, postData, putData } from "../apiService";

// export const useApiMutation = ({ endpoint, method, options = {} }) => {
//   const mutationFn = (data) => {
//     if (method === "POST") return postData(endpoint, data);
//     if (method === "PUT") return putData(endpoint, data);
//     if (method === "DELETE") return deleteData(endpoint);
//     throw new Error(`Unsupported method: ${method}`);
//   };

//   return useMutation({
//     mutationFn,
//     ...options,
//   });
// };
