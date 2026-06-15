import { isResult } from "./core";

export function buildStreaks(user: any, finished: any[], predictions: any[]) {
  const preds = predictions.filter((p) => p.user_id === user.id);

  let hit = 0;
  let maxHit = 0;

  let dry = 0;
  let maxDry = 0;

  preds.forEach((p) => {
    const m = finished.find((f) => f.id === p.match_id);
    if (!m) return;

    if (isResult(p, m)) {
      hit++;
      maxHit = Math.max(maxHit, hit);
      dry = 0;
    } else {
      hit = 0;
      dry++;
      maxDry = Math.max(maxDry, dry);
    }
  });

  return {
    currentHit: hit,
    bestHit: maxHit,
    currentDry: dry,
    bestDry: maxDry,
  };
}