// Polyfill for amazon-cognito-identity-js
if (typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}
if (typeof (global as any).crypto === 'undefined') {
  (global as any).crypto = window.crypto;
}

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./lib/auth";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
