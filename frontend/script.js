/* ============ CONFIG ============

If your backend (bot server) is on Render, set it here after you deploy:
Example:
const API_BASE = "https://bingo-arada-bot.onrender.com";

For now you can leave it "" (same origin) or set it later.
The frontend has a fallback DEMO MODE if API is unreachable.

================================= */
const API_BASE = ""; // ← put your Render backend URL later (e.g. https://your-backend.onrender.com)

const stakeEl = document.getElementById("stake");
const gameStatusEl = document.getElementById("gameStatus");
const countdownEl = document.getElementById("countdown");
const playersEl = document.getElementById("players");
const drawStreamEl = document.getElementById("drawStream");
const lastCallEl = document.getElementById("lastCall");
const audioToggleBtn = document.getElementById("audioToggle");
const connDot = document.getElementById("connDot");
const connText = document.getElementById("connText");
const demoBadge = document.getElementById("demoBadge");
const boardEl = document.getElementById("board");

let AUDIO_ON = false;
let LAST_PLAYED = null;
let DEMO = false;
let failCount = 0;
let lastSeenDrawLen = 0;

// Preload audio tags lazily on first need
function playAudioFor(n) {
  if (!AUDIO_ON || !n) return;
  const letter = n<=15?'B':n<=30?'I':n<=45?'N':n<=60?'G':'O';
  const file = `./audio/${letter}${n}.mp3`; // e.g., audio/B12.mp3
  const a = new Audio(file);
  a.play().catch(()=>{ /* ignore user-gesture limits */ });
}

audioToggleBtn.addEventListener("click", () => {
  AUDIO_ON = !AUDIO_ON;
  audioToggleBtn.textContent = AUDIO_ON ? "🔊 Audio: ON" : "🔇 Audio: OFF";
});

// Render BINGO board
function makeBoard() {
  boardEl.innerHTML = "";
  const headers = ["B","I","N","G","O"];
  headers.forEach((h,i)=>{
    const cell = document.createElement("div");
    cell.className = `cell head col-${h}`;
    cell.textContent = h;
    boardEl.appendChild(cell);
  });
  // rows 1..15 for B, 16..30 for I, ...
  const colRanges = [
    [1,15],[16,30],[31,45],[46,60],[61,75]
  ];
  // We render column-wise but arrange in 5x15 visually
  const grid = [];
  for (let r=0; r<15; r++){
    for (let c=0; c<5; c++){
      const [a,b] = colRanges[c];
      const n = a + r;
      const div = document.createElement("div");
      div.dataset.num = n;
      div.className = `cell col-${headers[c]}`;
      div.innerHTML = `<div class="num">${n}</div>`;
      boardEl.appendChild(div);
      grid.push(div);
    }
  }
}
makeBoard();

function setConnection(online) {
  connDot.className = "dot " + (online ? "on" : "off");
  connText.textContent = online ? "CONNECTED" : "DISCONNECTED";
}

function renderState(s) {
  gameStatusEl.textContent = s.status || "idle";
  countdownEl.textContent = s.status === "lobby" ? `starts in ${s.countdown}s` :
                            s.status === "running" ? `draw ${s.drawn.length}/75` : "—";
  playersEl.textContent = `players: ${s.players ?? "—"}`;

  // highlight numbers
  const drawnSet = new Set(s.drawn || []);
  [...boardEl.querySelectorAll(".cell")].forEach(div => {
    const n = Number(div.dataset.num);
    if (!n) return;
    div.classList.toggle("hit", drawnSet.has(n));
  });

  // last call
  lastCallEl.textContent = s.lastDraw ? (s.lastDraw<=15?'B':s.lastDraw<=30?'I':s.lastDraw<=45?'N':s.lastDraw<=60?'G':'O') + " " + s.lastDraw : "—";

  // stream
  drawStreamEl.innerHTML = "";
  (s.drawn || []).forEach((n, i) => {
    const chip = document.createElement("span");
    const label = (n<=15?'B':n<=30?'I':n<=45?'N':n<=60?'G':'O') + n;
    chip.className = "ball" + (i === (s.drawn.length-1) ? " new" : "");
    chip.textContent = label;
    drawStreamEl.appendChild(chip);
  });

  // play audio only when new number arrives
  if (AUDIO_ON && s.drawn && s.drawn.length && s.drawn.length !== lastSeenDrawLen) {
    const n = s.drawn[s.drawn.length-1];
    if (n !== LAST_PLAYED) {
      LAST_PLAYED = n;
      playAudioFor(n);
    }
  }
  lastSeenDrawLen = (s.drawn || []).length;
}

async function fetchState(stake) {
  const url = API_BASE ? `${API_BASE}/api/game/${stake}` : `/api/game/${stake}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("API failed");
  return res.json();
}

// DEMO generator if API not available
let demoTimer = null;
let demoState = {
  status: "idle",
  stake: 10,
  countdown: 15,
  drawn: [],
  lastDraw: null,
  players: 2
};
function startDemo(stake){
  DEMO = true;
  demoBadge.classList.remove("hidden");
  demoState = { status:"lobby", stake:Number(stake), countdown:15, drawn:[], lastDraw:null, players:2+Math.floor(Math.random()*4) };
  clearInterval(demoTimer);
  demoTimer = setInterval(()=>{
    if (demoState.status === "lobby") {
      demoState.countdown--;
      if (demoState.countdown <= 0) {
        demoState.status = "running";
      }
    } else if (demoState.status === "running") {
      // draw next
      const pool = Array.from({length:75}, (_,i)=>i+1).filter(x=>!demoState.drawn.includes(x));
      if (!pool.length) { demoState.status="cooldown"; return; }
      const next = pool[Math.floor(Math.random()*pool.length)];
      demoState.drawn.push(next);
      demoState.lastDraw = next;
      if (demoState.drawn.length >= 25 + Math.floor(Math.random()*15)) {
        demoState.status = "cooldown";
      }
    } else if (demoState.status === "cooldown") {
      // restart
      demoState = { status:"lobby", stake:Number(stake), countdown:15, drawn:[], lastDraw:null, players:2+Math.floor(Math.random()*4) };
    }
    renderState(demoState);
    setConnection(false);
  }, 1200);
}

async function tick(){
  const stake = stakeEl.value;
  if (DEMO) return; // demo loop already rendering
  try {
    const s = await fetchState(stake);
    setConnection(true);
    demoBadge.classList.add("hidden");
    failCount = 0;
    renderState({
      status: s.status,
      stake: s.stake,
      countdown: s.countdown ?? null,
      drawn: s.drawn || [],
      lastDraw: s.lastDraw || (s.drawn && s.drawn.length ? s.drawn[s.drawn.length-1] : null),
      players: s.players ?? null
    });
  } catch (e) {
    failCount++;
    setConnection(false);
    if (failCount >= 3 && !DEMO) {
      startDemo(stake);
    }
  }
}
setInterval(tick, 1200);
tick();

stakeEl.addEventListener("change", ()=>{
  lastSeenDrawLen = 0;
  LAST_PLAYED = null;
  if (DEMO) startDemo(stakeEl.value);
});
