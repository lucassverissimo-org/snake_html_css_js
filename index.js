const playBoard = document.querySelector(".play-board");
const scoreElement = document.querySelector(".score");
const highScoreElement = document.querySelector(".high-score");
const difficultySelect = document.getElementById("selectDificulty");
const difficulty = document.querySelector(".difficulty");
const controls = document.querySelectorAll(".controls i");

let gameOver = false;
let foodX, foodY;
let snakeX = 5, snakeY= 5;
let velocityX = 0, velocityY = 0;
let snakeBody = [];
let setIntervalId;
let score = 0;
let pause = false;
let isFacil = true;

function changeDificult(){
    console.log("entrou no changeDificult");
    isFacil = difficultySelect.options[difficultySelect.selectedIndex].id == "facil";    
}

// Obter a maior pontuação do local storage

let highScore = localStorage.getItem("high-score") || 0;
highScoreElement.innerText = `Melhor pontuação: ${highScore}`;

// Atualizar a posição da comida randomicamente
const updateFoodPosition = () => {
    let newfoodX = Math.floor(Math.random() * 30) + 1;
    let newfoodY = Math.floor(Math.random() * 30) + 1;
    for (let i = snakeBody.length - 1; i > 0; i--){
        // evitar que a comida seja criada em cima da cobra.
        if (i !== 0 && newfoodX === snakeBody[i][1] && newfoodY === snakeBody[i][0]){
            updateFoodPosition();
        }else {
            break;
        }
    }
    foodX = newfoodX;
    foodY = newfoodY;
}

const handleGameOver = () => {    
    clearInterval(setIntervalId);
    alert("Você perdeu! Pressione OK para reiniciar...");
    location.reload();    
}

// Alterar direção da cobra 
const changeDirection = e =>{
    //console.log("facil",isFacil); 
    if (e.key === "ArrowUp" && velocityY != 1){
        velocityX = 0;
        velocityY = -1;
    }else if (e.key === "ArrowDown" && velocityY != -1){
        velocityX = 0;
        velocityY = 1;
    }else if (e.key === "ArrowLeft" && velocityX != 1){
        velocityX = -1;
        velocityY = 0;
    }else if (e.key === "ArrowRight" && velocityX != -1){
        velocityX = 1;
        velocityY = 0;
    }else if(e.key === "p" && isFacil){                
        velocityX = 0;
        velocityY = 0;
        pause = !pause;        
    }
}

// mudar direção quando clicar 

controls.forEach(button => button.addEventListener("click", () => changeDirection({ key: button.dataset.key })));

const initGame = () =>{
    if (gameOver) return handleGameOver();    
    //difficulty.addEventListener("change", changeDificult());
    let html = `<div class="food" style="grid-area: ${foodY} / ${foodX}"></div>`    
    
    // quando a cobra comer a comida
    if (snakeX === foodX && snakeY === foodY){
        updateFoodPosition();
        snakeBody.push([foodY, foodX]);
        score++;
        highScore = score >= highScore ? score : highScore;

        localStorage.setItem("high-score", highScore);
        scoreElement.innerText = `Pontuação: ${score}`;
        highScoreElement.innerText = `Melhor Pontuação: ${highScore}`;
    }

    // atualizar tamanho da cobra
    snakeX += velocityX;
    snakeY += velocityY;

    for (let i = snakeBody.length - 1; i > 0; i--){
        snakeBody[i] = snakeBody[i-1];       
    }

    snakeBody[0] = [snakeX,snakeY];
    // verificando se a cobra bateu nas bordas
    if (snakeX <= 0 || snakeX > 30 || snakeY <= 0 || snakeY > 30 ){
        return gameOver = true;
    }

    for (let i = 0; i< snakeBody.length; i++){
        html += `<div class="head" style="grid-area: ${snakeBody[i][1]} / ${snakeBody[i][0]}"></div>`;
        // verifica se a cobra bateu nela mesma
        if (i !== 0 && snakeBody[0][1] === snakeBody[i][1] && 
            snakeBody[0][0] === snakeBody[i][0] && !pause && !isFacil){
                gameOver = true;

        }
    }
    playBoard.innerHTML = html;

}

updateFoodPosition()
setIntervalId = setInterval(initGame, 100);
document.addEventListener("keyup", changeDirection);
