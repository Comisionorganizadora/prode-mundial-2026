import { isExact } from "./core";

export function buildVioVenir(
  users: any[],
  finished: any[],
  predictions: any[]
) {
  const events: any[] = [];

  finished.forEach((m) => {
    const correct = users.filter((u) => {
      const p = predictions.find(
        (x: any) =>
          x.user_id === u.id &&
          x.match_id === m.id
      );

      return p && isExact(p, m);
    });

    if (correct.length === 1) {
      events.push({
        userName: correct[0].name,
        home: m.team_home ?? m.home_team ?? m.home,
        away: m.team_away ?? m.away_team ?? m.away,
        homeScore: m.home_score,
        awayScore: m.away_score,
        date: m.match_date,
      });
    }
  });

  return events;
}