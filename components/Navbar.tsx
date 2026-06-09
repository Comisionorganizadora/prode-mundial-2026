"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("user_role");

    setIsAdmin(role === "admin");
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <nav className="bg-black text-white p-4 mb-6">
      <div className="max-w-6xl mx-auto flex gap-6 items-center">
        {!isAdmin && (
          <>
            <Link href="/prode">
              🏆 Pronósticos
            </Link>

            <Link href="/ranking">
              📊 Posiciones
            </Link>

            <Link href="/especiales">
              ⭐ Especiales
            </Link>
          </>
        )}

        {isAdmin && (
          <>
            <Link href="/ranking">
              📊 Posiciones
            </Link>

            <Link href="/admin-specials">
              🏆 Especiales Admin
            </Link>

            <Link href="/admin">
              🔧 Admin
            </Link>
          </>
        )}

        <button
          onClick={handleLogout}
          className="ml-auto bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
        >
          🚪 Salir
        </button>
      </div>
    </nav>
  );
}