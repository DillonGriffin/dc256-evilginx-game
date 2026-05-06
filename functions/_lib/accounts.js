const firstNames = [
  "Alex", "Bailey", "Casey", "Drew", "Emerson", "Finley", "Gray", "Harper", "Indigo", "Jordan",
  "Kai", "Logan", "Morgan", "Noel", "Oakley", "Parker", "Quinn", "Reese", "Riley", "Sawyer",
  "Taylor", "Avery", "Blake", "Cameron", "Dakota", "Elliot", "Frankie", "Hayden", "Jamie", "Kendall"
];

const lastNames = [
  "Morgan", "Rivera", "Chen", "Patel", "Garcia", "Nguyen", "Turner", "Brooks", "Cooper", "Diaz",
  "Ellis", "Foster", "Hayes", "Kim", "Lewis", "Miller", "Nelson", "Ortiz", "Price", "Reed",
  "Shaw", "Stone", "Walker", "Young", "Bennett", "Carter", "Collins", "Murphy", "Ross", "Wright"
];

const departments = [
  { name: "HR", color: "#d14d72", key: "HR" },
  { name: "Finance", color: "#277c78", key: "FIN" },
  { name: "Engineering", color: "#4f6bed", key: "ENG" },
  { name: "Operations", color: "#6a994e", key: "OPS" },
  { name: "Legal", color: "#8f5c2c", key: "LEG" },
  { name: "IT", color: "#0086b3", key: "IT" },
  { name: "Security", color: "#b23a48", key: "SEC" },
  { name: "Executive", color: "#5f4bb6", key: "EXE" }
];

const services = [
  {
    id: "acme-payroll",
    name: "Acme Payroll",
    shortName: "Payroll",
    hostname: "payroll-login.dc256.lab",
    targetPath: "/login.html?service=acme-payroll",
    departments: ["Finance", "HR", "Executive"],
    clue: "Payroll close reminders, direct deposit updates, and W-2 notices."
  },
  {
    id: "ledgercloud",
    name: "LedgerCloud",
    shortName: "Ledger",
    hostname: "ledger-login.dc256.lab",
    targetPath: "/login.html?service=ledgercloud",
    departments: ["Finance", "Legal", "Executive"],
    clue: "Invoice approvals, vendor records, and quarter-end ledger notes."
  },
  {
    id: "traveldesk",
    name: "TravelDesk",
    shortName: "Travel",
    hostname: "travel-login.dc256.lab",
    targetPath: "/login.html?service=traveldesk",
    departments: ["Finance", "Operations", "Executive"],
    clue: "Expense reports, travel approvals, and reimbursement tickets."
  },
  {
    id: "gitforge",
    name: "GitForge",
    shortName: "Git",
    hostname: "git-login.dc256.lab",
    targetPath: "/login.html?service=gitforge",
    departments: ["Engineering", "Security", "IT"],
    clue: "Pull requests, code reviews, and release branch comments."
  },
  {
    id: "buildhive",
    name: "BuildHive",
    shortName: "Builds",
    hostname: "build-login.dc256.lab",
    targetPath: "/login.html?service=buildhive",
    departments: ["Engineering", "IT", "Security"],
    clue: "Pipeline failures, artifact links, and deployment status pages."
  },
  {
    id: "ticketnest",
    name: "TicketNest",
    shortName: "Tickets",
    hostname: "tickets-login.dc256.lab",
    targetPath: "/login.html?service=ticketnest",
    departments: ["Engineering", "Operations", "IT", "Security"],
    clue: "Bug triage, change requests, and service desk escalations."
  },
  {
    id: "peopleportal",
    name: "PeoplePortal",
    shortName: "People",
    hostname: "people-login.dc256.lab",
    targetPath: "/login.html?service=peopleportal",
    departments: ["HR", "Legal", "Executive"],
    clue: "Employee profile changes, policy acknowledgements, and org chart updates."
  },
  {
    id: "benefitsbox",
    name: "BenefitsBox",
    shortName: "Benefits",
    hostname: "benefits-login.dc256.lab",
    targetPath: "/login.html?service=benefitsbox",
    departments: ["HR", "Finance", "Legal"],
    clue: "Open enrollment posts, benefits questions, and dependent verification."
  },
  {
    id: "learnloop",
    name: "LearnLoop",
    shortName: "Learning",
    hostname: "learn-login.dc256.lab",
    targetPath: "/login.html?service=learnloop",
    departments: ["HR", "Operations", "Security"],
    clue: "Training assignments, certification reminders, and course completions."
  },
  {
    id: "helpdeskpro",
    name: "HelpDeskPro",
    shortName: "Help Desk",
    hostname: "helpdesk-login.dc256.lab",
    targetPath: "/login.html?service=helpdeskpro",
    departments: ["IT", "Operations", "Security"],
    clue: "Password reset tickets, device requests, and access troubleshooting."
  },
  {
    id: "devicevault",
    name: "DeviceVault",
    shortName: "Devices",
    hostname: "devices-login.dc256.lab",
    targetPath: "/login.html?service=devicevault",
    departments: ["IT", "Security", "Operations"],
    clue: "Laptop inventory, MDM enrollment, and endpoint compliance checks."
  },
  {
    id: "cloudconsole",
    name: "CloudConsole",
    shortName: "Cloud",
    hostname: "cloud-login.dc256.lab",
    targetPath: "/login.html?service=cloudconsole",
    departments: ["IT", "Security", "Engineering", "Executive"],
    clue: "Cloud access reviews, service health notices, and admin console changes."
  }
];

const titles = {
  HR: ["Recruiter", "Benefits Analyst", "People Ops Lead", "Training Coordinator"],
  Finance: ["Payroll Analyst", "Controller", "Billing Specialist", "Procurement Lead"],
  Engineering: ["Frontend Engineer", "Platform Engineer", "QA Analyst", "Release Manager"],
  Operations: ["Logistics Planner", "Facilities Lead", "Vendor Manager", "Ops Analyst"],
  Legal: ["Contracts Analyst", "Paralegal", "Compliance Counsel", "Records Lead"],
  IT: ["Help Desk Tech", "Systems Admin", "Identity Engineer", "Endpoint Lead"],
  Security: ["SOC Analyst", "Detection Engineer", "Risk Analyst", "Incident Commander"],
  Executive: ["Chief of Staff", "VP Strategy", "Executive Assistant", "CFO"]
};

function servicesForDepartment(department, index) {
  const primary = services.filter((service) => service.departments.includes(department));
  const rotated = [...primary.slice(index % primary.length), ...primary.slice(0, index % primary.length)];
  return rotated.slice(0, 3).map((service) => service.id);
}

function osintFor(account, index) {
  const selected = account.likelyServices.map((serviceId) => getService(serviceId));
  return [
    `${account.name} mentioned ${selected[0].name} during a recent ${account.department} status thread.`,
    `${account.title} workflow notes reference ${selected[1].shortName} notifications.`,
    `Calendar metadata shows recurring tasks tied to ${selected[2].name}.`
  ];
}

export function getDepartments() {
  return departments;
}

export function getServices() {
  return services;
}

export function getService(serviceId) {
  return services.find((service) => service.id === serviceId);
}

export function getServiceByHostname(hostname) {
  return services.find((service) => service.hostname === String(hostname || "").toLowerCase());
}

export function getAccounts() {
  const accounts = [];
  for (let i = 0; i < 150; i += 1) {
    const dept = departments[i % departments.length];
    const first = firstNames[i % firstNames.length];
    const last = lastNames[(i * 7) % lastNames.length];
    const tier = i >= 145 ? 4 : i >= 130 ? 3 : i >= 90 ? 2 : 1;
    const handle = `${first}.${last}${String(i + 1).padStart(3, "0")}`.toLowerCase();
    const titleList = titles[dept.name];
    const account = {
      id: `acct-${String(i + 1).padStart(3, "0")}`,
      email: `${handle}@dc256.example`,
      name: `${first} ${last}`,
      department: dept.name,
      departmentKey: dept.key,
      title: titleList[i % titleList.length],
      tier,
      points: tier * 100,
      likelyServices: servicesForDepartment(dept.name, i)
    };
    account.osint = osintFor(account, i);
    accounts.push(account);
  }
  return accounts;
}

export function getAccount(accountId) {
  return getAccounts().find((account) => account.id === accountId);
}

export function publicAccount(account) {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    department: account.department,
    title: account.title,
    tier: account.tier,
    points: account.points,
    likelyServices: account.likelyServices,
    osint: account.osint
  };
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function credentialFor(account, secret) {
  const seed = await sha256Hex(`${secret}:password:${account.id}:${account.email}`);
  return `Dc256-${seed.slice(0, 4)}-${seed.slice(4, 8)}!`;
}

export async function flagFor(account, secret) {
  const seed = await sha256Hex(`${secret}:flag:${account.id}:${account.email}`);
  return `DC256{${account.departmentKey.toLowerCase()}_${account.id.slice(-3)}_${seed.slice(0, 10)}}`;
}

export async function finalFlag(secret) {
  const seed = await sha256Hex(`${secret}:final:breach-map`);
  return `DC256{7h15_15_4_FL4G_${seed.slice(0, 6)}}`;
}

export async function hashValue(value, secret) {
  return sha256Hex(`${secret}:${value}`);
}
