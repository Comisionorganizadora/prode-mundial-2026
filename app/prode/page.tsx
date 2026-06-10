"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

export default function ProdePage() {
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any>({});
  const [activeRound, setActiveRound] = useState<number | null>(null);
  const [openRounds, setOpenRounds] = useState<number[]>([]);

  const stageNames: Record<number, string> = {
    1: "Fecha 1",
    2: "Fecha 2",
    3: "Fecha 3",
    4: "16avos",
    5: "8vos",
    6: "4tos",
    7: "Semis",
    8: "Final",
  };

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const storedUserId = localStorage.getItem("user_id");
      const storedUserName = localStorage.getItem("user_name");

      if (!storedUserId) {
        window.location.href = "/";
        return;
      }

      setUserId(storedUserId);
      setUserName(storedUserName || "");

      const { data: matchesData } = await supabase
        .from("matches")
        .select("*")
        .order("match_date", { ascending: true });

      const { data: stagesData } = await supabase
        .from("stages")
        .select("*")
        .order("id");

      const openedStages =
        stagesData?.filter((s) => s.is_open).map((s) => s.id) || [];

      setOpenRounds(openedStages);

      if (openedStages.length > 0) {
        setActiveRound(openedStages[0]);
      }

      const { data: predictionsData } = await supabase
        .from("predictions")
        .select("*")
        .eq("user_id", storedUserId);

      const predictionMap: any = {};

      predictionsData?.forEach((p) => {
        predictionMap[p.match_id] = {
          home: p.predicted_home,
          away: p.predicted_away,
          double: p.is_double,
          qualifier: p.predicted_qualifier || "",
          points: p.points || 0,
        };
      });

      setMatches(matchesData || []);
      setPredictions(predictionMap);
      setLoading(false);
    };

    loadData();
  }, []);

  const handlePredictionChange = (
    matchId: number,
    field: string,
    value: any
  ) => {
    if (!openRounds.includes(activeRound || 0)) return;

    setPredictions({
      ...predictions,
      [matchId]: {
        ...predictions[matchId],
        [field]: value,
      },
    });
  };

  const visibleMatches = activeRound
    ? matches.filter(
        (m) => Number(m.round_number) === Number(activeRound)
      )
    : [];

  const saveAllPredictions = async () => {
    if (!userId) return;

    if (!openRounds.includes(activeRound || 0)) {
      alert("Esta fecha está cerrada");
      return;
    }

    const currentMatches = matches.filter(
      (m) => Number(m.round_number) === Number(activeRound)
    );

    if ([1, 2, 3, 4, 5].includes(Number(activeRound))) {
      const doubles = currentMatches.filter(
        (m) => predictions[m.id]?.double
      );

      if (doubles.length !== 1) {
        alert("Debes seleccionar exactamente 1 Partido Doble.");
        return;
      }
    }

    for (const match of currentMatches) {
      const home = predictions[match.id]?.home;
      const away = predictions[match.id]?.away;

      if (
        match.is_knockout &&
        home !== undefined &&
        away !== undefined &&
        home !== "" &&
        away !== "" &&
        Number(home) === Number(away) &&
        !predictions[match.id]?.qualifier
      ) {
        alert(
          `Debes seleccionar quién clasifica en ${match.team_home} vs ${match.team_away}`
        );
        return;
      }
    }

    const rows = matches
      .filter(
        (m) => Number(m.round_number) === Number(activeRound)
      )
      .map((match) => ({
        user_id: userId,
        match_id: match.id,
        predicted_home: Number(predictions[match.id]?.home),
        predicted_away: Number(predictions[match.id]?.away),
        predicted_qualifier:
          predictions[match.id]?.qualifier || null,
        is_double: predictions[match.id]?.double || false,
        points: 0,
      }));

    for (const row of rows) {
      const { error } = await supabase
        .from("predictions")
        .upsert(row, {
          onConflict: "user_id,match_id",
        });

      if (error) {
        console.error(error);
        alert("Error al guardar.");
        return;
      }
    }

    alert("✅ Pronósticos confirmados correctamente");
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="p-6">Cargando...</main>
      </>
    );
  }



  const getResultStyle = (match: any) => {
    if (!match.is_finished) return "";

    const predHome = Number(predictions[match.id]?.home);
    const predAway = Number(predictions[match.id]?.away);
    const realHome = Number(match.home_score);
    const realAway = Number(match.away_score);

    const exact = predHome === realHome && predAway === realAway;
    if (exact) return "bg-green-100";

    const predSign = predHome > predAway ? 1 : predHome < predAway ? -1 : 0;
    const realSign = realHome > realAway ? 1 : realHome < realAway ? -1 : 0;

    return predSign === realSign ? "bg-yellow-100" : "bg-red-100";
  };

  const getResultInfo = (match: any) => {
    const predHome = Number(predictions[match.id]?.home);
    const predAway = Number(predictions[match.id]?.away);
    const realHome = Number(match.home_score);
    const realAway = Number(match.away_score);

    const exact =
      predHome === realHome &&
      predAway === realAway;

    const predSign =
      predHome > predAway ? 1 :
      predHome < predAway ? -1 : 0;

    const realSign =
      realHome > realAway ? 1 :
      realHome < realAway ? -1 : 0;

    if (exact) {
      return {
        text: "🟢 Exacto",
        className: "text-black",
      };
    }

    if (predSign === realSign) {
      return {
        text: "🟡 Acierto",
        className: "text-black",
      };
    }

    return {
      text: "🔴 Error",
      className: "text-black",
    };
  };

  const completed = visibleMatches.filter(
    (m) =>
      predictions[m.id]?.home !== undefined &&
      predictions[m.id]?.away !== undefined &&
      predictions[m.id]?.home !== "" &&
      predictions[m.id]?.away !== ""
  ).length;

  return (
    <>
      <Navbar />

      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">
          🏆 Prode Mundial 2026
        </h1>

        <p className="mb-6">Bienvenido {userName}</p>

        
        <div className="flex flex-wrap gap-2 mb-6">
  {Object.entries(stageNames).map(([id, name]) => {
    const round = Number(id);

    let buttonClass =
      "px-4 py-2 rounded font-medium border";

    if (openRounds.includes(round)) {
      buttonClass += " bg-green-600 text-black";
    } else {
      buttonClass += " bg-white";
    }

    if (round === activeRound) {
      buttonClass += " ring-4 ring-blue-300";
    }

    return (
      <button
        key={id}
        onClick={() => setActiveRound(round)}
        className={buttonClass}
      >
        {name}
      </button>
    );
  })}
</div>

        {!openRounds.includes(activeRound || 0) && (
          <div className="mb-4 p-3 bg-yellow-100 rounded">
            Esta fecha está cerrada. Solo lectura.
          </div>
        )}

        <div className="mb-4 font-semibold">
          ⚽ {completed} de {visibleMatches.length} partidos completados
        </div>

        {visibleMatches.map((match) => (
          <div key={match.id} className={`border rounded p-4 mb-4 text-black ${getResultStyle(match)} ${predictions[match.id]?.double ? "border-4 border-amber-500" : ""}`}>
            <h2 className="font-bold">
              {match.team_home} vs {match.team_away}
            </h2>

            <p className="text-sm text-black mb-3">
              {match.stage}
            </p>

            <div className="flex gap-3 mb-3">
              <input
                type="number"
                min="0"
                disabled={!openRounds.includes(activeRound || 0)}
                className="border p-2 w-20 disabled:bg-gray-100"
                value={predictions[match.id]?.home ?? ""}
                onChange={(e) =>
                  handlePredictionChange(
                    match.id,
                    "home",
                    e.target.value
                  )
                }
              />

              <input
                type="number"
                min="0"
                disabled={!openRounds.includes(activeRound || 0)}
                className="border p-2 w-20 disabled:bg-gray-100"
                value={predictions[match.id]?.away ?? ""}
                onChange={(e) =>
                  handlePredictionChange(
                    match.id,
                    "away",
                    e.target.value
                  )
                }
              />
            </div>

            {match.is_knockout &&
              Number(predictions[match.id]?.home) ===
                Number(predictions[match.id]?.away) && (
                <div className="mb-3">
                  <p className="font-semibold mb-1">
                    ¿Quién clasifica?
                  </p>

                  <select
                    disabled={!openRounds.includes(activeRound || 0)}
                    className="border p-2 w-full disabled:bg-gray-100"
                    value={predictions[match.id]?.qualifier || ""}
                    onChange={(e) =>
                      handlePredictionChange(
                        match.id,
                        "qualifier",
                        e.target.value
                      )
                    }
                  >
                    <option value="">Seleccionar</option>
                    <option value={match.team_home}>
                      {match.team_home}
                    </option>
                    <option value={match.team_away}>
                      {match.team_away}
                    </option>
                  </select>
                </div>
              )}

            {[1, 2, 3, 4, 5].includes(Number(activeRound)) && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  disabled={!openRounds.includes(activeRound || 0)}
                  checked={predictions[match.id]?.double || false}
                  onChange={(e) => {
                    if (!openRounds.includes(activeRound || 0)) return;

                    const updated = { ...predictions };

                    Object.keys(updated).forEach((key) => {
                      updated[key] = {
                        ...updated[key],
                        double: false,
                      };
                    });

                    updated[match.id] = {
                      ...updated[match.id],
                      double: e.target.checked,
                    };

                    setPredictions(updated);
                  }}
                />

                Partido doble
              </label>
            )}

            {match.is_finished && (
              <div className="mt-3 border-t pt-3">
                <div className="text-sm font-medium">
  Resultado oficial: {match.home_score} - {match.away_score}

  {match.is_knockout &&
    Number(match.home_score) === Number(match.away_score) &&
    match.qualified_team && (
      <> | Clasificó: {match.qualified_team}</>
    )}
</div>

                <div className={`mt-1 font-bold ${getResultInfo(match).className}`}>
                  {getResultInfo(match).text} | 🏆 {predictions[match.id]?.points || 0} puntos
                </div>
              </div>
            )}

          </div>
        ))}

        {openRounds.includes(activeRound || 0) && (
          <button
            onClick={saveAllPredictions}
            className="bg-green-600 text-black px-6 py-3 rounded"
          >
            Confirmar Pronósticos
          </button>
        )}
      </main>
    </>
  );
}