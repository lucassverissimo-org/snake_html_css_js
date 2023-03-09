const playRanking = document.querySelector(".play-ranking");

let html = `<div class="lista">`;

for (let i = 0; i < 445; i++) {
    html += `<div class="itemLista textDefault"> jogador ${i}</div>`;    
}

html += `</div>`;

playRanking.innerHTML = html;

function btnOKClick(){
    alert('clicou no botão.');
}