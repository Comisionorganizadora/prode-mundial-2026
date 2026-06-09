"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!name || !password) {
      setError("Completá todos los campos");
      return;
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .ilike("name", name)
      .single();

    if (userError || !user) {
      setError("Usuario no habilitado por la comisión");
      return;
    }

    if (password !== user.password) {
      setError("Clave incorrecta");
      return;
    }

    localStorage.setItem("user_id", String(user.id));
    localStorage.setItem("user_name", user.name);

    if (user.name.toUpperCase() === "COMISION") {
      localStorage.setItem("user_role", "admin");
      window.location.href = "/admin";
    } else {
      localStorage.setItem("user_role", "player");
      window.location.href = "/prode";
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-3xl font-bold">
        🏆 Prode Mundial 2026
      </h1>

      <input
        className="border p-2 rounded"
        placeholder="Tu nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="border p-2 rounded"
        placeholder="Contraseña"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        className="bg-black text-white px-4 py-2 rounded"
        onClick={handleLogin}
      >
        Entrar
      </button>

      {error && (
        <p className="text-red-500">
          {error}
        </p>
      )}
    </main>
  );
}
