import { isExact, isResult } from "./core";

export function buildStats({ users, matches, predictions }: any) {
  const players = users.filter(
    (u: any) => u.name?.toUpperCase() !== "COMISION"
  );

  const finished = [...matches]
    .filter(
      (m: any) =>
        m.home_score != null &&
        m.away_score != null
    )
    .sort(
      (a: any, b: any) =>
        new Date(a.match_date).getTime() -
        new Date(b.match_date).getTime()
    );

  const base = players.map((u: any) => {
    const preds = finished
      .map((m: any) =>
        predictions.find(
          (p: any) =>
            p.user_id === u.id &&
            p.match_id === m.id
        )
      )
      .filter(Boolean);

    let exactos = 0;

    let runningStreak = 0;
    let maxStreak = 0;

    let runningDry = 0;
    let maxDry = 0;

    preds.forEach((p: any) => {
      const m = finished.find(
        (f: any) => f.id === p.match_id
      );

      if (!m) return;

      if (isExact(p, m)) {
        exactos++;
      }

      if (isResult(p, m)) {
        runningStreak++;
        maxStreak = Math.max(
          maxStreak,
          runningStreak
        );

        runningDry = 0;
      } else {
        runningStreak = 0;

        runningDry++;
        maxDry = Math.max(
          maxDry,
          runningDry
        );
      }
    });

    let currentStreak = 0;
    let currentDry = 0;

    const orderedPreds = finished
      .map((m: any) =>
        preds.find(
          (p: any) => p.match_id === m.id
        )
      )
      .filter(Boolean);

    // 🔥 En Llamas actual
    for (
      let i = orderedPreds.length - 1;
      i >= 0;
      i--
    ) {
      const p: any = orderedPreds[i];

      const m = finished.find(
        (f: any) => f.id === p.match_id
      );

      if (!m) continue;

      if (isResult(p, m)) {
        currentStreak++;
      } else {
        break;
      }
    }

    // 🥊 En la Lona actual
    for (
      let i = orderedPreds.length - 1;
      i >= 0;
      i--
    ) {
      const p: any = orderedPreds[i];

      if (Number(p.points || 0) === 0) {
        currentDry++;
      } else {
        break;
      }
    }

    return {
      name: u.name,

      exactos,

      currentStreak,
      maxStreak,

      currentDry,
      maxDry,
    };
  });

  // =========================
  // 👁️ EL ESPECIALISTA
  // =========================

  // =========================
// 👁️ EL ESPECIALISTA
// =========================

const maxExactos = Math.max(
  ...base.map((u: any) => u.exactos),
  0
);

const reyExactos = base.filter(
  (u: any) => u.exactos === maxExactos
);

// =========================
// 🔥 EN LLAMAS
// =========================

const bestCurrentStreak = Math.max(
  ...base.map((u: any) => u.currentStreak),
  0
);

const enLlamasActual = base.filter(
  (u: any) =>
    u.currentStreak === bestCurrentStreak
);

const bestHistoricStreak = Math.max(
  ...base.map((u: any) => u.maxStreak),
  0
);

const enLlamasHistorico = base.filter(
  (u: any) =>
    u.maxStreak === bestHistoricStreak
);

// =========================
// 🥊 EN LA LONA
// =========================

const bestCurrentDry = Math.max(
  ...base.map((u: any) => u.currentDry),
  0
);

const desiertoActual = base.filter(
  (u: any) =>
    u.currentDry === bestCurrentDry
);

const bestHistoricDry = Math.max(
  ...base.map((u: any) => u.maxDry),
  0
);

const desiertoHistorico = base.filter(
  (u: any) =>
    u.maxDry === bestHistoricDry
);
  // =========================
// 💰 CAZAPUNTOS
// =========================

const dailyScores: any[] = [];

const fechas = [
  ...new Set(
    finished.map((m: any) =>
      new Date(m.match_date)
        .toLocaleDateString("es-AR")
    )
  ),
];

fechas.forEach((fecha) => {
  players.forEach((u: any) => {
    let pts = 0;

    predictions
      .filter((p: any) => p.user_id === u.id)
      .forEach((p: any) => {
        const match = finished.find(
          (m: any) =>
            m.id === p.match_id &&
            new Date(
              m.match_date
            ).toLocaleDateString("es-AR") ===
              fecha
        );

        if (match) {
          pts += Number(p.points || 0);
        }
      });

    dailyScores.push({
      fecha,
      user: u.name,
      points: pts,
    });
  });
});

// ===== ACTUAL =====

const ultimaFecha =
  fechas[fechas.length - 1];

const ultimoDia = dailyScores.filter(
  (d) => d.fecha === ultimaFecha
);

const bestActual = Math.max(
  ...ultimoDia.map((d) => d.points),
  0
);

const cazapuntosActual = ultimoDia.filter(
  (d) => d.points === bestActual
);

// ===== HISTORICO =====

const bestHistoric = Math.max(
  ...dailyScores.map((d) => d.points),
  0
);

const cazapuntosHistorico =
  dailyScores.filter(
    (d) => d.points === bestHistoric
  );

 // =========================
// 👁️ LA VIO VENIR
// =========================

const vioVenir: any[] = [];

finished.forEach((m: any) => {
  const exactos = players.filter((u: any) => {
    const p = predictions.find(
      (x: any) =>
        x.user_id === u.id &&
        x.match_id === m.id
    );

    return p && isExact(p, m);
  });

  const acertaronResultado = players.filter((u: any) => {
    const p = predictions.find(
      (x: any) =>
        x.user_id === u.id &&
        x.match_id === m.id
    );

    return p && isResult(p, m);
  });

  // Solo cuenta si el único que acertó el resultado fue
  // además el único que acertó exacto.

  if (
    exactos.length === 1 &&
    acertaronResultado.length === 1
  ) {
    vioVenir.push({
      userName: exactos[0].name,
      home: m.team_home,
      away: m.team_away,
      homeScore: m.home_score,
      awayScore: m.away_score,
      date: m.match_date,
    });
  }
});
  // =========================
// 📅 GANADORES DIARIOS
// =========================

const ganadoresDiarios = [...fechas]
  .reverse()
  .map((fecha) => {
    const dia = dailyScores.filter(
      (d) => d.fecha === fecha
    );

    const best = Math.max(
      ...dia.map((d) => d.points),
      0
    );

    return {
      fecha,
      users: dia
        .filter((d) => d.points === best)
        .map((d) => d.user),
      points: best,
    };
  });

return {
  reyExactos,

  enLlamasActual,
  enLlamasHistorico,

  desiertoActual,
  desiertoHistorico,

  cazapuntosActual,
  cazapuntosHistorico,

  ganadoresDiarios,

  vioVenir,
};
}
