"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

export default function AdminSpecialsPage() {
  const [loading, setLoading] = useState(true);

  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [specialPredictions, setSpecialPredictions] = useState<any[]>([]);

  const [specialResults, setSpecialResults] = useState<any>({
    semifinalist_1: "",
    semifinalist_2: "",
    semifinalist_3: "",
    semifinalist_4: "",
    runner_up: "",
    champion: "",
    is_published: false,
  });

  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("user_role");

    if (role !== "admin") {
      window.location.href = "/prode";
      return;
    }

    loadData();
  }, []);

  const loadData = async () => {
    const [
      { data: teamsData },
      { data: usersData },
      { data: predictionsData },
      { data: resultsData },
    ] = await Promise.all([
      supabase.from("teams").select("*").order("name"),
      supabase.from("users").select("*").neq("name", "COMISION").order("name"),
      supabase.from("special_predictions").select("*"),
      supabase
        .from("tournament_special_results")
        .select("*")
        .eq("id", 1)
        .single(),
    ]);

    setTeams(teamsData || []);
    setUsers(usersData || []);
    setSpecialPredictions(predictionsData || []);

    if (resultsData) {
      setSpecialResults(resultsData);
    }

    setLoading(false);
  };

  const updateField = (field: string, value: string) => {
    setSpecialResults((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =========================
  // AUTO SAVE (DEBOUNCE)
  // =========================
  useEffect(() => {
    if (loading) return;

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }

    saveTimeout.current = setTimeout(() => {
      saveResultsAuto();
    }, 800);

    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, [specialResults]);

  const saveResultsAuto = async () => {
    const { error } = await supabase
      .from("tournament_special_results")
      .update({
        semifinalist_1: specialResults.semifinalist_1,
        semifinalist_2: specialResults.semifinalist_2,
        semifinalist_3: specialResults.semifinalist_3,
        semifinalist_4: specialResults.semifinalist_4,
        runner_up: specialResults.runner_up,
        champion: specialResults.champion,
      })
      .eq("id", 1);

    if (error) {
      console.error("Error auto-guardando especiales:", error.message);
    }
  };

  const saveManual = async () => {
    await saveResultsAuto();
    alert("💾 Guardado manual exitoso");
  };

  const togglePublished = async () => {
    await supabase
      .from("tournament_special_results")
      .update({
        is_published: !specialResults.is_published,
      })
      .eq("id", 1);

    await loadData();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="p-6">Cargando...</main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">🏆 Especiales Admin</h1>

        {/* ESTADO */}
        <div className="border rounded p-4 mb-6 bg-gray-50">
          <h2 className="font-bold mb-2">Estado de Especiales</h2>

          <div className="mb-3">
            {specialResults.is_published ? "🔴 Cerrados" : "🟢 Abiertos"}
          </div>

          <button
            onClick={togglePublished}
            className="bg-blue-600 text-white px-4 py-2 rounded mr-3"
          >
            {specialResults.is_published
              ? "Abrir Especiales"
              : "Cerrar Especiales"}
          </button>

          <button
            onClick={saveManual}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            💾 Guardar manual
          </button>
        </div>

        {/* RESULTADOS */}
        <div className="border rounded p-4 mb-6">
          <h2 className="font-bold mb-4">Resultados Oficiales</h2>

          {[
            "semifinalist_1",
            "semifinalist_2",
            "semifinalist_3",
            "semifinalist_4",
          ].map((field, index) => (
            <div key={field} className="mb-3">
              <label className="font-semibold">
                ⭐ Semifinalista {index + 1}
              </label>

              <select
                className="border p-2 w-full"
                value={specialResults[field] || ""}
                onChange={(e) => updateField(field, e.target.value)}
              >
                <option value="">Seleccionar</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.name}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div className="mb-3">
            <label className="font-semibold">🥈 Subcampeón</label>

            <select
              className="border p-2 w-full"
              value={specialResults.runner_up || ""}
              onChange={(e) => updateField("runner_up", e.target.value)}
            >
              <option value="">Seleccionar</option>
              {teams.map((team) => (
                <option key={team.id} value={team.name}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="font-semibold">🏆 Campeón</label>

            <select
              className="border p-2 w-full"
              value={specialResults.champion || ""}
              onChange={(e) => updateField("champion", e.target.value)}
            >
              <option value="">Seleccionar</option>
              {teams.map((team) => (
                <option key={team.id} value={team.name}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CHECKLIST COMPLETO */}
        <div className="border rounded p-4">
          <h2 className="font-bold mb-3">
            📋 Checklist + Pronóstico + Resultado + Puntos
          </h2>

          {users.map((user) => {
            const prediction = specialPredictions.find(
              (p) => p.user_id === user.id
            );

            if (!prediction) {
              return (
                <div key={user.id} className="border-b py-3">
                  {user.name} | ❌ Sin cargar
                </div>
              );
            }

            const officialSemis = [
              specialResults.semifinalist_1,
              specialResults.semifinalist_2,
              specialResults.semifinalist_3,
              specialResults.semifinalist_4,
            ];

            const predictedSemis = [
              prediction.semifinalist_1,
              prediction.semifinalist_2,
              prediction.semifinalist_3,
              prediction.semifinalist_4,
            ];

            const sfHits = predictedSemis.filter((team: string) =>
              officialSemis.includes(team)
            ).length;

            const subHit =
              prediction.runner_up === specialResults.runner_up;

            const champHit =
              prediction.champion === specialResults.champion;

            const points =
              sfHits * 3 + (subHit ? 3 : 0) + (champHit ? 10 : 0);

            return (
              <div
                key={user.id}
                className="border-b py-4 flex justify-between items-center"
              >
                {/* LEFT */}
                <div>
                  <div className="font-semibold text-lg">
                    {user.name}
                  </div>

                  <div className="text-sm text-gray-700 mt-1">
                    <div>
                      <span className="font-semibold">🎯 Pronóstico:</span>{" "}
                      SF1: {prediction.semifinalist_1} | SF2:{" "}
                      {prediction.semifinalist_2} | SF3:{" "}
                      {prediction.semifinalist_3} | SF4:{" "}
                      {prediction.semifinalist_4} | SUB:{" "}
                      {prediction.runner_up} | CAM:{" "}
                      {prediction.champion}
                    </div>

                    <div className="mt-1">
                      <span className="font-semibold">📊 Resultado:</span>{" "}
                      SF {sfHits}/4 | SUB {subHit ? "✔" : "✘"} | CAM{" "}
                      {champHit ? "✔" : "✘"}
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="text-2xl font-bold">⭐ {points}</div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}