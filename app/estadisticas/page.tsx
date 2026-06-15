"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import { buildStats } from "@/lib/stats/engine";

export default function EstadisticasPage() {
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [
        { data: usersData },
        { data: matchesData },
        { data: predictionsData },
      ] = await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("matches").select("*"),
        supabase.from("predictions").select("*"),
      ]);

      setUsers(usersData || []);
      setMatches(matchesData || []);
      setPredictions(predictionsData || []);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    return buildStats({
      users,
      matches,
      predictions,
    });
  }, [users, matches, predictions]);

  const Card = ({
    title,
    value,
    extra,
  }: {
    title: string;
    value: string;
    extra: string;
  }) => (
    <div className="bg-gray-800 text-white rounded-xl p-4 shadow-lg">
      <div className="text-lg font-bold">{title}</div>
      <div className="text-2xl mt-2">{value}</div>
      <div className="text-blue-400">{extra}</div>
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

      <main className="max-w-7xl mx-auto px-2 pb-10">
        {/* HEADER */}
        <div
          className="relative overflow-hidden mb-4 rounded-2xl h-[150px] lg:h-[190px]"
          style={{
            backgroundImage: "url('/worldcup-header.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="h-full flex items-center justify-between px-6">
            <h1 className="text-4xl font-bold text-white">
              📊 Estadísticas del Prode
            </h1>

            <Image
              src="/hall-of-fame.png"
              alt="stats"
              width={500}
              height={180}
              className="hidden lg:block"
            />
          </div>
        </div>

        {/* CARDS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card
  title="👁️ El Especialista (Mas aciertos exactos)"
  value={
    stats.reyExactos?.length
      ? `${stats.reyExactos.map((u:any) => u.name).join(", ")} ${
          stats.reyExactos?.[0]?.exactos ?? 0
        } Exactos`
      : "-"
  }
  extra=""
/>

          <Card
  title="🔥 En Llamas (Racha sumando)"
  value={
    stats.enLlamasActual?.length
      ? `${stats.enLlamasActual
          .map((u: any) => u.name)
          .join(", ")} - ${
          stats.enLlamasActual[0].currentStreak
        } En fila`
      : "-"
  }
  extra={
    stats.enLlamasHistorico?.length
      ? `Récord: ${stats.enLlamasHistorico
          .map((u: any) => u.name)
          .join(", ")} - ${
          stats.enLlamasHistorico[0].maxStreak
        }`
      : ""
  }
/>

          <Card
  title="🥊 En la Lona (Racha sin puntos)"
  value={
  stats.desiertoActual?.length &&
  stats.desiertoActual[0].currentDry > 0
    ? `${stats.desiertoActual
        .map((u:any) => u.name)
        .join(", ")} - ${
        stats.desiertoActual[0].currentDry
      } actuales`
    : "Sin racha activa"
}
  extra={
    stats.desiertoHistorico?.length
      ? `Récord: ${stats.desiertoHistorico
          .map((u: any) => u.name)
          .join(", ")} - ${
          stats.desiertoHistorico[0].maxDry
        }`
      : ""
  }
/>
<Card
  title="💰 Cazapuntos (Puntos en el dia)"
  value={
    stats.cazapuntosActual?.length
      ? `${stats.cazapuntosActual
          .map((u: any) => u.user)
          .join(", ")} - ${
          stats.cazapuntosActual[0].points
        } puntos`
      : "-"
  }
  extra={
    stats.cazapuntosHistorico?.length
      ? `Récord: ${stats.cazapuntosHistorico
          .map((u: any) => u.user)
          .join(", ")} - ${
          stats.cazapuntosHistorico[0].points
        }`
      : ""
  }
/>

          
        </div>

        {/* LA VIO VENIR + GANADORES DIARIOS */}
<div className="bg-gray-800 text-white rounded-xl p-4 mb-6">
  <h2 className="text-2xl font-bold mb-4">
    👀 La Vio Venir!!! - (Aciertos Unicos)
  </h2>

  {stats.vioVenir?.length === 0 && (
    <div className="text-gray-400">
      Todavía no hay eventos registrados.
    </div>
  )}

  {stats.vioVenir?.map((v: any, index: number) => (
    <div
      key={index}
      className="py-2 border-b border-gray-700 last:border-b-0"
    >
      <span className="font-bold text-yellow-400">
        {v.userName}
      </span>

      {" · "}

      {v.home} {v.homeScore}-{v.awayScore} {v.away}

      {" · "}

      {new Date(v.date).toLocaleDateString("es-AR")}
    </div>
  ))}

  <hr className="border-gray-700 my-6" />

  <h2 className="text-2xl font-bold mb-4">
    📅 Ganadores Diarios
  </h2>

  {stats.ganadoresDiarios?.map(
    (d: any, index: number) => (
      <div
        key={index}
        className="py-2 border-b border-gray-700 last:border-b-0"
      >
        <span className="font-bold text-yellow-400">
          {d.fecha}
        </span>

        {" · "}

        {d.users.join(", ")}

        {" · "}

        {d.points} pts
      </div>
    )
  )}
  </div>

      </main>
    </>
  );
}