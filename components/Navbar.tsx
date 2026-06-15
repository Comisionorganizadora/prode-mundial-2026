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
    <nav className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-b-4 border-yellow-500 shadow-lg mb-6">
      <div className="max-w-7xl mx-auto px-4 py-3">

        <div className="flex flex-col lg:flex-row lg:items-center gap-4">

          <div className="flex flex-col">
            <span className="font-bold text-xl text-yellow-400">
              🏆 PRODE MUNDIAL 2026
            </span>

            <span className="text-xs text-gray-300">
              United States • México • Canadá
            </span>
          </div>

          {!isAdmin && (
            <div className="flex flex-wrap gap-3 lg:gap-5">

              <Link
                href="/prode"
                className="hover:text-yellow-300 transition"
              >
                🏆 Pronósticos
              </Link>

              <Link
                href="/especiales"
                className="hover:text-yellow-300 transition"
              >
                ⭐ Finalistas y Campeón
              </Link>

              <Link
                href="/ranking"
                className="hover:text-yellow-300 transition"
              >
                📊 Posiciones
              </Link>

              <Link
                href="/estadisticas"
                className="hover:text-yellow-300 transition"
              >
                🏅 Estadísticas
              </Link>

              <Link
                href="/reglamento"
                className="hover:text-yellow-300 transition"
              >
                📜 Reglamento
              </Link>

              <Link
                href="/premios"
                className="hover:text-yellow-300 transition"
              >
                🎁 Premios
              </Link>

            </div>
          )}

          {isAdmin && (
            <div className="flex flex-wrap gap-3 lg:gap-5">

              <Link
                href="/ranking"
                className="hover:text-yellow-300 transition"
              >
                📊 Posiciones
              </Link>

              <Link
                href="/admin-specials"
                className="hover:text-yellow-300 transition"
              >
                🏆 Especiales Admin
              </Link>

              <Link
                href="/admin"
                className="hover:text-yellow-300 transition"
              >
                🔧 Admin
              </Link>

            </div>
          )}

          <button
            onClick={handleLogout}
            className="lg:ml-auto bg-red-600 hover:bg-red-700 px-3 py-2 rounded font-semibold transition"
          >
            🚪 Salir
          </button>

        </div>

      </div>
    </nav>
  );
}