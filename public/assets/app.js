const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function participantName() {
  const current = localStorage.getItem("dc256.participant");
  if (current) return current;
  const generated = `team-${Math.random().toString(16).slice(2, 8)}`;
  localStorage.setItem("dc256.participant", generated);
  return generated;
}

function setParticipant(value) {
  const clean = value.trim() || participantName();
  localStorage.setItem("dc256.participant", clean);
  return clean;
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

function showResult(element, text, ok = true) {
  element.textContent = text;
  element.classList.remove("ok", "error");
  element.classList.add(ok ? "ok" : "error");
}

async function loadAccounts(select) {
  const data = await api("/api/accounts");
  if (select) {
    select.innerHTML = data.accounts.map((account) => (
      `<option value="${account.id}">${account.email} - ${account.department} - Tier ${account.tier}</option>`
    )).join("");
  }
  return data.accounts;
}

async function loadServices() {
  return api("/api/services");
}

async function loadState() {
  return api("/api/state");
}

function renderState(state) {
  const solved = $("#solvedCount");
  const points = $("#totalPoints");
  const keys = $("#keysEarned");
  const final = $("#finalStatus");
  if (solved) solved.textContent = `${state.solvedCount}/${state.totalAccounts}`;
  if (points) points.textContent = String(state.totalPoints);
  if (keys) keys.textContent = `${state.keysEarned}/${state.keysRequired}`;
  if (final) {
    final.textContent = state.finalUnlocked ? state.finalFlag : "Locked";
    final.classList.toggle("ok", state.finalUnlocked);
  }

  const deptRoot = $("#departmentProgress");
  if (deptRoot) {
    deptRoot.innerHTML = state.departments.map((dept) => {
      const pct = Math.round((dept.solved / dept.total) * 100);
      return `<div class="panel dept">
        <h3>${dept.name} ${dept.keyEarned ? '<span class="pill">key earned</span>' : ""}</h3>
        <p class="muted">${dept.solved} of ${dept.total} nodes unlocked</p>
        <div class="progress"><span style="width:${pct}%; background:${dept.color}"></span></div>
      </div>`;
    }).join("");
  }

  const map = $("#breachMap");
  if (map) {
    const solvedIds = new Set(state.solvedAccounts);
    map.innerHTML = Array.from({ length: state.totalAccounts }, (_, index) => {
      const id = `acct-${String(index + 1).padStart(3, "0")}`;
      const solvedClass = solvedIds.has(id) ? " solved" : "";
      return `<div class="node${solvedClass}" title="${id}"><span>${id.slice(-3)}</span></div>`;
    }).join("");
  }
}

window.DC256 = {
  $,
  $$,
  api,
  loadAccounts,
  loadServices,
  loadState,
  renderState,
  showResult,
  participantName,
  setParticipant
};
