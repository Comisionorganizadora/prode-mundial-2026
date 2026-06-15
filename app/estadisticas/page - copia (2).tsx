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

export default function EstadisticasPageV6() {
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

    // -----------------------------
    // BASE RANKING POR USUARIO
    // -----------------------------
    const ranking = users.map((user: any) => {
      const preds = predictions
        .filter((p: any) => p.user_id === user.id)
        .sort(
          (a: any, b: any) =>
            new Date(getMatch(a.match_id)?.match_date || 0).getTime() -
            new Date(getMatch(b.match_id)?.match_date || 0).getTime()
        );

      let total = 0;
      let exactos = 0;

      // rachas actuales
      let currentHit = 0;
      let bestHit = 0;

      let currentDry = 0;
      let worstDry = 0;

      // HISTÓRICO rachas (clave V6)
      let historyHit = 0;
      let bestHistoryHit = 0;

      let historyDry = 0;
      let worstHistoryDry = 0;

      // para remontada
      const dailyMap: Record<string, number> = {};

      preds.forEach((p: any) => {
        const match = getMatch(p.match_id);
        const pts = Number(p.points || 0);

        if (!match) return;

        total += pts;

        const dateKey = new Date(match.match_date)
          .toISOString()
          .split("T")[0];

        dailyMap[dateKey] = (dailyMap[dateKey] || 0) + pts;

        const isExact =
          Number(p.predicted_home) === Number(match.home_score) &&
          Number(p.predicted_away) === Number(match.away_score);

        if (isExact) exactos++;

        // 🔥 racha actual
        if (pts > 0) {
          currentHit++;
          bestHit = Math.max(bestHit, currentHit);
          currentDry = 0;
        } else {
          currentDry++;
          worstDry = Math.max(worstDry, currentDry);
          currentHit = 0;
        }

        // 🔥 racha histórica (más sensible)
        if (pts > 0) {
          historyHit++;
          bestHistoryHit = Math.max(bestHistoryHit, historyHit);
          historyDry = 0;
        } else {
          historyDry++;
          worstHistoryDry = Math.max(worstHistoryDry, historyDry);
          historyHit = 0;
        }
      });

      return {
        ...user,
        total,
        exactos,
        currentHit,
        bestHit,
        currentDry,
        worstDry,
        bestHistoryHit,
        worstHistoryDry,
        dailyMap,
      };
    });

    // -----------------------------
    // HELPERS
    // -----------------------------
    const leaders = (field: string) => {
      const max = Math.max(...ranking.map((r: any) => r[field] || 0), 0);
      return {
        value: max,
        users: ranking.filter((r: any) => (r[field] || 0) === max),
      };
    };

    // -----------------------------
    // 💰 CAZADOR DE PUNTOS
    // -----------------------------
    const cazador = ranking
      .map((r: any) => ({
        name: r.name,
        value: r.total,
      }))
      .sort((a: any, b: any) => b.value - a.value);

    // -----------------------------
    // 📈 MEJOR REMONTADA (BASE)
    // -----------------------------
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
          name: r.name,
          value: bestJump,
        };
      })
      .sort((a, b) => b.value - a.value);

    // -----------------------------
    // 👁️ LA VIO VENIR
    // -----------------------------
    const vioVenir = finished.map((m: any) => {
      const preds = predictions.filter((p: any) => p.match_id === m.id);

      const exactUsers = preds.filter(
        (p: any) =>
          Number(p.predicted_home) === Number(m.home_score) &&
          Number(p.predicted_away) === Number(m.away_score)
      );

      return {
        match: m.id,
        count: exactUsers.length,
        users: exactUsers.map((p: any) => p.user_id),
      };
    });

    const vioUsers: Record<string, number> = {};
    vioVenir.forEach((v: any) => {
      if (v.count === 1) {
        const user = v.users[0];
        if (user) vioUsers[user] = (vioUsers[user] || 0) + 1;
      }
    });

    const vioFinal = Object.entries(vioUsers)
      .map(([id, value]) => ({
        id,
        name: users.find((u: any) => u.id === id)?.name,
        value,
      }))
      .sort((a, b) => b.value - a.value);

    return {
      reyExactos: leaders("exactos"),
      enLlamas: leaders("currentHit"),
      desierto: leaders("currentDry"),
      cazador,
      remontada,
      vioVenir: vioFinal,
    };
  }, [users, matches, predictions]);

  const Card = ({ title, users, extra }: any) => (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-lg">
      <div className="font-bold text-lg mb-2">{title}</div>
      <div className="space-y-1">
        {users?.map((u: any) => (
          <div key={u.id || u.name} className="text-white/90">
            {u.name}
          </div>
        ))}
      </div>
      {extra && <div className="text-blue-400 mt-2">{extra}</div>}
    </div>
  );

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
      <main className="max-w-7xl mx-auto px-2 text-white">
        <div className="relative mb-6 h-[160px] lg:h-[200px] rounded-2xl overflow-hidden bg-black">
          <div className="absolute inset-0 bg-[url('/worldcup-header.png')] bg-cover opacity-70" />
          <div className="relative z-10 flex items-center justify-between px-6 h-full">
            <h1 className="text-4xl font-bold">📊 Estadísticas V6</h1>
            <Image
              src="/hall-of-fame.png"
              width={420}
              height={180}
              alt="stats"
              className="hidden lg:block"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card
            title="🎯 Rey de los Exactos"
            users={stats.reyExactos.users}
            extra={`${stats.reyExactos.value} exactos`}
          />

          <Card
            title="🔥 En Llamas"
            users={stats.enLlamas.users}
            extra={`Racha: ${stats.enLlamas.value}`}
          />

          <Card
            title="🌵 Cruzando el Desierto"
            users={stats.desierto.users}
            extra={`Racha: ${stats.desierto.value}`}
          />

          <Card
            title="💰 Cazador de Puntos"
            users={stats.cazador.slice(0, 5)}
            extra="Top global"
          />

          <Card
            title="📈 Mejor Remontada"
            users={stats.remontada.slice(0, 5)}
            extra="Pico de crecimiento"
          />

          <Card
            title="👁️ La Vio Venir"
            users={stats.vioVenir}
            extra="Exacto único por partido"
          />
        </div>
      </main>
    </>
  );
}