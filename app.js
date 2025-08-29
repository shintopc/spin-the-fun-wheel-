// Spin the Fun Wheel - PWA
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spin-btn");
const resultModal = document.getElementById("result");
const resultText = document.getElementById("result-text");
const closeResult = document.getElementById("close-result");
const addBtn = document.getElementById("add-option");
const newOptionInput = document.getElementById("new-option");
const optionsList = document.getElementById("options-list");
const resetBtn = document.getElementById("reset-btn");
const saveBtn = document.getElementById("save-wheel");
const confettiCanvas = document.getElementById("confetti");
const cctx = confettiCanvas.getContext("2d");

let options = JSON.parse(localStorage.getItem("wheelOptions")) || [
  "Truth",
  "Dare",
  "Prize 🎁",
  "Sing a Song 🎤",
  "Dance 💃",
  "Joke 😂",
];

// sounds (WAV for full browser support)
const tickSound = new Audio("tick.wav");
const winSound = new Audio("celebration.wav");
tickSound.volume = 0.4;
winSound.volume = 0.7;

let angle = 0;
let spinning = false;
let lastTick = -1;

// ----- Draw Wheel -----
function drawWheel() {
  const W = canvas.width, H = canvas.height;
  const cx = W/2, cy = H/2, r = Math.min(W,H)/2;

  ctx.clearRect(0,0,W,H);

  const slices = Math.max(1, options.length);
  const sliceAngle = (2 * Math.PI) / slices;

  for (let i=0; i<slices; i++) {
    // slice
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, i*sliceAngle, (i+1)*sliceAngle);
    ctx.closePath();
    const even = i % 2 === 0;
    ctx.fillStyle = even ? "#ffcc80" : "#ffab91";
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.stroke();

    // text
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(i*sliceAngle + sliceAngle/2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#111";
    ctx.font = "16px system-ui, Arial";
    // limit text length
    const label = String(options[i]).slice(0, 28);
    ctx.fillText(label, r - 12, 6);
    ctx.restore();
  }
}
drawWheel();

// ----- Spin Logic -----
function spinWheel() {
  if (spinning || options.length === 0) return;
  spinning = true;
  lastTick = -1;
  resultModal.classList.add("hidden");

  const spinTime = 4200; // ms
  const baseTurns = 3; // full rotations
  const extra = Math.random() * 360;
  const target = baseTurns * 360 + extra;

  const start = performance.now();

  function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

  function animate(now){
    const t = Math.min((now - start) / spinTime, 1);
    const eased = easeOutCubic(t);
    const current = target * eased;
    angle = current;

    // draw rotated
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate((angle * Math.PI) / 180);
    ctx.translate(-canvas.width/2, -canvas.height/2);
    drawWheel();
    ctx.restore();

    tickOnSlice(angle);

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;
      showResult();
    }
  }

  requestAnimationFrame(animate);
}

// Play tick sound whenever pointer passes a slice boundary
function tickOnSlice(currentAngleDeg){
  const sliceDeg = 360 / Math.max(1, options.length);
  const sliceIndex = Math.floor((currentAngleDeg % 360) / sliceDeg);
  if (sliceIndex !== lastTick){
    try { tickSound.currentTime = 0; tickSound.play(); } catch(e){}
    lastTick = sliceIndex;
  }
}

// ----- Result -----
function showResult(){
  const sliceDeg = 360 / Math.max(1, options.length);
  const idx = options.length - Math.floor(((angle % 360) / sliceDeg)) - 1;
  const selected = options[(idx + options.length) % options.length];
  resultText.textContent = `🎉 ${selected}`;
  resultModal.classList.remove("hidden");

  try { winSound.currentTime = 0; winSound.play(); } catch(e){}
  fireConfetti();
}

closeResult.addEventListener("click", () => {
  resultModal.classList.add("hidden");
});

// ----- Options list UI -----
function refreshList(){
  optionsList.innerHTML = "";
  options.forEach((opt, i) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = opt;

    const actions = document.createElement("div");
    actions.className = "actions";
    const up = document.createElement("button");
    up.textContent = "⬆️";
    up.title = "Move up";
    up.onclick = () => { if (i>0) { [options[i-1], options[i]] = [options[i], options[i-1]]; save(); refreshList(); drawWheel(); } };

    const down = document.createElement("button");
    down.textContent = "⬇️";
    down.title = "Move down";
    down.onclick = () => { if (i<options.length-1) { [options[i+1], options[i]] = [options[i], options[i+1]]; save(); refreshList(); drawWheel(); } };

    const edit = document.createElement("button");
    edit.textContent = "✏️";
    edit.title = "Edit";
    edit.onclick = () => {
      const v = prompt("Edit option:", options[i]);
      if (v !== null){
        options[i] = v.trim() || options[i];
        save(); refreshList(); drawWheel();
      }
    };

    const del = document.createElement("button");
    del.textContent = "🗑️";
    del.title = "Delete";
    del.onclick = () => { options.splice(i,1); save(); refreshList(); drawWheel(); };

    actions.append(up, down, edit, del);
    li.append(span, actions);
    optionsList.appendChild(li);
  });
}
refreshList();

addBtn.addEventListener("click", () => {
  const v = newOptionInput.value.trim();
  if (!v) return;
  options.push(v);
  newOptionInput.value = "";
  save(); refreshList(); drawWheel();
});

saveBtn.addEventListener("click", save);
function save(){
  localStorage.setItem("wheelOptions", JSON.stringify(options));
}

// reset
resetBtn.addEventListener("click", () => {
  options = ["Truth","Dare","Prize 🎁","Sing a Song 🎤","Dance 💃","Joke 😂"];
  save(); refreshList(); drawWheel();
});

// ----- Confetti -----
let confetti = [];
function fireConfetti(){
  const N = 160;
  const W = confettiCanvas.width;
  const H = confettiCanvas.height;
  confetti = [];
  for (let i=0;i<N;i++){
    confetti.push({
      x: Math.random()*W,
      y: -10 - Math.random()*40,
      vx: (Math.random()-0.5)*2,
      vy: 2 + Math.random()*3,
      size: 4 + Math.random()*4,
      rot: Math.random()*Math.PI*2,
      vr: (Math.random()-0.5)*0.2,
      life: 60 + Math.random()*60,
      color: `hsl(${Math.random()*360},90%,55%)`,
    });
  }
  animateConfetti();
}

function animateConfetti(){
  const W = confettiCanvas.width;
  const H = confettiCanvas.height;
  cctx.clearRect(0,0,W,H);
  let alive = 0;
  for (const p of confetti){
    if (p.life <= 0) continue;
    alive++;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.02;
    p.rot += p.vr;
    p.life--;

    cctx.save();
    cctx.translate(p.x, p.y);
    cctx.rotate(p.rot);
    cctx.fillStyle = p.color;
    cctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
    cctx.restore();
  }
  if (alive > 0){
    requestAnimationFrame(animateConfetti);
  } else {
    cctx.clearRect(0,0,W,H);
  }
}

// ----- Register SW -----
if ("serviceWorker" in navigator){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js");
  });
}

// accessibility: spin on Enter
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") spinWheel();
});
spinBtn.addEventListener("click", spinWheel);
