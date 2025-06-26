/* ==================  SNAKE  ================== */
const playBoard = document.querySelector(".play-board");
const scoreElement = document.querySelector(".score");
const highScoreElt = document.querySelector(".high-score");
const radioFacil = document.getElementById("facil");
const radioDificil = document.getElementById("dificil");
let nextDirX = 0;
let nextDirY = 0;
const dirQueue = [];
const sndComida = new Audio("assets/sounds/pop.mp3");
const sndGameOver = new Audio("assets/sounds/gameover.mp3");

const msgBox = document.getElementById("msg");
let msgTimer=null;
function showMsg(text, ms=2000){
  clearTimeout(msgTimer);
  msgBox.textContent=text;
  msgBox.classList.add("show");
  msgTimer=setTimeout(()=>msgBox.classList.remove("show"), ms);
}

let soundOn = true;
const soundToggleBtn = document.querySelector(".sound-toggle");

function toggleSound() {
  soundOn = !soundOn;
  soundToggleBtn.textContent = soundOn ? "🔊" : "🔇";
  localStorage.setItem("sound", soundOn ? "on" : "off");
}

let gameOver = false,
  pause = false,
  isEasy = true;
let foodX, foodY;
let snakeX = 15,
  snakeY = 15;
let velX = 0,
  velY = 0;
let snakeBody = [];
let loopId = null,
  score = 0;

/* ---------- ranking ---------- */
const RANK_KEY = "snake-ranking";
let ranking = JSON.parse(localStorage.getItem(RANK_KEY) || "[]"); // [{nick,score}]
const playRanking = document.querySelector(".play-ranking");
const nickInput = document.getElementById("txtNickName");
let playerNick = localStorage.getItem("snake-nick") || "";

/* -------- utils -------- */
const randPos = () => Math.floor(Math.random() * 30) + 1;

/* -------- food position -------- */
function newFood() {
  do {
    foodX = randPos();
    foodY = randPos();
  } while (snakeBody.some(([x, y]) => x === foodX && y === foodY));
}

/* -------- ranking helpers -------- */
async function loadRanking() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/ranking?select=nick,score&order=score.desc&limit=10`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  const data = await res.json();
  let html = '<div class="lista">';
  data.forEach((r, i) => {
    html += `<div class="itemLista textDefault">${i + 1}. ${r.nick} — ${
      r.score
    }</div>`;
  });
  html += "</div>";
  playRanking.innerHTML = html;
}

async function loadPlayerBest() {
  if (!playerNick) {
    highScoreElt.innerText = "Best Score: 0";
    return 0;
  }
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/ranking?nick=eq.${encodeURIComponent(
      playerNick
    )}&select=score&order=score.desc&limit=1`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  const rows = await res.json();
  const best = rows.length ? rows[0].score : 0;
  highScoreElt.innerText = `Best Score: ${best}`;
  return best;
}

async function saveToRanking(nick, score) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/ranking`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ nick, score }),
  });
  if (res.ok){
   loadRanking();
   await loadPlayerBest()
  }
    
}
function animacaoGameOver(){
  playBoard.classList.add("flash");
  setTimeout(() => playBoard.classList.remove("flash"), 600);
  if (soundOn) {
    sndGameOver.currentTime = 0;
    sndGameOver.play();
  }
}
/* -------- game over -------- */
function handleGameOver() {  
  clearInterval(loopId);  
  animacaoGameOver();
  if (score > 0) {
    let nick =
      playerNick ||
      prompt("Digite seu nick para salvar no ranking:") ||
      "SALSICHA";
    saveToRanking(nick.trim(), score);
    if (!playerNick) {
      // guarda nick p/ próximas vezes
      playerNick = nick.trim();
      localStorage.setItem("snake-nick", playerNick);
      if (nickInput) nickInput.value = playerNick;
    }
  }

  showMsg("Você perdeu! Pressione OK para recomeçar.");
  resetGame();
}
function wrapPosition(v) {
  if (v < 1) return 30;
  if (v > 30) return 1;
  return v;
}
/* -------- reset -------- */
function resetGame() {
  dirQueue.length = 0;
  nextDirX = 0;
  nextDirY = 0;
  velX = 0;
  velY = 0;
  gameOver = false;
  score = 0;
  snakeBody = [];
  snakeX = 15;
  snakeY = 15;
  velX = velY = 0;
  scoreElement.innerText = "Score: 0";
  newFood();
  clearInterval(loopId);
  loopId = setInterval(updateGame, 100);
}

/* -------- nick button -------- */
async function salvarNick() {
  playerNick = (nickInput.value || "").trim();
  if (playerNick) {
    localStorage.setItem("snake-nick", playerNick);
    await loadPlayerBest();
    showMsg("Nick salvo!");
  }
}

/* -------- change direction -------- */
function changeDir(e) {
  const map = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
  };

  if (e.key === "p") {
    pause = !pause;
    return;
  }

  const cand = map[e.key];
  if (!cand) return; // tecla fora do mapa

  // Qual foi a última direção válida na fila (ou a atual se fila vazia)?
  const last = dirQueue.length
    ? dirQueue[dirQueue.length - 1]
    : { x: nextDirX, y: nextDirY };

  // Ignora se é a mesma ou oposta
  const same = cand.x === last.x && cand.y === last.y;
  const opposite = cand.x === -last.x && cand.y === -last.y;
  if (same || opposite) return;

  dirQueue.push(cand); // coloca na fila
}

function animacaoComida(){
    scoreElement.classList.add("score-bump");
    setTimeout(() => scoreElement.classList.remove("score-bump"), 100);
    if (soundOn) {
      sndComida.currentTime = 0;
      sndComida.play();
    }
}

/* -------- main loop -------- */
function updateGame() {
  if (gameOver || pause) {
    return;
  }

  if (dirQueue.length) {
    const { x, y } = dirQueue.shift(); // pega a próxima
    nextDirX = x;
    nextDirY = y;
  }

  velX = nextDirX;
  velY = nextDirY;

  /* comeu comida */
  if (snakeX === foodX && snakeY === foodY) {
    newFood();    
    animacaoComida()
    snakeBody.push([snakeX, snakeY]);
    score++;    
    scoreElement.innerText = `Score: ${score}`;    
  }

  /* move corpo */
  snakeX += velX;
  snakeY += velY;
  if (isEasy) {
    snakeX = wrapPosition(snakeX);
    snakeY = wrapPosition(snakeY);
  } else {
    if (snakeX < 1 || snakeX > 30 || snakeY < 1 || snakeY > 30) {
      gameOver = true;
      return handleGameOver();
    }
  }

  for (let i = snakeBody.length - 1; i > 0; i--)
    snakeBody[i] = snakeBody[i - 1];
  snakeBody[0] = [snakeX, snakeY];

  /* colisão consigo mesma */
  if (
    !isEasy &&
    snakeBody.slice(1).some(([x, y]) => x === snakeX && y === snakeY)
  ) {
    return handleGameOver();
  }

  /* render */
  let html = `<div class="food" style="grid-area:${foodY}/${foodX}"></div>`;
  snakeBody.forEach(([x, y], i) => {
    const cls = i === 0 ? "headSnake" : "bodySnake";
    html += `<div class="${cls}" style="grid-area:${y}/${x}"></div>`;
  });
  playBoard.innerHTML = html;  
}

/* -------- init -------- */
async function init() {
  isEasy = localStorage.getItem("dificulty") !== "dificil";
  if (radioFacil) radioFacil.checked = isEasy;
  if (radioDificil) radioDificil.checked = !isEasy;
  soundOn = localStorage.getItem("sound") !== "off";
  if (soundToggleBtn) soundToggleBtn.textContent = soundOn ? "🔊" : "🔇";

  if (nickInput && playerNick) nickInput.value = playerNick;
  await loadPlayerBest();
  newFood();
  loadRanking();
  loopId = setInterval(updateGame, 100);
}

radioFacil.addEventListener("change", () => {
  if (radioFacil.checked) {
    isEasy = true;
    localStorage.setItem("dificulty", "facil");
    resetGame();
    playBoard.focus(); // <-- tira o foco do radio
  }
});

radioDificil.addEventListener("change", () => {
  if (radioDificil.checked) {
    isEasy = false;
    localStorage.setItem("dificulty", "dificil");
    resetGame();
    playBoard.focus(); // <-- tira o foco do radio
  }
});
document.addEventListener("keydown", changeDir);
init();
