const playBoard = document.querySelector(".play-board");
const scoreElement = document.querySelector(".score");
const highScoreElt = document.querySelector(".high-score");
const radioFacil = document.getElementById("facil");
const radioDificil = document.getElementById("dificil");
const sndComida = new Audio("assets/sounds/pop.mp3");
const sndGameOver = new Audio("assets/sounds/gameover.mp3");
const dirQueue = [];

const msgBox = document.getElementById("msg");
let msgTimer = null;
function showMsg(text, ms = 2000) {
  clearTimeout(msgTimer);
  msgBox.textContent = text;
  msgBox.classList.add("show");
  msgTimer = setTimeout(() => msgBox.classList.remove("show"), ms);
}

function atualizarVisibilidadeRanking() {
  const aviso = document.getElementById("rankingAviso");
  if (aviso) aviso.style.display = isEasy ? "block" : "none";
}

async function switchRanking(tab) {
  document
    .querySelectorAll(".ranking-tab")
    .forEach((btn) => btn.classList.remove("active"));
  const activeBtn = document.querySelector(`.ranking-tab[onclick*="${tab}"]`);
  if (activeBtn) activeBtn.classList.add("active");

  if (tab === "geral") {
    await loadRanking();
  } else {
    await loadUserScores();
  }

  currentRankingTab = tab;
}

let soundOn = true;
const soundToggleBtn = document.querySelector(".sound-toggle");

function toggleSound() {
  soundOn = !soundOn;
  soundToggleBtn.textContent = soundOn ? "🔊" : "🔇";
  localStorage.setItem("sound", soundOn ? "on" : "off");
}
const VELOCIDADE_NORMAL = 100;
let gameOver = false;
let pause = false;
let isEasy = true;
let foodX, foodY;
let snakeX = 15;
let snakeY = 15;
let velX = 0;
let velY = 0;
let snakeBody = [];
let loopId = null;
let gameSpeed = VELOCIDADE_NORMAL;
let score = 0;
let startTime = null;
let endTime = null;
let gameTime = 0;
let pauseCount = 0;
let pauseLimit = 3;
let nextDirX = 0;
let nextDirY = 0;
let blinkSegmentIndex = -1;
let currentRankingTab = "geral";
let spacePressed = false;

const RANK_KEY = "snake-ranking";
let ranking = JSON.parse(localStorage.getItem(RANK_KEY) || "[]");
const playRanking = document.querySelector(".play-ranking");
const nickInput = document.getElementById("txtNickName");
let playerNick = localStorage.getItem("snake-nick") || "";

const randPos = () => Math.floor(Math.random() * 30) + 1;

function newFood() {
  do {
    foodX = randPos();
    foodY = randPos();
  } while (snakeBody.some(([x, y]) => x === foodX && y === foodY));
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  let result = "";

  if (h > 0) result += `${h}h:`;
  if (m > 0 || h > 0) result += `${String(m).padStart(2, "0")}m:`;
  result += `${String(s).padStart(2, "0")}s`;

  return result;
}

async function loadUserScores() {
  if (!playerNick) {
    playRanking.innerHTML =
      "<div class='textDefault' style='padding:10px'>Nenhum nick definido.</div>";
    return;
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/ranking?nick=eq.${encodeURIComponent(
      playerNick
    )}&select=nick,score,tempo&order=score.desc&limit=10`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  const data = await res.json();
  let html = `
    <div class="lista headerLista textDefault">
      <div class="col pos">#</div>
      <div class="col nick">Nick</div>
      <div class="col score">Pontos</div>
      <div class="col tempo">Tempo</div>
    </div>
  `;
  data.forEach((r, i) => {
    const tempoFormatado = formatTime(parseInt(r.tempo || 0));
    html += `
      <div class="lista itemLista textDefault">
        <div class="col pos">${i + 1}</div>
        <div class="col nick">${r.nick}</div>
        <div class="col score">${r.score}</div>
        <div class="col tempo">${tempoFormatado}</div>
      </div>
    `;
  });
  playRanking.innerHTML = html;
}
async function loadRanking() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/ranking?select=nick,score,tempo&order=score.desc&limit=10`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  const data = await res.json();
  let html = `
  <div class="lista headerLista textDefault">
    <div class="col pos">#</div>
    <div class="col nick">Nick</div>
    <div class="col score">Pts</div>
    <div class="col tempo">Tempo</div>
  </div>
`;

  data.forEach((r, i) => {
    const tempoFormatado = formatTime(parseInt(r.tempo || 0));
    html += `
    <div class="lista itemLista textDefault">
      <div class="col pos">${i + 1}</div>
      <div class="col nick">${r.nick}</div>
      <div class="col score">${r.score}</div>
      <div class="col tempo">${tempoFormatado}</div>
    </div>
  `;
  });
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
  loadUserScores();
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
    body: JSON.stringify({ nick, score, tempo: gameTime }),
  });
  if (res.ok) {
    if (currentRankingTab === "geral") {
      await loadRanking();
    } else {
      await loadUserScores();
    }
    await loadPlayerBest();
  }
}
function animacaoGameOver() {
  playBoard.classList.add("flash");
  setTimeout(() => playBoard.classList.remove("flash"), 600);
  if (soundOn) {
    sndGameOver.currentTime = 0;
    sndGameOver.play();
  }
}

function handleGameOver() {
  clearInterval(loopId);
  if (!startTime) {
    startTime = new Date();
  }
  endTime = new Date();
  gameTime = Math.max(0, Math.floor((endTime - startTime) / 1000));
  animacaoGameOver();
  if (score > 0) {
    let nick =
      playerNick ||
      prompt("Digite seu nick para salvar no ranking:") ||
      "SALSICHA";
    saveToRanking(nick.trim(), score);
    if (!playerNick) {
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

function startGameLoop() {
  if (loopId) clearInterval(loopId);
  loopId = setInterval(updateGame, gameSpeed);
}

function resetGame() {  
  endTime = null;
  gameTime = 0;
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
  pauseCount = 0;
  document.getElementById("pauseBtn").textContent = "⏸️";
  startGameLoop();
}

async function salvarNick() {
  playerNick = (nickInput.value || "").trim();
  if (playerNick) {
    localStorage.setItem("snake-nick", playerNick);
    await loadPlayerBest();

    showMsg("Nick salvo!");
  }
}

function togglePause() {
  if (!pause) {
    if (!isEasy && pauseCount >= pauseLimit) {
      showMsg("Limite de pausas atingido no modo Hard!");
      return;
    }
    if (!isEasy) pauseCount++;
  }

  pause = !pause;
  document.getElementById("pauseBtn").textContent = pause ? "▶️" : "⏸️";
}

function changeDir(e) {
  const map = {
    ArrowUp: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    d: { x: 1, y: 0 },
  };

  if (e.key === "p") {
    togglePause();
    return;
  }

  const cand = map[e.key];
  if (!cand) return;

  const last = dirQueue.length
    ? dirQueue[dirQueue.length - 1]
    : { x: nextDirX, y: nextDirY };

  const same = cand.x === last.x && cand.y === last.y;
  const opposite = cand.x === -last.x && cand.y === -last.y;
  if (same || opposite) return;

  dirQueue.push(cand);
}

function animacaoComida() {
  scoreElement.classList.add("score-bump");
  setTimeout(() => scoreElement.classList.remove("score-bump"), 100);

  const blinkIndex = snakeBody.length - 1;
  blinkSegmentIndex = blinkIndex;

  setTimeout(() => {
    blinkSegmentIndex = -1;
  }, 900);

  if (soundOn) {
    sndComida.currentTime = 0;
    sndComida.play();
  }
}
function getHeadDirection() {
  if (velX === 1) return "right";
  if (velX === -1) return "left";
  if (velY === 1) return "down";
  if (velY === -1) return "up";
  return "";
}
function updateGame() {
  if (gameOver || pause) {
    return;
  }
  
  if (!startTime) {
    startTime = new Date();
  }
  
  if (dirQueue.length) {
    const { x, y } = dirQueue.shift();
    nextDirX = x;
    nextDirY = y;
  }

  velX = nextDirX;
  velY = nextDirY;

  /* comeu comida */
  if (snakeX === foodX && snakeY === foodY) {
    newFood();
    snakeBody.push([snakeX, snakeY]);
    score++;
    scoreElement.innerText = `Score: ${score}`;
    animacaoComida();
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

  let html = `<div class="food" style="grid-area:${foodY}/${foodX}"></div>`;
  snakeBody.forEach(([x, y], i) => {
    let cls = i === 0 ? `headSnake head-${getHeadDirection()}` : "bodySnake";
    if (i === blinkSegmentIndex) cls += " blink-food";
    html += `<div class="${cls}" style="grid-area:${y}/${x}"></div>`;
  });
  playBoard.innerHTML = html;
}

async function init() {
  isEasy = localStorage.getItem("dificulty") !== "dificil";
  if (radioFacil) radioFacil.checked = isEasy;
  if (radioDificil) radioDificil.checked = !isEasy;
  soundOn = localStorage.getItem("sound") !== "off";
  if (soundToggleBtn) soundToggleBtn.textContent = soundOn ? "🔊" : "🔇";
  document.getElementById("pauseBtn").addEventListener("click", togglePause);
  if (nickInput && playerNick) nickInput.value = playerNick;
  await loadPlayerBest();
  newFood();
  switchRanking(currentRankingTab);
  startGameLoop();
  if (nickInput) {
    nickInput.addEventListener("blur", async () => {
      await salvarNick();
    });
    nickInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      nickInput.blur();
    }
  });
  }
  atualizarVisibilidadeRanking();

}

radioFacil.addEventListener("change", () => {
  if (radioFacil.checked) {
    isEasy = true;
    localStorage.setItem("dificulty", "facil");
    resetGame();
    atualizarVisibilidadeRanking();
    playBoard.focus();
  }
});

radioDificil.addEventListener("change", () => {
  if (radioDificil.checked) {
    isEasy = false;
    localStorage.setItem("dificulty", "dificil");
    resetGame();
    atualizarVisibilidadeRanking();
    playBoard.focus();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && !spacePressed) {
    spacePressed = true;
    gameSpeed = 40; 
    startGameLoop();
  }
});
document.addEventListener("keyup", (e) => {
  if (e.code === "Space" && spacePressed) {
    spacePressed = false;
    gameSpeed = VELOCIDADE_NORMAL; 
    startGameLoop();
  }
});
document.addEventListener("keydown", changeDir);
init();
