"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

export default function EspecialesPage() {
  const [userId, setUserId] = useState("");
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  const [officialResults, setOfficialResults] =
    useState<any>(null);

  const [specialScore, setSpecialScore] =
    useState<number | null>(null);

  const [allSpecials, setAllSpecials] =
    useState<any[]>([]);

  const [allUsers, setAllUsers] =
    useState<any[]>([]);

  const [champion, setChampion] = useState("");
  const [runnerUp, setRunnerUp] = useState("");

  const [semi1, setSemi1] = useState("");
  const [semi2, setSemi2] = useState("");
  const [semi3, setSemi3] = useState("");
  const [semi4, setSemi4] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const storedUserId = localStorage.getItem("user_id");

      if (!storedUserId) {
        window.location.href = "/";
        return;
      }

      setUserId(storedUserId);

      const { data: teamsData } = await supabase
        .from("teams")
        .select("*")
        .order("name");

      setTeams(teamsData || []);

      const { data: official } = await supabase
        .from("tournament_special_results")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      setOfficialResults(official);

      const { data: usersData } = await supabase
        .from("users")
        .select("id,name");

      const { data: specialsData } = await supabase
        .from("special_predictions")
        .select("*");

      setAllUsers(usersData || []);
      setAllSpecials(specialsData || []);

      const { data: existing } = await supabase
        .from("special_predictions")
        .select("*")
        .eq("user_id", storedUserId)
        .maybeSingle();

      if (existing) {
        setChampion(existing.champion || "");
        setRunnerUp(existing.runner_up || "");

        setSemi1(existing.semifinalist_1 || "");
        setSemi2(existing.semifinalist_2 || "");
        setSemi3(existing.semifinalist_3 || "");
        setSemi4(existing.semifinalist_4 || "");

        if (
          existing &&
          official &&
          official.is_published
        ) {
          let points = 0;

          const semis = [
            official.semifinalist_1,
            official.semifinalist_2,
            official.semifinalist_3,
            official.semifinalist_4,
          ];

          if (semis.includes(existing.semifinalist_1))
            points += 3;

          if (semis.includes(existing.semifinalist_2))
            points += 3;

          if (semis.includes(existing.semifinalist_3))
            points += 3;

          if (semis.includes(existing.semifinalist_4))
            points += 3;

          if (
            existing.runner_up === official.runner_up
          ) {
            points += 3;
          }

          if (
            existing.champion === official.champion
          ) {
            points += 10;
          }

          setSpecialScore(points);
        }

        setLocked(true);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  const saveSpecials = async () => {
    if (
      !champion ||
      !runnerUp ||
      !semi1 ||
      !semi2 ||
      !semi3 ||
      !semi4
    ) {
      alert("Debés completar todos los campos.");
      return;
    }

    if (champion === runnerUp) {
      alert("Campeón y Subcampeón no pueden ser iguales.");
      return;
    }

    const semis = [semi1, semi2, semi3, semi4];

    if (new Set(semis).size !== 4) {
      alert("Los 4 semifinalistas deben ser distintos.");
      return;
    }

    if (!semis.includes(champion)) {
      alert(
        "El campeón debe estar incluido entre los semifinalistas."
      );
      return;
    }

    if (!semis.includes(runnerUp)) {
      alert(
        "El subcampeón debe estar incluido entre los semifinalistas."
      );
      return;
    }

    const { error } = await supabase
      .from("special_predictions")
      .upsert(
        {
          user_id: userId,
          champion,
          runner_up: runnerUp,
          semifinalist_1: semi1,
          semifinalist_2: semi2,
          semifinalist_3: semi3,
          semifinalist_4: semi4,
        },
        {
          onConflict: "user_id",
        }
      );

    if (error) {
      console.error(error);
      alert("Error al guardar.");
      return;
    }

    setLocked(true);

    alert("✅ Especiales guardados correctamente");
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="p-6">
          <p>Cargando...</p>
        </main>
      </>
    );
  }

  const semifinalists = [
    semi1,
    semi2,
    semi3,
    semi4,
  ].filter(Boolean);

  return (
    <>
      <Navbar />

      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">
          ⭐ Pronósticos Especiales
        </h1>

        <p className="text-sm text-gray-600 mb-6">
          Elegí tus 4 semifinalistas. Luego seleccioná
          entre ellos al Subcampeón y al Campeón.
        </p>

        {locked && (
          <div className="bg-green-100 border border-green-400 text-green-800 p-3 rounded mb-6">
            ✅ Pronósticos especiales confirmados.
            No pueden modificarse.
          </div>
        )}

        <div className="space-y-5">

          <div>
            <label className="font-semibold">
              ⭐ Semifinalista 1
            </label>

            <select
              disabled={locked}
              className="border p-2 w-full"
              value={semi1}
              onChange={(e) => setSemi1(e.target.value)}
            >
              <option value="">Seleccionar</option>

              {teams.map((team) => (
                <option
                  key={team.id}
                  value={team.name}
                >
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold">
              ⭐ Semifinalista 2
            </label>

            <select
              disabled={locked}
              className="border p-2 w-full"
              value={semi2}
              onChange={(e) => setSemi2(e.target.value)}
            >
              <option value="">Seleccionar</option>

              {teams.map((team) => (
                <option
                  key={team.id}
                  value={team.name}
                >
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold">
              ⭐ Semifinalista 3
            </label>

            <select
              disabled={locked}
              className="border p-2 w-full"
              value={semi3}
              onChange={(e) => setSemi3(e.target.value)}
            >
              <option value="">Seleccionar</option>

              {teams.map((team) => (
                <option
                  key={team.id}
                  value={team.name}
                >
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold">
              ⭐ Semifinalista 4
            </label>

            <select
              disabled={locked}
              className="border p-2 w-full"
              value={semi4}
              onChange={(e) => setSemi4(e.target.value)}
            >
              <option value="">Seleccionar</option>

              {teams.map((team) => (
                <option
                  key={team.id}
                  value={team.name}
                >
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold">
              🥈 Subcampeón
            </label>

            <select
              disabled={locked}
              className="border p-2 w-full"
              value={runnerUp}
              onChange={(e) =>
                setRunnerUp(e.target.value)
              }
            >
              <option value="">
                Seleccionar
              </option>

              {semifinalists.map((team) => (
                <option
                  key={team}
                  value={team}
                >
                  {team}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold">
              🏆 Campeón
            </label>

            <select
              disabled={locked}
              className="border p-2 w-full"
              value={champion}
              onChange={(e) =>
                setChampion(e.target.value)
              }
            >
              <option value="">
                Seleccionar
              </option>

              {semifinalists.map((team) => (
                <option
                  key={team}
                  value={team}
                >
                  {team}
                </option>
              ))}
            </select>
          </div>

          {!locked && (
            <button
              onClick={saveSpecials}
              className="bg-green-600 text-white px-6 py-3 rounded"
            >
              Guardar Especiales
            </button>
          )}

        </div>
      
        {officialResults &&
          officialResults.is_published && (
            <div className="mt-10 border rounded p-5 bg-white">

              <h2 className="text-xl font-bold mb-4">
                📋 Pronósticos Especiales
              </h2>

              <div className="space-y-2 text-sm">
                {allUsers
                  .filter(
                    (u) =>
                      u?.name &&
                      u.name.toUpperCase() !== "COMISION"
                  )
                  .map((user) => {
                    const sp = allSpecials.find(
                      (s) => s.user_id === user.id
                    );

                    if (!sp) {
                      return (
                        <div key={user.id}>
                          <strong>{user.name}</strong> | ❌ Sin cargar
                        </div>
                      );
                    }

                    const sf =
                      [
                        sp.semifinalist_1,
                        sp.semifinalist_2,
                        sp.semifinalist_3,
                        sp.semifinalist_4,
                      ].filter((s) =>
                        [
                          officialResults.semifinalist_1,
                          officialResults.semifinalist_2,
                          officialResults.semifinalist_3,
                          officialResults.semifinalist_4,
                        ].includes(s)
                      ).length;

                    let pts = sf * 3;

                    const subOk =
                      sp.runner_up === officialResults.runner_up;

                    const camOk =
                      sp.champion === officialResults.champion;

                    if (subOk) pts += 3;
                    if (camOk) pts += 10;

                    return (
                      <div key={user.id}>
                        <strong>{user.name}</strong> | {sp.semifinalist_1} | {sp.semifinalist_2} | {sp.semifinalist_3} | {sp.semifinalist_4} | {sp.runner_up} | {sp.champion} | SF {sf}/4 | SUB {subOk ? "✔" : "✘"} | CAM {camOk ? "✔" : "✘"} | ⭐ {pts}
                      </div>
                    );
                  })}
              </div>

            </div>
          )}

      </main>
    </>
  );
}