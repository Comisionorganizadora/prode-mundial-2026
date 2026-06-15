import { isExact } from "./core";

export function buildRanking(users: any[], finished: any[], predictions: any[]) {
  return users.map((u) => {
    const preds = predictions.filter((p) => p.user_id === u.id);

    let points = 0;
    let exactos = 0;

    preds.forEach((p) => {
      points += Number(p.points || 0);

      const m = finished.find((f) => f.id === p.match_id);
      if (!m) return;

      if (isExact(p, m)) exactos++;
    });

    return {
      id: u.id,
      name: u.name,
      points,
      exactos,
    };
  });
}