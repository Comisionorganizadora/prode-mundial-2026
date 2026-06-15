export function isExact(p: any, m: any) {
  return (
    Number(p.predicted_home) === Number(m.home_score) &&
    Number(p.predicted_away) === Number(m.away_score)
  );
}

export function isResult(p: any, m: any) {
  const pr =
    p.predicted_home > p.predicted_away ? "H" :
    p.predicted_home < p.predicted_away ? "A" : "D";

  const rr =
    m.home_score > m.away_score ? "H" :
    m.home_score < m.away_score ? "A" : "D";

  return pr === rr;
}