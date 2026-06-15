"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Image from "next/image";

const STAGES: Record<number, string> = {
  1: "Fecha 1",
  2: "Fecha 2",
  3: "Fecha 3",
  4: "16avos",
  5: "8vos",
  6: "4tos",
  7: "Semis",
  8: "Final",
};

// 🟡 BADGES FIFA STYLE
function getBadge(value: number, type: "hit" | "exact" | "points") {
  if (type === "hit") {
    if (value >= 10) return "🔥 LEGENDARIO";
    if (value >= 5) return "🔥 EN RACHA";
    return "⚡ ACTIVO";
  }

  if (type === "exact") {
    if (value >= 15) return "👑 MAESTRO";
    if (value >= 8) return "🎯 EXPERTO";
    return "🎯 PROMESA";
  }

  if (type === "points") {
    if (value >= 100) return "💰 ÉLITE";
    if (value >= 50) return "💰 PRO";
    return "💰 BASE";
  }

  return "";
}

export default function EstadisticasPageV7() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: u }, { data: m }, { data: p }] = await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("matches").select("*"),
        supabase.from("predictions").select("*"),
      ]);

      setUsers((u || []).filter((x: any) => x?.name));
      setMatches(m || []);
      setPredictions(p || []);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const finished = [...matches]
      .filter((m: any) => m.home_score != null && m.away_score != null)
      .sort(
        (a: any, b: any) =>
          new Date(a.match_date).getTime() -
          new Date(b.match_date).getTime()
      );

    const getMatch = (id: string) =>
      finished.find((m: any) => m.id === id);

    // -------------------------
    // RANKING BASE
    // -------------------------
    const ranking = users.map((user: any) => {
      const preds = predictions.filter(
        (p: any) => p.user_id === user.id
      );

      let total = 0;
      let exactos = 0;

      let currentHit = 0;
      let bestHit = 0;

      const dailyMap: Record<string, number> = {};

      preds.forEach((p: any) => {
        const match = getMatch(p.match_id);
        if (!match) return;

        const pts = Number(p.points || 0);
        total += pts;

        const dateKey = new Date(match.match_date)
          .toISOString()
          .split("T")[0];

        dailyMap[dateKey] = (dailyMap[dateKey] || 0) + pts;

        const isExact =
          Number(p.predicted_home) === Number(match.home_score) &&
          Number(p.predicted_away) === Number(match.away_score);

        if (isExact) exactos++;

        if (pts > 0) {
          currentHit++;
          bestHit = Math.max(bestHit, currentHit);
        } else {
          currentHit = 0;
        }
      });

      return {
        ...user,
        total,
        exactos,
        currentHit,
        bestHit,
        dailyMap,
      };
    });

    const leaders = (field: string) => {
      const max = Math.max(...ranking.map((r: any) => r[field] || 0), 0);
      return {
        value: max,
        users: ranking.filter((r: any) => (r[field] || 0) === max),
      };
    };

    // 💰 Cazador de Puntos
    const cazador = ranking
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        value: r.total,
      }))
      .sort((a: any, b: any) => b.value - a.value);

    // 📈 Remontada
    const remontada = ranking
      .map((r: any) => {
        const days = Object.entries(r.dailyMap || {}).sort(
          (a: any, b: any) =>
            new Date(a[0]).getTime() - new Date(b[0]).getTime()
        );

        let cumulative = 0;
        let bestJump = 0;
        let last = 0;

        days.forEach(([_, pts]: any) => {
          cumulative += pts;
          const diff = cumulative - last;
          bestJump = Math.max(bestJump, diff);
          last = cumulative;
        });

        return {
          id: r.id,
          name: r.name,
          value: bestJump,
        };
      })
      .sort((a: any, b: any) => b.value - a.value);

    // 👁️ LA VIO VENIR (con partido)
    const vioVenir = finished.map((m: any) => {
      const preds = predictions.filter(
        (p: any) => p.match_id === m.id
      );

      const exactUsers = preds.filter(
        (p: any) =>
          Number(p.predicted_home) === Number(m.home_score) &&
          Number(p.predicted_away) === Number(m.away_score)
      );

      return {
        match: m,
        count: exactUsers.length,
        users: exactUsers.map((p: any) => p.user_id),
      };
    });

    return {
      reyExactos: leaders("exactos"),
      enLlamas: leaders("currentHit"),
      cazador,
      remontada,
      vioVenir,
    };
  }, [users, matches, predictions]);

  const PlayerCard = ({ user, badge, value, sub }: any) => (
    <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-xl hover:scale-[1.02] transition">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-white font-bold text-lg">
            {user.name}
          </div>
          <div className="text-xs text-zinc-400">{badge}</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-blue-400">
            {value}
          </div>
          <div className="text-xs text-zinc-400">{sub}</div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="p-6 text-white">Cargando...</main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="max-w-7xl mx-auto px-3 text-white">
        {/* HEADER FIFA */}
        <div className="relative h-[180px] rounded-2xl overflow-hidden mb-6">
          <div className="absolute inset-0 bg-[url('/worldcup-header.png')] bg-cover opacity-70" />
          <div className="relative z-10 flex justify-between items-center h-full px-6">
            <h1 className="text-4xl font-black">
              ⚽ FIFA STATS V7
            </h1>
            <Image
              src="/hall-of-fame.png"
              width={420}
              height={180}
              alt="fifa"
              className="hidden lg:block"
            />
          </div>
        </div>

        {/* GRID PRINCIPAL */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.reyExactos.users.map((u: any) => (
            <PlayerCard
              key={u.id}
              user={u}
              badge={getBadge(stats.reyExactos.value, "exact")}
              value={stats.reyExactos.value}
              sub="Exactos"
            />
          ))}

          {stats.enLlamas.users.map((u: any) => (
            <PlayerCard
              key={u.id}
              user={u}
              badge={getBadge(stats.enLlamas.value, "hit")}
              value={stats.enLlamas.value}
              sub="Racha"
            />
          ))}
        </div>

        {/* CAZADOR */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-3">💰 Cazador de Puntos</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {stats.cazador.slice(0, 5).map((u: any) => (
              <PlayerCard
                key={u.id}
                user={u}
                badge={getBadge(u.value, "points")}
                value={u.value}
                sub="pts"
              />
            ))}
          </div>
        </section>

        {/* REMONTADA */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-3">
            📈 Mejor Remontada
          </h2>
          <div className="grid md:grid-cols-3 gap-3">
            {stats.remontada.slice(0, 5).map((u: any) => (
              <PlayerCard
                key={u.id}
                user={u}
                badge="🚀 CLUTCH"
                value={u.value}
                sub="boost"
              />
            ))}
          </div>
        </section>

        {/* 👁️ LA VIO VENIR */}
        <section className="mt-10">
          <h2 className="text-xl font-bold mb-3">
            👁️ La Vio Venir
          </h2>

          <div className="grid gap-3">
            {stats.vioVenir
              .filter((v: any) => v.count === 1)
              .map((v: any) => {
                const user = users.find(
                  (u: any) => u.id === v.users[0]
                );

                return (
                  <div
                    key={v.match.id}
                    className="bg-zinc-900 border border-zinc-700 p-4 rounded-xl"
                  >
                    <div className="font-bold">
                      👁️ {user?.name}
                    </div>

                    <div className="text-sm text-zinc-400">
                      {v.match.team_home} {v.match.home_score} -{" "}
                      {v.match.away_score} {v.match.team_away}
                    </div>

                    <div className="text-xs text-blue-400 mt-1">
                      {new Date(
                        v.match.match_date
                      ).toLocaleDateString("es-AR")}
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      </main>
    </>
  );
}