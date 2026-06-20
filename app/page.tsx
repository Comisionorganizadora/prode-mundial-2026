"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setError("");

      if (!name || !password) {
        setError("Completá todos los campos");
        return;
      }

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .ilike("name", name.trim())
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
    } catch (err) {
      console.error(err);
      setError("Error al iniciar sesión");
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-6 bg-cover bg-center"
      style={{
        backgroundImage: "url('/imagen.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="w-full max-w-md bg-black/75 backdrop-blur-md border border-yellow-500/30 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-3">🏆</div>

            <h1 className="text-5xl font-extrabold text-white leading-tight">
              PRODE
            </h1>

            <h2 className="text-4xl font-extrabold text-yellow-400">
              MUNDIAL 2026
            </h2>

            <p className="text-gray-300 mt-4">
              Viví el Mundial, jugá el Prode,
              <br />
              competí y ganá.
            </p>
          </div>

          <div className="space-y-4">
            <input
              className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-gray-300"
              placeholder="Tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-gray-300"
              placeholder="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition"
              onClick={handleLogin}
            >
              ⚽ INGRESAR
            </button>

            {error && (
              <p className="text-red-400 text-center">
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-yellow-500/20 p-6 bg-black/40">
          <h3 className="text-center text-yellow-400 font-bold text-xl mb-5">
            ⭐ SALÓN DE LA FAMA ⭐
          </h3>

          <div className="space-y-3">
            <div className="border border-yellow-600 rounded-xl p-3 text-center bg-yellow-500/5">
              <div className="text-white font-bold text-lg">🏆 LEO</div>
              <div className="text-yellow-300">Qatar 2022</div>
            </div>

            <div className="border border-yellow-600 rounded-xl p-3 text-center bg-yellow-500/5">
              <div className="text-white font-bold text-lg">🏆 JUANJO</div>
              <div className="text-yellow-300">Rusia 2018</div>
            </div>

            <div className="border border-yellow-600 rounded-xl p-3 text-center bg-yellow-500/5">
              <div className="text-white font-bold text-lg">🏆 SUSY</div>
              <div className="text-yellow-300">Brasil 2014</div>
            </div>
          </div>

          <div className="mt-6 text-center text-yellow-400 font-bold text-lg">
            ⭐ ¿QUIÉN SERÁ EL PRÓXIMO? ⭐
          </div>
        </div>
      </div>
    </main>
  );
}