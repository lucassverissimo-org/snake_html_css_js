function mockCobra() {
  let cobraFake = [];
  for (let i = 0; i < 900; i++) {
    cobraFake.push([5, 5]);
  }
  return cobraFake;
}

const playBoard = document.querySelector(".play-board");
const idPlay = document.getElementById("play");
const scoreElement = document.querySelector(".score");
const highScoreElement = document.querySelector(".high-score");
const difficultySelect = document.getElementById("selectDificulty");
const difficulty = document.querySelector(".difficulty");
const controls = document.querySelectorAll(".controls i");

let gameOver = false;
let foodX, foodY;
let snakeX = 15,
  snakeY = 15;
let velocityX = 0,
  velocityY = 0;
let snakeBody = []; //mockCobra();
let setIntervalId;
let score = 0;
let pause = false;
let isEasy = true;

// Obter a maior pontuação do local storage

let highScore = localStorage.getItem("high-score") || 0;
highScoreElement.innerText = `Best Score: ${highScore}`;

// Atualizar a posição da comida randomicamente
const updateFoodPosition = () => {
  let newfoodX = Math.floor(Math.random() * 30) + 1;
  let newfoodY = Math.floor(Math.random() * 30) + 1;
  // verificação se a nova comida vai ficar em cima da cobra
  for (let i = 0; i < snakeBody.length; i++) {
    if (snakeBody[i][0] == newfoodX && snakeBody[i][1] == newfoodY) {
      updateFoodPosition();
      return;
    }
  }
  foodX = newfoodX;
  foodY = newfoodY;
};

const handleGameOver = () => {
  clearInterval(setIntervalId);
  alert("Você perdeu! Pressione OK para reiniciar...");
  gameOver = false;
  (snakeX = 5), (snakeY = 5);
  (velocityX = 0), (velocityY = 0);
  snakeBody = []; //mockCobra();
  score = 0;
  updateFoodPosition();
  setIntervalId = setInterval(initGame, 100);
};

// Alterar direção da cobra
const changeDirection = (e) => {
  pause = false;
  if (e.key === "ArrowUp" && velocityY != 1) {
    velocityX = 0;
    velocityY = -1;
  } else if (e.key === "ArrowDown" && velocityY != -1) {
    velocityX = 0;
    velocityY = 1;
  } else if (e.key === "ArrowLeft" && velocityX != 1) {
    velocityX = -1;
    velocityY = 0;
  } else if (e.key === "ArrowRight" && velocityX != -1) {
    velocityX = 1;
    velocityY = 0;
  } else if (e.key === "p" && isEasy) {
    velocityX = 0;
    velocityY = 0;
    pause = true;
  }
};

// mudar direção quando clicar
controls.forEach((button) =>
  button.addEventListener("click", () =>
    changeDirection({ key: button.dataset.key })
  )
);

const initGame = () => {
  if (gameOver) return handleGameOver();
  let html = `<div class="food" style="grid-area: ${foodY} / ${foodX}"></div>`;
  let localStorageDificulty = localStorage.getItem("dificulty");
  if (
    localStorageDificulty == "dificil" &&
    difficultySelect.selectedIndex == 0
  ) {
    difficultySelect.selectedIndex = 1;
  }
  if (localStorageDificulty == "facil" && difficultySelect.selectedIndex == 1) {
    difficultySelect.selectedIndex = 0;
  }
  isEasy =
    difficultySelect.options[difficultySelect.selectedIndex].id == "facil";

  // quando a cobra comer a comida
  if (snakeX === foodX && snakeY === foodY) {
    updateFoodPosition();
    snakeBody.push([foodY, foodX]);
    score++;
    highScore = score >= highScore ? score : highScore;

    localStorage.setItem("high-score", highScore);
    scoreElement.innerText = `Score: ${score}`;
    highScoreElement.innerText = `Best Score: ${highScore}`;
  }

  // atualizar tamanho da cobra
  snakeX += velocityX;
  snakeY += velocityY;

  console.log("velocityX", velocityX);
  console.log("velocityY", velocityY);
  

  if (isEasy) {
    // libera as paredes
    playBoard.style.border = "none";
    
    if (snakeX < 1) {
      snakeX = 30;
    }
    if (snakeX > 30) {
      snakeX = 0;
    }
    if (snakeY < 1) {
      snakeY = 30;
    }
    if (snakeY > 30) {
      snakeY = 0;
    }
  } else {
    // bloqueia as paredes
    // verificando se a cobra bateu nas bordas
    playBoard.style.border = "solid 2px #ffffff";
    if (snakeX <= 0 || snakeX > 30 || snakeY <= 0 || snakeY > 30) {
      console.log("snakeX", snakeX);
      console.log("snakeY", snakeY);
      return (gameOver = true);
    }
  }
  
  for (let i = snakeBody.length - 1; i > 0; i--) {
    snakeBody[i] = snakeBody[i - 1];
  }
  snakeBody[0] = [snakeX, snakeY];

  if (!pause) {
    for (let i = 0; i < snakeBody.length; i++) {
      if (i != 0)
        html += `<div class="bodySnake" style="grid-area: ${snakeBody[i][1]} / ${snakeBody[i][0]}"></div>`;
      /*else
        html += `<div class="headSnake" style="grid-area: ${snakeBody[i][1]} / ${snakeBody[i][0]}"></div>`;
*/
      // verifica se a cobra bateu nela mesma
      if (!isEasy) {
        if (
          i !== 0 &&
          snakeBody[0][1] === snakeBody[i][1] &&
          snakeBody[0][0] === snakeBody[i][0]
        ) {
          gameOver = true;
        }
      }
    }
    html += `<div class="headSnake" style="grid-area: ${snakeBody[0][1]} / ${snakeBody[0][0]}"></div>`;
    playBoard.innerHTML = html;
  }
};

updateFoodPosition();
setIntervalId = setInterval(initGame, 100);
document.addEventListener("keyup", changeDirection);

const changeDificult = () => {
  localStorage.setItem(
    "dificulty",
    difficultySelect.options[difficultySelect.selectedIndex].id
  );
  difficultySelect.blur();
};
