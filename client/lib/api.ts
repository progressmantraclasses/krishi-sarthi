// client/api.ts
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

// --- Extend Axios with custom methods ---
interface CustomAxiosInstance extends AxiosInstance {
  setToken?: (token: string) => Promise<void>;
  loadToken?: () => Promise<void>;
  clearToken?: () => Promise<void>;
  requestQueued?: () => Promise<void>;
}

const api: CustomAxiosInstance = axios.create({
  baseURL: "http://localhost:5000", // 👈 change to your backend URL
  timeout: 10000,
});

// --- Token handling ---
api.setToken = async (token: string) => {
  await SecureStore.setItemAsync("token", token);
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

api.loadToken = async () => {
  const token = await SecureStore.getItemAsync("token");
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
};

api.clearToken = async () => {
  await SecureStore.deleteItemAsync("token");
  delete api.defaults.headers.common["Authorization"];
};

// --- Offline Queue System ---
const queue: AxiosRequestConfig[] = [];
let online = true;

api.interceptors.request.use(
  async (config) => {
    if (!online) {
      queue.push(config);
      return Promise.reject({ message: "Queued request", config });
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.requestQueued = async () => {
  while (queue.length) {
    const req = queue.shift();
    if (req) await api(req);
  }
};

// --- Optional: Listen to network status ---
export const setOnline = (status: boolean) => {
  online = status;
  if (status) api.requestQueued?.();
};

export default api;
