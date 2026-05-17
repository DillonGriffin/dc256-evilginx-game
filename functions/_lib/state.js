import { getAccounts, getDepartments } from "./accounts.js";

export async function getSolved(db) {
  const result = await db.prepare("SELECT account_id, participant, points, submitted_at FROM solved_flags ORDER BY submitted_at ASC").all();
  return result.results || [];
}

export async function getGameState(db, finalFlagValue = null) {
  const accounts = getAccounts();
  const solved = await getSolved(db);
  const solvedById = new Map(solved.map((row) => [row.account_id, row]));
  const solvedIds = new Set(solvedById.keys());
  const departmentStats = getDepartments().map((department) => {
    const deptAccounts = accounts.filter((account) => account.department === department.name);
    const solvedDept = deptAccounts.filter((account) => solvedIds.has(account.id));
    return {
      name: department.name,
      color: department.color,
      solved: solvedDept.length,
      total: deptAccounts.length,
      keyEarned: solvedDept.length >= Math.ceil(deptAccounts.length * 0.35)
    };
  });
  const keysEarned = departmentStats.filter((department) => department.keyEarned).length;
  const totalPoints = solved.reduce((sum, row) => sum + Number(row.points || 0), 0);
  const finalUnlocked = keysEarned >= 6;
  const leaderboardMap = new Map();
  for (const row of solved) {
    const participant = row.participant || "anonymous";
    if (!leaderboardMap.has(participant)) {
      leaderboardMap.set(participant, { participant, points: 0, solves: 0, lastSolvedAt: row.submitted_at });
    }
    const entry = leaderboardMap.get(participant);
    entry.points += Number(row.points || 0);
    entry.solves += 1;
    entry.lastSolvedAt = row.submitted_at;
  }
  const leaderboard = [...leaderboardMap.values()].sort((left, right) => {
    if (right.points !== left.points) return right.points - left.points;
    if (right.solves !== left.solves) return right.solves - left.solves;
    return String(left.lastSolvedAt).localeCompare(String(right.lastSolvedAt));
  });
  const network = getDepartments().map((department) => ({
    name: department.name,
    color: department.color,
    key: department.key,
    nodes: accounts
      .filter((account) => account.department === department.name)
      .map((account) => {
        const solve = solvedById.get(account.id);
        return {
          id: account.id,
          label: account.email.split("@")[0],
          tier: account.tier,
          points: account.points,
          solved: Boolean(solve),
          owner: solve?.participant || null
        };
      })
  }));

  return {
    solvedCount: solved.length,
    totalAccounts: accounts.length,
    totalPoints,
    keysEarned,
    keysRequired: 6,
    finalUnlocked,
    finalFlag: finalUnlocked ? finalFlagValue : null,
    departments: departmentStats,
    solvedAccounts: solved.map((row) => row.account_id),
    leaderboard,
    network
  };
}
