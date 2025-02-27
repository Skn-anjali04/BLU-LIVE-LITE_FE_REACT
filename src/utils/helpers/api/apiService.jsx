import axiosInstance from "./axiosInstance";

// Generic GET Request
export const fetchData = async (endpoint, params = {}, config = {}) => {
  try {
    return await axiosInstance.get(endpoint, { params, ...config });
  } catch (error) {
    console.error(`GET Request Failed: ${error.message}`);
    throw error;
  }
};

// Generic POST Request
export const postData = async (endpoint, payload = {}, config = {}) => {
  try {
    return await axiosInstance.post(endpoint, payload, config);
  } catch (error) {
    console.error(`POST Request Failed: ${error.message}`);
    throw error;
  }
};

// Generic PUT Request
export const putData = async (endpoint, payload = {}, config = {}) => {
  try {
    return await axiosInstance.put(endpoint, payload, config);
  } catch (error) {
    console.error(`PUT Request Failed: ${error.message}`);
    throw error;
  }
};

// Generic DELETE Request
export const deleteData = async (endpoint, config = {}) => {
  try {
    return await axiosInstance.delete(endpoint, config);
  } catch (error) {
    console.error(`DELETE Request Failed: ${error.message}`);
    throw error;
  }
};

// import axiosInstance from "./axiosInstance";


// // Generic GET Request
// export const fetchData = (endpoint, params = {}) =>
//   axiosInstance.get(endpoint, { params });

// // Generic POST Request
// export const postData = (endpoint, payload) =>
//   axiosInstance.post(endpoint, payload);

// // Generic PUT Request
// export const putData = (endpoint, payload) =>
//   axiosInstance.put(endpoint, payload);

// // Generic DELETE Request
// export const deleteData = (endpoint) => axiosInstance.delete(endpoint);
