import { isExact, getPred } from "./core";

export function buildVioVenir(users: any[], finished: any[], predictions: any[]) {
  const events: any[] = [];

  finished.forEach((m) => {
    const correct = users.filter((u) => {
      const p = getPred(predictions, u.id, m.id);
      return p && isExact(p, m);
    });

    if (correct.length === 1) {
      events.push({
        userName: correct[0].name,
        home: m.home_team ?? m.home ?? "HOME",
        away: m.away_team ?? m.away ?? "AWAY",
        homeScore: m.home_score,
        awayScore: m.away_score,
        date: m.match_date,
      });
    }
  });

  return events;
}