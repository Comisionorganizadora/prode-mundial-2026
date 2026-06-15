import { getFinished } from "./core";
import { buildRanking } from "./rankings";
import { buildVioVenir } from "./events";
import { buildStreaks } from "./streaks";

export function buildStats(input: any) {
  const { users, matches, predictions } = input;

  const finished = getFinished(matches);

  const ranking = buildRanking(users, finished, predictions);

  const enriched = users.map((u: any) => {
    const streaks = buildStreaks(u, finished, predictions);
    return {
      ...ranking.find((r) => r.id === u.id),
      ...streaks,
    };
  });

  const vioVenir = buildVioVenir(users, finished, predictions);

  return {
    ranking: enriched,
    vioVenir,
  };
}