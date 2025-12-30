// ================= CONFIGURATION =================
const API_KEY = "YOUR_API_KEY";

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("result.html")) {
    initResultPage();
  } else {
    initFormPage();
  }
});

// ================= SHARED FINANCIAL ENGINE =================
function computeFinancials(d) {
  const income = d.income_self + d.income_spouse;

  const fixed =
    d.fix_rent +
    d.fix_home_emi +
    d.fix_other_emi +
    d.fix_food +
    d.fix_utils +
    d.fix_transport +
    d.fix_medical;

  const variable =
    d.var_subs +
    d.var_entertainment +
    d.var_lifestyle +
    d.var_travel +
    d.var_misc;

  const savings = income - (fixed + variable);

  return {
    income,
    fixed,
    variable,
    savings,
    savingsRate: income > 0 ? (savings / income) * 100 : 0,
    fixedRatio: income > 0 ? (fixed / income) * 100 : 0,
    emiRatio:
      income > 0
        ? ((d.fix_home_emi + d.fix_other_emi) / income) * 100
        : 0
  };
}

// ================= PAGE 1: FORM =================
function initFormPage() {
  const form = document.getElementById("finForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = document.getElementById("analyzeBtn");
    const loader = document.getElementById("btnLoader");
    const btnText = document.querySelector(".btn-text");

    btn.disabled = true;
    loader.style.display = "inline-block";
    btnText.textContent = "Generating Report...";

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    for (let k in data) {
      if (
        k.startsWith("income") ||
        k.startsWith("fix") ||
        k.startsWith("var") ||
        k.startsWith("asset")
      ) {
        data[k] = Number(data[k]) || 0;
      }
    }

    const health = calculateHealthScore(data);
    const personality = detectPersonality(data, health.score);

    try {
      const model = await findFlashModel();
      const ai = await callGemini(model, data, health);

      localStorage.setItem(
        "finData",
        JSON.stringify({
          raw: data,
          health,
          personality,
          ai
        })
      );

      window.location.href = "result.html";
    } catch (err) {
      alert(err.message || "Something went wrong");
      btn.disabled = false;
      loader.style.display = "none";
      btnText.textContent = "Analyze My Finances";
    }
  });
}

// ================= PAGE 2: RESULT =================
function initResultPage() {
  const raw = localStorage.getItem("finData");
  if (!raw) return (window.location.href = "index.html");

  const data = JSON.parse(raw);
  const d = data.raw;

  animateValue(
    document.getElementById("scoreNum"),
    0,
    data.health.score,
    1500
  );
  updateScoreRing(data.health.score);

  document.getElementById("persTitle").textContent =
    data.personality.title;
  document.getElementById("persDesc").textContent =
    data.personality.desc;

  const parser =
    typeof marked !== "undefined" ? marked.parse : (t) => t;

  document.getElementById("swotContainer").innerHTML =
    parser(data.ai.swot);
  document.getElementById("actionContainer").innerHTML =
    parser(data.ai.actions);

  generateAlerts(d);
  generateVisualBar(d);
  generateBenchmarks(d);
  generateSavingsTarget(d);
}

// ================= ALERTS =================
function generateAlerts(d) {
  const f = computeFinancials(d);
  if (f.income <= 0) return;

  const emergencyMonths =
    f.fixed > 0 ? d.asset_fund / f.fixed : 0;

  const c = document.getElementById("alertContainer");
  if (!c) return;
  c.innerHTML = "";

  if (f.emiRatio > 40)
    c.innerHTML += `<div class="alert-card alert-danger">High EMI burden (${f.emiRatio.toFixed(
      0
    )}%)</div>`;

  if (f.savingsRate < 10)
    c.innerHTML += `<div class="alert-card alert-danger">Very low savings (${f.savingsRate.toFixed(
      0
    )}%)</div>`;

  if (emergencyMonths < 3)
    c.innerHTML += `<div class="alert-card alert-warning">Emergency fund covers only ${emergencyMonths.toFixed(
      1
    )} months</div>`;

  if (c.innerHTML === "")
    c.innerHTML =
      <div class="alert-card alert-success">No critical financial risks detected</div>;
}

// ================= SPENDING DNA =================
function generateVisualBar(d) {
  const f = computeFinancials(d);
  if (f.income <= 0) return;

  const total = f.fixed + f.variable + Math.max(0, f.savings);

  const n = total > 0 ? (f.fixed / total) * 100 : 0;
  const w = total > 0 ? (f.variable / total) * 100 : 0;
  const s =
    total > 0 ? (Math.max(0, f.savings) / total) * 100 : 0;

  document.getElementById("barNeeds").style.width = ${n}%;
  document.getElementById("barWants").style.width = ${w}%;
  document.getElementById("barSavings").style.width = ${s}%;

  document.querySelector("#legendNeeds strong").textContent =
    ${Math.round(n)}%;
  document.querySelector("#legendWants strong").textContent =
    ${Math.round(w)}%;
  document.querySelector("#legendSavings strong").textContent =
    ${Math.round(s)}%;
}

// ================= BENCHMARKS =================
function generateBenchmarks(d) {
  const f = computeFinancials(d);
  if (f.income <= 0) return;

  const needsStatus =
    f.fixedRatio <= 50
      ? "🟢 Good"
      : f.fixedRatio <= 65
      ? "🟡 Warning"
      : "🔴 Danger";

  const emiStatus =
    f.emiRatio <= 30
      ? "🟢 Good"
      : f.emiRatio <= 40
      ? "🟡 Warning"
      : "🔴 Danger";

  const insuranceStatus =
    d.prot_health === "yes" ? "🟢 Covered" : "🔴 Missing";

  const tbody = document.getElementById("benchmarkBody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td>Needs</td>
      <td>&lt; 50%</td>
      <td>${f.fixedRatio.toFixed(0)}%</td>
      <td>${needsStatus}</td>
    </tr>
    <tr>
      <td>EMI</td>
      <td>&lt; 30%</td>
      <td>${f.emiRatio.toFixed(0)}%</td>
      <td>${emiStatus}</td>
    </tr>
    <tr>
      <td>Insurance</td>
      <td>Yes</td>
      <td>${d.prot_health === "yes" ? "Yes" : "No"}</td>
      <td>${insuranceStatus}</td>
    </tr>
  `;
}

// ================= SAVINGS TARGET =================
function generateSavingsTarget(d) {
  const f = computeFinancials(d);
  if (f.income <= 0) return;

  const target = f.income * 0.2;
  const el = document.getElementById("targetText");
  if (!el) return;

  el.innerHTML =
    f.savings < target
      ? `Increase savings by <strong>₹${Math.ceil(
          target - f.savings
        ).toLocaleString()}</strong> per month`
      : `You are saving <strong>₹${Math.ceil(
          f.savings - target
        ).toLocaleString()}</strong> above the target`;
}

// ================= SCORE ENGINE =================
function calculateHealthScore(d) {
  const f = computeFinancials(d);
  if (f.income <= 0) return { score: 0 };

  let score = 0;

  score += Math.min(40, (f.savingsRate / 30) * 40);
  score += Math.max(0, 20 - Math.max(0, f.fixedRatio - 50));
  score += Math.max(0, 20 - Math.max(0, f.emiRatio - 30));

  if (d.prot_health === "yes") score += 10;
  if (d.prot_life === "yes") score += 10;

  return { score: Math.round(Math.min(100, score)) };
}

// ================= PERSONALITY =================
function detectPersonality(d, score) {
  const f = computeFinancials(d);
  const wantsRatio = f.variable / f.income;

  if (score > 80 && d.mindset_risk === "high")
    return {
      title: "The Wealth Accelerator",
      desc: "High growth with discipline."
    };

  if (wantsRatio > 0.4)
    return {
      title: "The Lifestyle Lavish",
      desc: "High discretionary spending."
    };

  if (score < 40)
    return {
      title: "The Paycheck Survivor",
      desc: "Needs stabilization."
    };

  return {
    title: "The Balancer",
    desc: "Healthy financial balance."
  };
}

// ================= AI =================
async function findFlashModel() {
  const res = await fetch(
    https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}
  );
  const json = await res.json();
  const m = json.models.find((x) => x.name.includes("flash"));
  return m ? m.name.replace("models/", "") : "gemini-1.5-flash";
}

 async function callGemini(model, d, health) {
  const f = computeFinancials(d);

  const prompt = `
You are a Certified Financial Planner for an Indian fintech app.

STRICT RULES:
- SWOT only above divider
- Actions only below divider
- Short, professional, practical

STRENGTHS:
- Max 3 bullets

WEAKNESSES:
- Max 2 bullets

OPPORTUNITIES:
- Max 2 bullets

THREATS:
- Max 2 bullets

|||SECTION|||

IMMEDIATE ACTIONS:
1. One clear financial action
2. One clear financial action
3. One clear financial action

DATA:
Income ₹${f.income}
Savings ₹${f.savings}
Savings Rate ${f.savingsRate.toFixed(1)}%
EMI ${f.emiRatio.toFixed(1)}%
Score ${health.score}/100
`;

  const res = await fetch(
    https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY},
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  );

  const json = await res.json();

  // 🔥 CRITICAL SAFETY CHECKS
  if (!json.candidates || !json.candidates.length) {
    throw new Error("AI returned no response. Please try again.");
  }

  const candidate = json.candidates[0];
  if (!candidate.content || !candidate.content.parts || !candidate.content.parts.length) {
    throw new Error("AI response malformed.");
  }

  const text = candidate.content.parts[0].text;
  const parts = text.split("|||SECTION|||");

  return {
    swot: parts[0]?.trim() || "No SWOT generated.",
    actions: parts[1]?.trim() || "• No actions generated."
  };
}


// ================= UI HELPERS =================
function updateScoreRing(score) {
  const ring = document.getElementById("scoreRing");
  const color =
    score > 75 ? "#10b981" : score > 50 ? "#f59e0b" : "#ef4444";
  ring.style.background = conic-gradient(${color} ${score}%, #1f2937 0%);
}

function animateValue(el, start, end, duration) {
  let startTime = null;
  function step(ts) {
    if (!startTime) startTime = ts;
    const p = Math.min((ts - startTime) / duration, 1);
    el.textContent = Math.floor(p * (end - start) + start);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
