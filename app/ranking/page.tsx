"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Image from "next/image";

export default function RankingPage() {
  const [ranking, setRanking] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
  }, []);

  const getPredictionColor = (prediction: any, match: any) => {
    if (!prediction) return "";

    const ph = Number(prediction.predicted_home);
    const pa = Number(prediction.predicted_away);
    const mh = Number(match.home_score);
    const ma = Number(match.away_score);

    if (ph === mh && pa === ma) return "bg-green-200";

    const predResult =
      ph > pa ? "HOME" : ph < pa ? "AWAY" : "DRAW";

    const realResult =
      mh > ma ? "HOME" : mh < ma ? "AWAY" : "DRAW";

    return predResult === realResult
      ? "bg-yellow-100"
      : "bg-red-100";
  };

  const loadRanking = async () => {
    try {
      const [
        { data: usersData },
        { data: predictionsData },
        { data: matchesData },
        { data: specialPredictionsData },
        { data: specialResultsData },
      ] = await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("predictions").select("*"),
        supabase.from("matches").select("*"),
        supabase.from("special_predictions").select("*"),
        supabase
          .from("tournament_special_results")
          .select("*")
          .eq("id", 1)
          .maybeSingle(),
      ]);

      const usersList = usersData || [];
      const predictionsList = predictionsData || [];
      const matchesList = matchesData || [];

      setUsers(usersList);
      setPredictions(predictionsList);
      setMatches(matchesList);

      const rankingData = usersList
        .filter(
          (u) => u?.name && u.name.toUpperCase() !== "COMISION"
        )
        .map((user) => {
          const userPreds = predictionsList.filter(
            (p) => p.user_id === user.id
          );

          let matchPoints = 0;
          let aciertos = 0;
          let exactos = 0;

          userPreds.forEach((p) => {
            const match = matchesList.find(
              (m) => m.id === p.match_id
            );

            if (!match || match.home_score == null || match.away_score == null) return;

            const ph = Number(p.predicted_home);
            const pa = Number(p.predicted_away);
            const mh = Number(match.home_score);
            const ma = Number(match.away_score);

            matchPoints += Number(p.points || 0);

            const isExact = ph === mh && pa === ma;

            const predResult =
              ph > pa ? "HOME" : ph < pa ? "AWAY" : "DRAW";

            const realResult =
              mh > ma ? "HOME" : mh < ma ? "AWAY" : "DRAW";

            if (predResult === realResult) aciertos++;
            if (isExact) exactos++;
          });

          let specialPoints = 0;

          const sp = specialPredictionsData?.find(
            (s) => s.user_id === user.id
          );

          if (sp && specialResultsData) {
            const semis = [
              specialResultsData.semifinalist_1,
              specialResultsData.semifinalist_2,
              specialResultsData.semifinalist_3,
              specialResultsData.semifinalist_4,
            ];

            if (semis.includes(sp.semifinalist_1)) specialPoints += 3;
            if (semis.includes(sp.semifinalist_2)) specialPoints += 3;
            if (semis.includes(sp.semifinalist_3)) specialPoints += 3;
            if (semis.includes(sp.semifinalist_4)) specialPoints += 3;

            if (sp.runner_up === specialResultsData.runner_up)
              specialPoints += 3;

            if (sp.champion === specialResultsData.champion)
              specialPoints += 10;
          }

          return {
  id: user.id,
  name: user.name,
  points: matchPoints,
  specialPoints,
  total: matchPoints + specialPoints,
  aciertos,
  exactos,
  efectividad: matchesList.length
    ? ((aciertos / matchesList.length) * 100).toFixed(1)
    : "0",
};
        })
        .filter(Boolean);

      rankingData.sort((a, b) => {
  if (b.total !== a.total) return b.total - a.total;
  if (b.points !== a.points) return b.points - a.points;
  if (b.aciertos !== a.aciertos) return b.aciertos - a.aciertos;
  return b.exactos - a.exactos;
});

      setRanking(rankingData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const finishedMatches = matches.filter(
    (m) => m.is_finished
  ).length;

  const totalMatches = 104;

  const getPosition = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return index + 1;
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="p-6">Cargando posiciones...</main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-1 py-0">
  <div
    className="relative overflow-hidden mb-1 rounded-2xl h-[140px] lg:h-[190px]"
    style={{
    backgroundImage: "url('/worldcup-header.png')",
    backgroundSize: "cover",
    backgroundPosition: "center top",
    backgroundRepeat: "no-repeat",
    }}
  >
    <div className="h-full flex justify-between items-center px-4 lg:px-8">

              <div className="flex flex-col justify-center ml-20 lg:ml-40">
                <h1 className="text-3xl lg:text-5xl font-bold text-white">
                  📊 Posiciones
                </h1>

                <div className="mt-2 text-base lg:text-xl font-semibold text-blue-400">
                  ⚽ {finishedMatches} / {totalMatches} partidos finalizados
                </div>
              </div>

              <div className="flex items-end justify-end">
                <Image
                  src="/hall-of-fame.png"
                  alt="Campeones Históricos"
                  width={520}
                  height={180}
                  priority
                  className="hidden lg:block"
                  style={{
                    width: "auto",
                    height: "180px",
                    objectFit: "contain",
                  }}
                />

                <Image
                  src="/hall-of-fame.png"
                  alt="Campeones Históricos"
                  width={190}
                  height={70}
                  priority
                  className="block lg:hidden absolute right-2 bottom-2"
                  style={{
                    width: "auto",
                    height: "55px",
                    objectFit: "contain",
                  }}
                />
              </div>

            </div>
          </div>

        <table className="w-full border border-gray-700 mb-4 bg-gray-800 text-white">
          <thead>
            <tr className="bg-gray-200 border-b text-black">
              <th className="p-3 text-black">Pos</th>
              <th className="p-3 text-left text-black">Participante</th>
              <th className="p-3 text-center text-black">Puntos</th>
              <th className="p-3 text-center text-black">Finalistas</th>
              <th className="p-3 text-center text-black">Aciertos</th>
              <th className="p-3 text-center text-black">Exactos</th>
              <th className="p-3 text-center text-black">Total</th>
              <th className="p-3 text-center text-black">%</th>
            </tr>
          </thead>

          <tbody>
            {ranking.map((user, index) => (
              <tr
  key={user.id}
  className={`border-b border-gray-700 text-white ${    index % 2 === 0 ? "bg-gray-800" : "bg-gray-700"  }`}>
                <td className="p-3 text-center">
                  {getPosition(index)}
                </td>
                <td className="p-3">{user.name}</td>
                <td className="p-3 text-center font-bold">
                  {user.points}
                </td>
                <td className="p-3 text-center">
                  {user.specialPoints}
                </td>
                <td className="p-3 text-center">
  {user.aciertos}
</td>

<td className="p-3 text-center">
  {user.exactos}
</td>

<td className="p-3 text-center font-bold">
  {user.total}
</td>

<td className="p-3 text-center">
  {user.efectividad}%
</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="text-2xl font-bold mb-4">
          📋 Últimos partidos finalizados
        </h2>

        {[...matches]
          .filter((m) => m.is_finished)
          .sort((a, b) => b.match_number - a.match_number)
          .map((match) => (
            <div
              key={match.id}
              className="border rounded p-3 mb-4 bg-gray-100 text-black"
            >
              <div className="text-sm font-semibold text-gray-700 mb-2">
                ⚽ Partido {match.match_number} | {new Date(match.match_date).toLocaleDateString("es-AR")} | {new Date(match.match_date).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })} hs ✔ FINAL
              </div>

              <h3 className="font-semibold">
                {match.team_home} vs {match.team_away}
              </h3>

              <div className="font-bold mb-2">
                {match.home_score} - {match.away_score}
              </div>

              <table className="w-full text-sm text-black">
                <tbody>
                  {users
                    .filter(
                      (u) =>
                        u.name?.toUpperCase() !== "COMISION"
                    )
                    .map((user) => {
                      const prediction = predictions.find(
                        (p) =>
                          p.user_id === user.id &&
                          p.match_id === match.id
                      );

                      return (
                        <tr
                          key={user.id}
                          className={getPredictionColor(
                            prediction,
                            match
                          )}
                        >
                          <td className="p-1 font-medium">
                            {user.name}
                          </td>
                          <td className="p-1 text-center">
                            {prediction
                              ? `${prediction.predicted_home}-${prediction.predicted_away}`
                              : "-"}
                          </td>
                          <td className="p-1 text-center font-bold">
                            {prediction?.points ?? 0}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ))}
      </main>
    </>
  );
}
