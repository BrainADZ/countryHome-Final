/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Sidemenu from "@/components/admin/Sidemenu";
import Topbar from "@/components/admin/Topbar";
import { useEffect, useState } from "react";

export default function AdminLayout({ children }: any) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const isLoginPage = window.location.pathname === "/admin/login";

    if (!token && !isLoginPage) {
      window.location.href = "/admin/login";
    } else {
      setIsLoggedIn(!!token);
      setLoading(false);
    }
  }, []);

  // while checking token, avoid flashing sidebar
  if (loading) return null;

  const isLoginPage = typeof window !== "undefined"
    && window.location.pathname === "/admin/login";

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* SHOW SIDEBAR ONLY IF LOGGED IN */}
      {!isLoginPage && isLoggedIn && <Sidemenu />}

      <div className="flex flex-col flex-1">
        {/* SHOW TOPBAR ONLY IF LOGGED IN */}
        {!isLoginPage && isLoggedIn && <Topbar />}

        <main className="p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
