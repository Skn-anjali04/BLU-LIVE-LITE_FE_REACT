import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { InstanceProvider } from "./components/custom-components/InstanceContext";
import { ConfigProvider } from "./components/custom-components/ConfigContext";

const queryClient = new QueryClient();
createRoot(document.getElementById("root")).render(
  // <StrictMode>
    <QueryClientProvider client={queryClient}>
       <ConfigProvider>
      <InstanceProvider>
      <App />
      </InstanceProvider></ConfigProvider>
    </QueryClientProvider>
  // </StrictMode>
);
