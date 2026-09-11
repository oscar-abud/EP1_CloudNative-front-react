import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { msalInstance } from "@/auth/msalInstance";
import { useAuthStore } from "@/store/authStore";
import "./globals.css";

await msalInstance.initialize();

// Si venimos de vuelta de Microsoft (loginRedirect/logoutRedirect), procesa
// la respuesta y deja la cuenta activa antes de arrancar la app.
const redirectResult = await msalInstance.handleRedirectPromise();
if (redirectResult?.account) {
  msalInstance.setActiveAccount(redirectResult.account);
}

useAuthStore.getState().init();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
