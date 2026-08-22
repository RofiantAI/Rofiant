import { useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ChatPage } from "@/pages/ChatPage";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { TitleBar } from "@/components/layout/TitleBar";
import { UpdateToast } from "@/components/layout/UpdateToast";
import { GlobalShortcuts } from "@/components/layout/GlobalShortcuts";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore, FONT_SIZE_PX } from "@/stores/useUIStore";

function App() {
  useEffect(() => useAuthStore.getState().init(), []);

  const theme = useUIStore((s) => s.theme);
  useEffect(() => {
    if (theme === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Root font-size drives every rem-based size in the app, so one property
  // scales the whole UI.
  const fontSize = useUIStore((s) => s.fontSize);
  useEffect(() => {
    document.documentElement.style.fontSize = `${FONT_SIZE_PX[fontSize]}px`;
  }, [fontSize]);

  const reduceMotion = useUIStore((s) => s.reduceMotion);
  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(reduceMotion);
  }, [reduceMotion]);

  return (
    <HashRouter>
      <GlobalShortcuts />
      <div className="flex h-screen w-screen flex-col overflow-hidden">
        <TitleBar />
        <div className="min-h-0 flex-1">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
        <UpdateToast />
      </div>
    </HashRouter>
  );
}

export default App;
