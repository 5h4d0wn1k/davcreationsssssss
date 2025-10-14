"use client";

import { useState, useEffect } from "react";
import Login from "@/components/Login";
import Register from "@/components/Register";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  const [currentView, setCurrentView] = useState<"login" | "register" | "dashboard">("login");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch("http://localhost:4000/user/data", {
          credentials: "include",
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setCurrentView("dashboard");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView("login");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        {currentView === "login" && (
          <div>
            <Login onLogin={handleLogin} />
            <div className="mt-4 text-center">
              <button
                onClick={() => setCurrentView("register")}
                className="text-blue-400 hover:text-blue-300"
              >
                Don't have an account? Register
              </button>
            </div>
          </div>
        )}

        {currentView === "register" && (
          <div>
            <Register onRegister={() => setCurrentView("login")} />
            <div className="mt-4 text-center">
              <button
                onClick={() => setCurrentView("login")}
                className="text-blue-400 hover:text-blue-300"
              >
                Already have an account? Login
              </button>
            </div>
          </div>
        )}

        {currentView === "dashboard" && (
          <Dashboard user={user} onLogout={handleLogout} />
        )}
      </div>
    </div>
  );
}
