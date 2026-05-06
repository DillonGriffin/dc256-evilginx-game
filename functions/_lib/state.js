import { getAccounts, getDepartments } from "./accounts.js";

export async function getSolved(db) {
  const result = await db.prepare("SELECT account_id, participant, points, submitted_at FROM solved_flags ORDER BY submitted_at ASC").all();
  return result.results || [];
}

export async function getGameState(db, finalFlagValue = null) {
  const accounts = getAccounts();
  const solved = await getSolved(db);
  const solvedIds = new Set(solved.map((row) => row.account_id));
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

  return {
    solvedCount: solved.length,
    totalAccounts: accounts.length,
    totalPoints,
    keysEarned,
    keysRequired: 6,
    finalUnlocked,
    finalFlag: finalUnlocked ? finalFlagValue : null,
    departments: departmentStats,
    solvedAccounts: solved.map((row) => row.account_id)
  };
}
