"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Image from "next/image";

export default function EstadisticasPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [specialPredictions, setSpecialPredictions] = useState<any[]>([]);
  const [specialResults, setSpecialResults] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [
        { data: usersData },
        { data: matchesData },
        { data: predictionsData },
        { data: specialPredictionsData },
        { data: specialResultsData },
      ] = await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("matches").select("*"),
        supabase.from("predictions").select("*"),
        supabase.from("special_predictions").select("*"),
        supabase
          .from("tournament_special_results")
          .select("*")
          .eq("id", 1)
          .maybeSingle(),
      ]);

      setUsers(
        (usersData || []).filter(
          (u) => u?.name && u.name.toUpperCase() !== "COMISION"
        )
      );
      setMatches(matchesData || []);
      setPredictions(predictionsData || []);
      setSpecialPredictions(specialPredictionsData || []);
      setSpecialResults(specialResultsData);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const finished = matches.filter(
      (m) => m.home_score != null && m.away_score != null
    );

    const ranking = users.map((user) => {
      const preds = predictions.filter((p) => p.user_id === user.id);

      let matchPoints = 0;
      let exactos = 0;
      let aciertos = 0;
      let longestHit = 0;
      let currentHit = 0;
      let longestDry = 0;
      let currentDry = 0;

      preds.forEach((p) => {
        matchPoints += Number(p.points || 0);

        const match = finished.find((m) => m.id === p.match_id);
        if (!match) return;

        const ph = Number(p.predicted_home);
        const pa = Number(p.predicted_away);
        const mh = Number(match.home_score);
        const ma = Number(match.away_score);

        const exact = ph === mh && pa === ma;
        if (exact) exactos++;

        const predRes = ph > pa ? "H" : ph < pa ? "A" : "D";
        const realRes = mh > ma ? "H" : mh < ma ? "A" : "D";

        if (predRes === realRes) {
          aciertos++;
          currentHit++;
          longestHit = Math.max(longestHit, currentHit);
        } else {
          currentHit = 0;
        }

        if (Number(p.points || 0) === 0) {
          currentDry++;
          longestDry = Math.max(longestDry, currentDry);
        } else {
          currentDry = 0;
        }
      });

      let specialPoints = 0;

      const sp = specialPredictions.find(
        (s) => s.user_id === user.id
      );

      if (sp && specialResults) {
        const semis = [
          specialResults.semifinalist_1,
          specialResults.semifinalist_2,
          specialResults.semifinalist_3,
          specialResults.semifinalist_4,
        ];

        if (semis.includes(sp.semifinalist_1)) specialPoints += 3;
        if (semis.includes(sp.semifinalist_2)) specialPoints += 3;
        if (semis.includes(sp.semifinalist_3)) specialPoints += 3;
        if (semis.includes(sp.semifinalist_4)) specialPoints += 3;
        if (sp.runner_up === specialResults.runner_up) specialPoints += 3;
        if (sp.champion === specialResults.champion) specialPoints += 10;
      }

      return {
        id: user.id,
        name: user.name,
        points: matchPoints,
        total: matchPoints + specialPoints,
        exactos,
        aciertos,
        longestHit,
        longestDry,
      };
    });

    ranking.sort((a, b) => b.total - a.total);

    const leader = ranking[0];

    const reyPuntos = [...ranking].sort((a,b)=>b.points-a.points)[0];
    const reyExactos = [...ranking].sort((a,b)=>b.exactos-a.exactos)[0];
    const enLlamas = [...ranking].sort((a,b)=>b.longestHit-a.longestHit)[0];
    const desierto = [...ranking].sort((a,b)=>b.longestDry-a.longestDry)[0];

    const diarios:any[] = [];
    const fechas = [...new Set(
      finished.map(m =>
        new Date(m.match_date).toLocaleDateString("es-AR")
      )
    )];

    fechas.forEach(fecha=>{
      let ganador:any=null;

      users.forEach(user=>{
        let pts=0;

        predictions
          .filter(p=>p.user_id===user.id)
          .forEach(pred=>{
            const match = finished.find(
              m=>m.id===pred.match_id &&
              new Date(m.match_date).toLocaleDateString("es-AR")===fecha
            );

            if(match) pts += Number(pred.points||0);
          });

        if(!ganador || pts>ganador.pts){
          ganador={nombre:user.name,pts,fecha};
        }
      });

      if(ganador) diarios.push(ganador);
    });

    const jornadas:any[] = [];
    const rounds = [...new Set(finished.map(m=>m.round_number))];

    rounds.forEach(round=>{
      let lider:any=null;

      users.forEach(user=>{
        const pts = predictions
          .filter(p=>p.user_id===user.id)
          .reduce((acc,p)=>{
            const match = finished.find(
              m=>m.id===p.match_id &&
              m.round_number===round
            );
            return acc + (match ? Number(p.points||0) : 0);
          },0);

        if(!lider || pts>lider.pts){
          lider={round, nombre:user.name, pts};
        }
      });

      if(lider) jornadas.push(lider);
    });

    return {
      leader,
      reyPuntos,
      reyExactos,
      enLlamas,
      desierto,
      diarios,
      jornadas
    };
  }, [users,matches,predictions,specialPredictions,specialResults]);

  const Card = ({title,value,extra}:any)=>(
    <div className="bg-gray-800 text-white rounded-xl p-4 shadow-lg">
      <div className="text-lg font-bold">{title}</div>
      <div className="text-2xl mt-2">{value}</div>
      <div className="text-blue-400">{extra}</div>
    </div>
  );

  if (loading) return <><Navbar/><main className="p-6">Cargando...</main></>;

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-2">
        <div className="relative overflow-hidden mb-4 rounded-2xl h-[150px] lg:h-[190px]"
          style={{backgroundImage:"url('/worldcup-header.png')",backgroundSize:"cover"}}>
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
          <Card title="👑 Líder del Prode" value={stats.leader?.name} extra={`${stats.leader?.total || 0} pts`} />
          <Card title="⚽ Rey de los Puntos" value={stats.reyPuntos?.name} extra={`${stats.reyPuntos?.points || 0} pts`} />
          <Card title="🎯 Rey de los Exactos" value={stats.reyExactos?.name} extra={`${stats.reyExactos?.exactos || 0} exactos`} />
          <Card title="🔥 En Llamas" value={stats.enLlamas?.name} extra={`${stats.enLlamas?.longestHit || 0} seguidos`} />
          <Card title="🌵 Cruzando el Desierto" value={stats.desierto?.name} extra={`${stats.desierto?.longestDry || 0} sin puntuar`} />
        </div>

        <div className="bg-gray-800 text-white rounded-xl p-4 mb-6">
          <h2 className="text-2xl font-bold mb-4">📅 Ganadores Diarios</h2>
          {stats.diarios.map((d:any,index:number)=>(
            <div key={index} className="border-b border-gray-700 py-2">
              {d.fecha} → <strong>{d.nombre}</strong> ({d.pts} pts)
            </div>
          ))}
        </div>

        <div className="bg-gray-800 text-white rounded-xl p-4">
          <h2 className="text-2xl font-bold mb-4">🏆 Líderes de Jornada</h2>
          {stats.jornadas.map((j:any,index:number)=>(
            <div key={index} className="border-b border-gray-700 py-2">
              Jornada {j.round} → <strong>{j.nombre}</strong> ({j.pts} pts)
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
