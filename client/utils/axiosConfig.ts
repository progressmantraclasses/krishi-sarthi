import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // change to your server url
});

// Helper function to set token
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export default api;
