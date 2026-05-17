import { getAccounts, getDepartments } from "./accounts.js";

const departmentMilestoneTargets = {
  HR: 5,
  Finance: 5,
  Engineering: 6,
  Operations: 4,
  Legal: 4,
  IT: 5,
  Security: 4,
  Executive: 3
};

async function getCapturedLures(db) {
  const result = await db.prepare("SELECT account_id, service_id, captured_at FROM used_lures WHERE captured_at IS NOT NULL").all();
  return result.results || [];
}

function campaignPhase(label, objectives) {
  const completedCount = objectives.filter((objective) => objective.complete).length;
  const complete = completedCount === objectives.length;
  return {
    label,
    complete,
    progressLabel: `${completedCount}/${objectives.length}`,
    objectives
  };
}

export async function getSolved(db) {
  const result = await db.prepare("SELECT account_id, participant, points, submitted_at FROM solved_flags ORDER BY submitted_at ASC").all();
  return result.results || [];
}

export async function getGameState(db, finalFlagValue = null) {
  const accounts = getAccounts();
  const solved = await getSolved(db);
  const capturedLures = await getCapturedLures(db);
  const capturedByAccount = new Map(capturedLures.map((row) => [row.account_id, row]));
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
  const servicesUsed = new Set();
  const tierCounts = { tier2: 0, tier3: 0, tier4: 0, tier2plus: 0 };
  const network = getDepartments().map((department) => {
    const nodes = accounts
      .filter((account) => account.department === department.name)
      .map((account) => {
        const solve = solvedById.get(account.id);
        const capture = capturedByAccount.get(account.id);
        if (capture?.service_id) {
          servicesUsed.add(capture.service_id);
        }
        if (solve) {
          if (account.tier >= 2) tierCounts.tier2plus += 1;
          if (account.tier === 2) tierCounts.tier2 += 1;
          if (account.tier === 3) tierCounts.tier3 += 1;
          if (account.tier === 4) tierCounts.tier4 += 1;
        }
        return {
          id: account.id,
          label: account.email.split("@")[0],
          tier: account.tier,
          points: account.points,
          solved: Boolean(solve),
          owner: solve?.participant || null
        };
      });
    const solvedCount = nodes.filter((node) => node.solved).length;
    return {
      name: department.name,
      color: department.color,
      key: department.key,
      solved: solvedCount,
      total: nodes.length,
      percent: Math.round((solvedCount / nodes.length) * 100),
      nodes
    };
  });
  const departmentsCovered = departmentStats.filter((department) => department.solved > 0).length;
  const vlansWithThreePlus = departmentStats.filter((department) => department.solved >= 3).length;
  const departmentMilestones = departmentStats.map((department) => {
    const target = departmentMilestoneTargets[department.name] || Math.ceil(department.total * 0.35);
    return {
      name: department.name,
      solved: department.solved,
      target,
      complete: department.solved >= target
    };
  });
  const vlansAtMilestone = departmentMilestones.filter((milestone) => milestone.complete).length;
  const campaign = {
    totals: {
      captures: solved.length,
      captureTarget: 60,
      departmentsCovered,
      departmentTarget: 8,
      servicesUsed: servicesUsed.size,
      serviceTarget: 6,
      vlansAtMilestone,
      vlanTarget: departmentMilestones.length,
      tier2plus: tierCounts.tier2plus,
      tier2plusTarget: 10,
      tier4: tierCounts.tier4,
      tier4Target: 3
    },
    departmentMilestones,
    phases: []
  };
  campaign.phases = [
    campaignPhase("Phase 1: Establish Workflow", [
      { label: "10 valid captures", current: solved.length, target: 10, complete: solved.length >= 10 },
      { label: "3 departments covered", current: departmentsCovered, target: 3, complete: departmentsCovered >= 3 },
      { label: "2 distinct phishlet services used", current: servicesUsed.size, target: 2, complete: servicesUsed.size >= 2 }
    ]),
    campaignPhase("Phase 2: Department Spread", [
      { label: "20 valid captures", current: solved.length, target: 20, complete: solved.length >= 20 },
      { label: "All 8 departments covered", current: departmentsCovered, target: 8, complete: departmentsCovered >= 8 },
      { label: "4 distinct phishlet services used", current: servicesUsed.size, target: 4, complete: servicesUsed.size >= 4 }
    ]),
    campaignPhase("Phase 3: VLAN Penetration", [
      { label: "35 valid captures", current: solved.length, target: 35, complete: solved.length >= 35 },
      { label: "6 VLANs with 3+ recovered hosts", current: vlansWithThreePlus, target: 6, complete: vlansWithThreePlus >= 6 },
      { label: "4 VLAN milestones complete", current: vlansAtMilestone, target: 4, complete: vlansAtMilestone >= 4 }
    ]),
    campaignPhase("Phase 4: High-Value Targeting", [
      { label: "10 Tier 2+ targets recovered", current: tierCounts.tier2plus, target: 10, complete: tierCounts.tier2plus >= 10 },
      { label: "3 Tier 4 targets recovered", current: tierCounts.tier4, target: 3, complete: tierCounts.tier4 >= 3 },
      { label: "5 distinct phishlet services used", current: servicesUsed.size, target: 5, complete: servicesUsed.size >= 5 }
    ]),
    campaignPhase("Phase 5: Full Coverage", [
      { label: "60 valid captures", current: solved.length, target: 60, complete: solved.length >= 60 },
      { label: "8 VLAN milestones complete", current: vlansAtMilestone, target: 8, complete: vlansAtMilestone >= 8 },
      { label: "6 distinct phishlet services used", current: servicesUsed.size, target: 6, complete: servicesUsed.size >= 6 },
      { label: "10 Tier 2+ targets recovered", current: tierCounts.tier2plus, target: 10, complete: tierCounts.tier2plus >= 10 },
      { label: "3 Tier 4 targets recovered", current: tierCounts.tier4, target: 3, complete: tierCounts.tier4 >= 3 }
    ])
  ];
  campaign.completed = campaign.phases.every((phase) => phase.complete);
  campaign.activePhase = campaign.phases.findIndex((phase) => !phase.complete) + 1 || campaign.phases.length;
  const finalUnlocked = campaign.completed;

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
    network,
    campaign
  };
}
