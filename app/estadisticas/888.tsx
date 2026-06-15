// app/estadisticas/page.tsx
// VERSION V5 BASE - mantiene estética Mundial y agrega soporte para empates,
// rachas actuales e históricas. Ajustar si tu esquema difiere.

"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Image from "next/image";

const STAGES: Record<number,string> = {
  1:"Fecha 1",
  2:"Fecha 2",
  3:"Fecha 3",
  4:"16avos",
  5:"8vos",
  6:"4tos",
  7:"Semis",
  8:"Final",
};

export default function EstadisticasPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [{data:u},{data:m},{data:p}] = await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("matches").select("*"),
        supabase.from("predictions").select("*"),
      ]);

      setUsers((u||[]).filter((x:any)=>x?.name));
      setMatches(m||[]);
      setPredictions(p||[]);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const finished = [...matches]
      .filter((m:any)=>m.home_score!=null && m.away_score!=null)
      .sort((a:any,b:any)=>
        new Date(a.match_date).getTime()-new Date(b.match_date).getTime()
      );

    const ranking = users.map((user:any)=>{
      const preds = predictions
        .filter((p:any)=>p.user_id===user.id)
        .sort((a:any,b:any)=>a.match_id-b.match_id);

      let points=0;
      let exactos=0;

      let currentHit=0;
      let bestHit=0;

      let currentDry=0;
      let worstDry=0;

      preds.forEach((p:any)=>{
        const pts=Number(p.points||0);
        points += pts;

        if(pts>0){
          currentHit++;
          bestHit=Math.max(bestHit,currentHit);
          currentDry=0;
        }else{
          currentDry++;
          worstDry=Math.max(worstDry,currentDry);
          currentHit=0;
        }

        const match=finished.find((m:any)=>m.id===p.match_id);
        if(match &&
          Number(p.predicted_home)===Number(match.home_score) &&
          Number(p.predicted_away)===Number(match.away_score)){
          exactos++;
        }
      });

      return {
        ...user,
        total: points,
        points,
        exactos,
        currentHit,
        bestHit,
        currentDry,
        worstDry
      };
    });

    const leaders = (field:string) => {
      const max=Math.max(...ranking.map((r:any)=>Number(r[field]||0)),0);
      return {
        value:max,
        users:ranking.filter((r:any)=>Number(r[field]||0)===max)
      };
    };

    const diarios:any[]=[];

    [...new Set(finished.map((m:any)=>
      new Date(m.match_date).toLocaleDateString("es-AR")
    ))].forEach((fecha:any)=>{

      const scores = users.map((u:any)=>{
        let pts=0;

        predictions
          .filter((p:any)=>p.user_id===u.id)
          .forEach((p:any)=>{
            const match=finished.find((m:any)=>
              m.id===p.match_id &&
              new Date(m.match_date).toLocaleDateString("es-AR")===fecha
            );

            if(match) pts += Number(p.points||0);
          });

        return {name:u.name,pts};
      });

      const max=Math.max(...scores.map((s:any)=>s.pts),0);

      diarios.push({
        fecha,
        puntos:max,
        winners:scores.filter((s:any)=>s.pts===max)
      });
    });

    const jornadas:any[]=[];

    [...new Set(finished.map((m:any)=>m.round_number))].forEach((round:any)=>{
      const scores=users.map((u:any)=>{
        let pts=0;

        predictions.filter((p:any)=>p.user_id===u.id)
          .forEach((p:any)=>{
            const match=finished.find((m:any)=>
              m.id===p.match_id &&
              m.round_number===round
            );

            if(match) pts += Number(p.points||0);
          });

        return {name:u.name,pts};
      });

      const max=Math.max(...scores.map((s:any)=>s.pts),0);

      jornadas.push({
        stage: STAGES[round] || `Jornada ${round}`,
        puntos:max,
        winners:scores.filter((s:any)=>s.pts===max)
      });
    });

    return {
      lider: leaders("total"),
      reyPuntos: leaders("points"),
      reyExactos: leaders("exactos"),
      enLlamas: leaders("currentHit"),
      desierto: leaders("currentDry"),
      diarios,
      jornadas
    };
  }, [users,matches,predictions]);

  const Card = ({title, users, extra}:any)=>(
    <div className="bg-gray-800 text-white rounded-xl p-4 shadow-lg">
      <div className="font-bold text-lg">{title}</div>
      <div className="mt-3">
        {users?.map((u:any)=><div key={u.id}>{u.name}</div>)}
      </div>
      <div className="text-blue-400 mt-2">{extra}</div>
    </div>
  );

  if(loading){
    return <><Navbar/><main className="p-6">Cargando...</main></>;
  }

  return (
    <>
      <Navbar/>
      <main className="max-w-7xl mx-auto px-2">
        <div
          className="relative overflow-hidden mb-4 rounded-2xl h-[150px] lg:h-[190px]"
          style={{backgroundImage:"url('/worldcup-header.png')",backgroundSize:"cover"}}
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card title="👑 Líder del Prode" users={stats.lider.users} extra={`${stats.lider.value} pts`} />
          <Card title="⚽ Rey de los Puntos" users={stats.reyPuntos.users} extra={`${stats.reyPuntos.value} pts`} />
          <Card title="🎯 Rey de los Exactos" users={stats.reyExactos.users} extra={`${stats.reyExactos.value} exactos`} />
          <Card title="🔥 En Llamas" users={stats.enLlamas.users} extra={`Racha actual: ${stats.enLlamas.value}`} />
          <Card title="🌵 Cruzando el Desierto" users={stats.desierto.users} extra={`Racha actual: ${stats.desierto.value}`} />
        </div>
      </main>
    </>
  );
}
