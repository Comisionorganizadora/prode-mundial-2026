"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

export default function AdminPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("user_role");

    if (role !== "admin") {
      window.location.href = "/prode";
      return;
    }

    setAuthorized(true);
    loadData();
  }, []);

  const loadData = async () => {
    const [{ data: matchesData }, { data: usersData }, { data: predictionsData }, { data: stagesData }] =
      await Promise.all([
        supabase
          .from("matches")
          .select("*")
          .order("match_number", { ascending: true }), // 🔥 FIX IMPORTANTE

        supabase.from("users").select("*").neq("name", "COMISION").order("name"),

        supabase.from("predictions").select("*"),

        supabase.from("stages").select("*").order("id", { ascending: true }),
      ]);

    setMatches(matchesData || []);
    setUsers(usersData || []);
    setPredictions(predictionsData || []);
    setStages(stagesData || []);
    setLoading(false);
  };

  const updateMatch = (matchId: string, field: string, value: any) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId ? { ...m, [field]: value } : m
      )
    );
  };

  const toggleStage = async (id: number, isOpen: boolean) => {
    await supabase
      .from("stages")
      .update({ is_open: isOpen })
      .eq("id", id);

    setStages((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, is_open: isOpen } : s
      )
    );
  };


  const openAllStages = async () => {
    await supabase
  .from("stages")
  .update({ is_open: true })
  .not("id", "is", null);
    await loadData();
    alert("✅ Todas las fechas abiertas");
  };

  const closeAllStages = async () => {
    await supabase
  .from("stages")
  .update({ is_open: false })
  .not("id", "is", null);
    await loadData();
    alert("✅ Todas las fechas cerradas");
  };

  const resetResults = async () => {
    if (!confirm("¿Borrar TODOS los resultados cargados?")) return;

    await supabase
      .from("matches")
      .update({
        home_score: null,
        away_score: null,
        is_finished: false,
        qualified_team: null,
      })
      .gt("match_number", 0);

    await supabase
      .from("predictions")
      .update({ points: 0 })
      .not("id", "is", null)

    await loadData();
    alert("✅ Resultados borrados");
  };

const deletePredictions = async () => {
  if (!confirm("¿Borrar TODOS los pronósticos?")) return;

  const { error: predictionsError } = await supabase
    .from("predictions")
    .delete()
    .not("id", "is", null);

  const { error: specialError } = await supabase
    .from("special_predictions")
    .delete()
    .not("id", "is", null);

  if (predictionsError || specialError) {
    alert(
      predictionsError?.message ||
      specialError?.message ||
      "Error borrando pronósticos"
    );
    return;
  }

  await loadData();

  alert("✅ Pronósticos eliminados");
};

const resetTournament = async () => {
    if (!confirm("⚠️ Esto borrará TODO el torneo")) return;

    const code = prompt("Escriba RESETEAR para continuar");

    if (code !== "RESETEAR") return;

    await supabase
      .from("matches")
      .update({
        home_score: null,
        away_score: null,
        is_finished: false,
        qualified_team: null,
      })
      .gt("match_number", 0);

    await supabase
  .from("predictions")
  .delete()
  .not("id", "is", null);

await supabase
  .from("special_predictions")
  .delete()
  .not("id", "is", null);
    await supabase
  .from("stages")
  .update({ is_open: false })
  .not("id", "is", null);

    await loadData();
    alert("🚨 Torneo reseteado");
  };


  const calculatePoints = (p: any, match: any) => {
    if (match.home_score == null || match.away_score == null) return 0;

    const ph = Number(p.predicted_home);
    const pa = Number(p.predicted_away);
    const mh = Number(match.home_score);
    const ma = Number(match.away_score);

    let points = 0;

    const predResult = ph > pa ? "H" : ph < pa ? "A" : "D";
    const realResult = mh > ma ? "H" : mh < ma ? "A" : "D";

    if (predResult === realResult) points += 3;
    if (ph === mh && pa === ma) points += 1;

    if (
      match.is_knockout &&
      p.predicted_qualifier &&
      match.qualified_team &&
      p.predicted_qualifier === match.qualified_team
    ) {
      points += 1;
    }

    if (p.is_double) points *= 2;

    return points;
  };

  const recalculateMatchPoints = async (match: any) => {
    const { data } = await supabase
      .from("predictions")
      .select("*")
      .eq("match_id", match.id);

    if (!data) return;

    for (const p of data) {
      const points = calculatePoints(p, match);

      await supabase
        .from("predictions")
        .update({ points })
        .eq("id", p.id);
    }
  };


  const propagateWinner = async (
    matchNumber: number,
    winner: string,
    loser?: string
  ) => {
    const { data: nextMatches } = await supabase
      .from("matches")
      .select("*");

    if (!nextMatches) return;

    for (const nextMatch of nextMatches) {
      const updates: any = {};

      if (nextMatch.team_home === `Ganador Partido ${matchNumber}`) {
        updates.team_home = winner;
      }

      if (nextMatch.team_away === `Ganador Partido ${matchNumber}`) {
        updates.team_away = winner;
      }

      if (
        loser &&
        nextMatch.team_home === `Perdedor Partido ${matchNumber}`
      ) {
        updates.team_home = loser;
      }

      if (
        loser &&
        nextMatch.team_away === `Perdedor Partido ${matchNumber}`
      ) {
        updates.team_away = loser;
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from("matches")
          .update(updates)
          .eq("id", nextMatch.id);
      }
    }
  };


  const saveMatch = async (match: any) => {
    const home = match.home_score === "" ? null : Number(match.home_score);
    const away = match.away_score === "" ? null : Number(match.away_score);

    if ((home ?? 0) < 0 || (away ?? 0) < 0) { alert("No se permiten goles negativos"); return; }

    let qualified = match.qualified_team;

    if (
      match.is_knockout &&
      home != null &&
      away != null &&
      home !== away
    ) {
      qualified = home > away ? match.team_home : match.team_away;
    }

    const { error } = await supabase
      .from("matches")
      .update({
        home_score: home,
        away_score: away,
        is_finished: match.is_finished,
        is_knockout: match.is_knockout,
        qualified_team: qualified || null,
      })
      .eq("id", match.id);

    if (error) {
      alert("Error guardando resultado");
      return;
    }

    await recalculateMatchPoints(match);

    if (
      match.is_knockout &&
      qualified &&
      match.match_number
    ) {
      const loser =
        qualified === match.team_home
          ? match.team_away
          : match.team_home;

      await propagateWinner(
        match.match_number,
        qualified,
        loser
      );
    }

    await loadData();

    alert("✅ Guardado OK");
  };

  const getPrediction = (userId: string, matchId: string) =>
    predictions.find((p) => p.user_id === userId && p.match_id === matchId);

  const getPredictionColor = (p: any, match: any) => {
    if (!p || match.home_score == null || match.away_score == null) return "";

    const ph = Number(p.predicted_home);
    const pa = Number(p.predicted_away);
    const mh = Number(match.home_score);
    const ma = Number(match.away_score);

    if (ph === mh && pa === ma) return "bg-green-200";

    const pr = ph > pa ? "H" : ph < pa ? "A" : "D";
    const rr = mh > ma ? "H" : mh < ma ? "A" : "D";

    if (pr === rr) return "bg-yellow-100";

    return "bg-red-100";
  };

  if (!authorized) return null;

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="p-4">Cargando...</main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="max-w-3xl mx-auto p-3">

        <h1 className="text-xl font-bold mb-3">🔧 Administración</h1>


        <div className="border rounded p-3 mb-4 bg-gray-50">
          <h2 className="font-bold mb-2">⚙️ Acciones Globales</h2>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={openAllStages}
              className="bg-green-600 text-white px-3 py-2 rounded text-sm"
            >
              🔓 Abrir todas
            </button>

            <button
              onClick={closeAllStages}
              className="bg-gray-600 text-white px-3 py-2 rounded text-sm"
            >
              🔒 Cerrar todas
            </button>

            <button
              onClick={resetResults}
              className="bg-orange-500 text-white px-3 py-2 rounded text-sm"
            >
              ♻️ Borrar resultados
            </button>

            <button
              onClick={deletePredictions}
              className="bg-red-600 text-white px-3 py-2 rounded text-sm"
            >
              🗑️ Borrar pronósticos
            </button>

            <button
              onClick={resetTournament}
              className="bg-red-900 text-white px-3 py-2 rounded text-sm"
            >
              🚨 Reset total
            </button>
          </div>
        </div>


        {/* FECHAS */}
        <div className="bg-gray-50 border rounded p-3 mb-4">
          <h2 className="font-bold mb-2">📅 Fechas</h2>

          <div className="flex flex-wrap gap-2">
            {stages.map((s) => (
              <button
                key={s.id}
                onClick={() => toggleStage(s.id, !s.is_open)}
                className={`px-3 py-1 rounded border text-sm ${
                  s.is_open ? "bg-green-600 text-white" : "bg-white"
                }`}
              >
                Fecha {s.id}
              </button>
            ))}
          </div>
        </div>

        {/* PARTIDOS */}
        {matches.map((match) => (
          <div key={match.id} className="border rounded p-3 mb-3 bg-white">

            <div className="text-xs text-gray-500 mb-1">
              #{match.match_number}{" "}
              {match.is_finished && "✔ FINAL"}{" "}
              {match.is_knockout ? "⚔ ELIMINACIÓN" : "⚽ GRUPOS"}
            </div>

            <h2 className="font-semibold text-sm">
              {match.team_home} vs {match.team_away}
            </h2>

            <div className="flex gap-2 my-2">
              <input
                type="number"
                className="border p-1 w-14 text-sm"
                value={match.home_score ?? ""}
                onChange={(e) =>
                  updateMatch(match.id, "home_score", e.target.value)
                }
              />

              <input
                type="number"
                className="border p-1 w-14 text-sm"
                value={match.away_score ?? ""}
                onChange={(e) =>
                  updateMatch(match.id, "away_score", e.target.value)
                }
              />
            </div>

            {/* FLAGS ADMIN */}
            <div className="flex gap-3 text-xs mb-2">
              <label>
                <input
                  type="checkbox"
                  checked={match.is_finished || false}
                  onChange={(e) =>
                    updateMatch(match.id, "is_finished", e.target.checked)
                  }
                />{" "}
                Finalizado
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={match.is_knockout || false}
                  onChange={(e) =>
                    updateMatch(match.id, "is_knockout", e.target.checked)
                  }
                />{" "}
                Eliminación
              </label>
            </div>

            {/* CLASIFICADO EN CASO DE EMPATE */}
            {match.is_knockout && (
              <div className="mb-2 text-xs">
                <div className="font-semibold">Seleccionar clasificado:</div>

                <select
                  className="border p-1 text-xs"
                  value={match.qualified_team || ""}
                  onChange={(e) =>
                    updateMatch(match.id, "qualified_team", e.target.value)
                  }
                >
                  <option value="">-- elegir --</option>
                  <option value={match.team_home}>{match.team_home}</option>
                  <option value={match.team_away}>{match.team_away}</option>
                </select>
              </div>
            )}

            <button
              onClick={() => saveMatch(match)}
              className="bg-green-600 text-white px-3 py-1 rounded text-xs"
            >
              Guardar resultado
            </button>

            {/* PRONÓSTICOS */}
            <div className="mt-3">
              <table className="w-full text-sm">
                <tbody>
                  {users.map((u) => {
                    const p = getPrediction(u.id, match.id);

                    return (
                      <tr
                        key={u.id}
                        className={`border-b ${getPredictionColor(p, match)}`}
                      >
                        <td className="p-1 font-medium text-base">{u.name}</td>
                        <td className="p-1 text-center">
                          {p?.is_double ? "⭐ " : ""}
{p
  ? `${p.predicted_home}-${p.predicted_away}${
      Number(p.predicted_home) === Number(p.predicted_away) &&
      p.predicted_qualifier
        ? ` → ${p.predicted_qualifier}`
        : ""
    }`
  : "-"}
                        </td>
                        <td className="p-1 text-center font-bold">
                          {p?.points ?? 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        ))}
      </main>
    </>
  );
}