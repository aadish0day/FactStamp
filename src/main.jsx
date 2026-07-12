import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { DataProvider } from "./context/DataContext.jsx";
import { HelmetProvider } from "react-helmet-async";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <MotionConfig reducedMotion="user">
              <App />
              <Toaster richColors position="top-right" closeButton />
            </MotionConfig>
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  </React.StrictMode>,
);
