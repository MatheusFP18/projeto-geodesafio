
const CONFIG = {
    IMAGES_FOLDER: "assets/images/",
    CITY_CONFIG: {}
};

// Elementos do DOM
const challengeImage = document.getElementById('challenge-image');
const challengeDescription = document.getElementById('challenge-description');
const guessForm = document.getElementById('guess-form');
const guessInput = document.getElementById('guess-input');
const feedbackArea = document.getElementById('feedback-area');
const resultStatus = document.getElementById('result-status');
const educationalText = document.getElementById('educational-text');
const viacepInfo = document.getElementById('viacep-info');
const nextChallengeBtn = document.getElementById('next-challenge-btn');
const leaderboardBody = document.querySelector('#leaderboard-table tbody');
const citySelectionArea = document.getElementById('city-selection-area');
const citySelect = document.getElementById('city-select'); 
const startGameBtn = document.getElementById('start-game-btn');
const gameArea = document.getElementById('game-area');
const leaderboardArea = document.getElementById('leaderboard-area');
const showHintBtn = document.getElementById('show-hint-btn');
const hintText = document.getElementById('hint-text');

// Estado do Jogo
let challenges = [];
let currentChallengeIndex = 0;
let currentChallenge = null;
let score = 0;
let startTime = null;
let attempts = 0;
const MAX_ATTEMPTS = 2; 

// --- Funções de Inicialização e Carregamento de Dados ---
// --- Inicialização ---

citySelect.addEventListener('change', () => {
    const selectedCityValue = citySelect.value;
    if (!selectedCityValue) return;

    const selectedCityName = citySelect.options[citySelect.selectedIndex].text;
    CONFIG.CITY_CONFIG.city = selectedCityValue;
    CONFIG.CITY_CONFIG.cityName = selectedCityName;

    startGameBtn.classList.remove('hidden');
    startGameBtn.disabled = true;

    loadChallenges();
});


startGameBtn.addEventListener('click', () => {
    // Esconde a seleção de cidade e mostra o jogo
    citySelectionArea.classList.add('hidden');
    gameArea.classList.remove('hidden');
    leaderboardArea.classList.remove('hidden');
    initializeGame();
});

/**
 * Carrega os dados dos desafios do arquivo JSON local.
 */
async function loadChallenges() {
    try {
        // Mostra um feedback de que os dados estão sendo carregados
        // Usaremos um placeholder ou um elemento de status dedicado no futuro.
        console.log(`Carregando desafios para ${CONFIG.CITY_CONFIG.cityName}...`);

        const response = await fetch(`./data/${CONFIG.CITY_CONFIG.city}.json`);
        challenges = await response.json();
        challenges = shuffleArray(challenges);

        // Habilita o botão para iniciar o jogo
        startGameBtn.disabled = false;
    } catch (error) {
        console.error("Erro ao carregar desafios:", error);
        challengeDescription.textContent = `Erro ao carregar os dados do jogo para ${CONFIG.CITY_CONFIG.cityName}. Verifique o console e o arquivo de dados.`;
    }
}

/**
 * Embaralha um array (Algoritmo de Fisher-Yates).
 * @param {Array} array O array a ser embaralhado.
 * @returns {Array} O array embaralhado.
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Inicia o jogo, carrega o primeiro desafio e a pontuação.
 */
function initializeGame() {
    document.querySelector('header p').textContent = `Descubra os lugares icônicos de ${CONFIG.CITY_CONFIG.cityName} e aprenda sobre sua história!`;
    loadLeaderboard();
    loadChallenge(currentChallengeIndex);
}

/**
 * Carrega um desafio específico.
 * @param {number} index O índice do desafio no array `challenges`.
 */
function loadChallenge(index) {
    if (index >= challenges.length) {
        alert(`Parabéns! Você completou todos os desafios de ${CONFIG.CITY_CONFIG.cityName}!`);
        // Reseta a UI para a seleção de cidade
        citySelectionArea.classList.remove('hidden');
        gameArea.classList.add('hidden');
        leaderboardArea.classList.add('hidden');
        startGameBtn.classList.add('hidden');
        citySelect.value = ""; // Limpa a seleção
        currentChallengeIndex = 0; // Reseta o índice para um novo jogo
        score = 0; // Opcional: resetar a pontuação
        return;
    }

    currentChallenge = challenges[index];
    attempts = 0;
    startTime = Date.now();

    // Reset UI
    guessForm.classList.remove('hidden');
    guessInput.value = '';
    feedbackArea.classList.add('hidden');
    document.getElementById('hint-area').classList.add('hidden');
    challengeImage.parentElement.classList.remove('revealed');
    
    // Configura o novo desafio
    challengeImage.src = CONFIG.IMAGES_FOLDER + currentChallenge.image_path;
    challengeImage.alt = currentChallenge.title;
    challengeDescription.textContent = `Dica: ${currentChallenge.description}`;
    challengeDescription.style.display = 'none';
    
    // Aplica o desfoque inicial (controlado pelo CSS)
    challengeImage.style.filter = 'blur(10px)';
}

// --- Lógica do Jogo ---

/**
 * Calcula o bônus de velocidade.
 * @param {number} timeInSeconds O tempo gasto no desafio.
 * @returns {number} O bônus de pontuação.
 */
function calculateSpeedBonus(timeInSeconds) {
    // Fórmula simples: bonus = Math.max(0, 20 - segundos)
    const maxTime = 20; // Tempo máximo em segundos para bônus
    const bonus = Math.max(0, maxTime - timeInSeconds);
    return Math.floor(bonus);
}

/**
 * Simula a busca de informações de endereço via viaCEP.
 * @param {string} cep O CEP a ser buscado.
 */
async function mockViaCEP(cep) {
    if (!cep) {
        viacepInfo.textContent = "Informação de endereço não disponível para este desafio.";
        return;
    }

    // Exemplo de chamada real: https://viacep.com.br/ws/01001000/json/
    const mockData = {
        "cep": cep,
        "logradouro": "Rua Exemplo",
        "bairro": "Bairro Histórico",
        "localidade": CONFIG.CITY_CONFIG.cityName,
        "uf": "SP"
    };

    // Simula a resposta
    viacepInfo.textContent = `Endereço (viaCEP mock): ${mockData.logradouro}, ${mockData.bairro}, ${mockData.localidade}/${mockData.uf}.`;
}

/**
 * Manipula o palpite do usuário.
 * @param {Event} event O evento de submissão do formulário.
 */
guessForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const guess = guessInput.value.trim().toLowerCase();
    const correctTitle = currentChallenge.title.trim().toLowerCase();
    const timeElapsed = Math.floor((Date.now() - startTime) / 1000);

    if (guess === correctTitle) {
        // Acerto
        const basePoints = currentChallenge.points || 10; // Usa os pontos do JSON ou um padrão
        const speedBonus = calculateSpeedBonus(timeElapsed);
        const totalPoints = basePoints + speedBonus;
        
        score += totalPoints;
        
        // Revela a imagem
        challengeImage.style.filter = 'blur(0)';
        challengeImage.parentElement.classList.add('revealed');

        // Atualiza UI
        resultStatus.textContent = `Correto! (+${totalPoints} pontos)`;
        feedbackArea.classList.remove('hidden', 'incorrect');
        feedbackArea.classList.add('correct');
        guessForm.classList.add('hidden');
        
        // Conteúdo Educativo
        educationalText.innerHTML = `<strong>${currentChallenge.title}</strong>: ${currentChallenge.educational_content}`;

        // Integração viaCEP (Mock)
        await mockViaCEP(currentChallenge.cep);

        // Atualiza a pontuação local
        updateLeaderboard(currentChallenge.title, totalPoints);

    } else {
        // Erro
        attempts++;
        resultStatus.textContent = `Incorreto. Tente novamente. Tentativas: ${attempts}/${MAX_ATTEMPTS}`;
        feedbackArea.classList.remove('hidden', 'correct');
        feedbackArea.classList.add('incorrect');
        viacepInfo.textContent = '';
        educationalText.textContent = '';

        // Decrementa o blur a cada tentativa
        const initialBlur = 30;
        const blurDecrement = 10;
        const newBlur = Math.max(0, initialBlur - (attempts * blurDecrement));
        challengeImage.style.filter = `blur(${newBlur}px)`;

        // Implementa opções após 2 tentativas e esconde o formulário descritivo

        if (attempts == 2) {
            alert("Dica: Verifique detalhes na descrição do desafio para ajudar na identificação.");
            document.getElementById('aria-multiselectable').classList.remove('hidden');
            document.getElementById('hint-area').classList.remove('hidden');
            document.getElementById('guess-form').style.display = 'none';
        }

        if (attempts >= MAX_ATTEMPTS) {
            document.getElementById('hint-area').classList.remove('hidden');
            // Penalidade por erro
            score = Math.max(0, score - 5); 
            updateLeaderboard("Penalidade", -5);
        }
    }
    guessInput.value = '';
});

/**
 * Botão para mostrar dica.
 */
showHintBtn.addEventListener('click', () => {
    if (score >= 5) {
        score -= 5;
        challengeDescription.style.display = 'block';
        updateLeaderboard("Dica", -5);
    } else {
        alert("Você não tem pontos suficientes para pedir uma dica.");
    }
});

/**
 * Botão para o próximo desafio.
 */
nextChallengeBtn.addEventListener('click', () => {
    currentChallengeIndex++;
    loadChallenge(currentChallengeIndex);
});

// --- Gamificação (Leaderboard e Equipes) ---

/**
 * Carrega a tabela de classificação do localStorage.
 */
function loadLeaderboard() {
    const storedLeaderboard = localStorage.getItem('geodesafio_leaderboard');
    let leaderboard = storedLeaderboard ? JSON.parse(storedLeaderboard) : [];
    
    // Garante que a pontuação do jogador atual está na lista (simulação de jogador único)
    let playerEntry = leaderboard.find(entry => entry.name === "Jogador Atual");
    if (!playerEntry) {
        playerEntry = { name: "Jogador Atual", score: 0 };
        leaderboard.push(playerEntry);
    }
    playerEntry.score = score; // Atualiza com a pontuação atual

    // Ordena e exibe
    leaderboard.sort((a, b) => b.score - a.score);
    renderLeaderboard(leaderboard);
}

/**
 * Renderiza a tabela de classificação no DOM.
 * @param {Array} leaderboard O array de entradas da classificação.
 */
function renderLeaderboard(leaderboard) {
    leaderboardBody.innerHTML = '';
    leaderboard.forEach((entry, index) => {
        const row = leaderboardBody.insertRow();
        row.insertCell().textContent = index + 1;
        row.insertCell().textContent = entry.name;
        row.insertCell().textContent = entry.score;
    });
}

/**
 * Atualiza a pontuação e salva no localStorage.
 * @param {string} reason Razão da atualização (para debug/log).
 * @param {number} points Pontos a adicionar/subtrair.
 */
function updateLeaderboard(reason, points) {
    const storedLeaderboard = localStorage.getItem('geodesafio_leaderboard');
    let leaderboard = storedLeaderboard ? JSON.parse(storedLeaderboard) : [];
    
    let playerEntry = leaderboard.find(entry => entry.name === "Jogador Atual");
    if (!playerEntry) {
        playerEntry = { name: "Jogador Atual", score: 0 };
        leaderboard.push(playerEntry);
    }
    
    playerEntry.score += points;
    localStorage.setItem('geodesafio_leaderboard', JSON.stringify(leaderboard));
    
    loadLeaderboard(); // Recarrega e renderiza
}

