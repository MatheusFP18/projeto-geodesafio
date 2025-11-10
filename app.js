// Variáveis de Configuração (Substituídas pelas variáveis do template)
const CONFIG = {
    CITY: "Florianópolis",
    IMAGES_FOLDER: "assets/images/",
    ESCOPO_MVP: "galeria local + jogo com pontuação + painel professor simulado",
    EVENT_FREQUENCY: "mensal",
    TEAM_MODE: true,
    MAX_PLAYERS_PER_TEAM: 5,
    POINTS_EASY: 10,
    POINTS_MEDIUM: 20,
    POINTS_HARD: 40
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
const toggleEventBtn = document.getElementById('toggle-event-btn');
const eventStatus = document.getElementById('event-status');
const contributionForm = document.getElementById('contribution-form');
const galleryAread = document.querySelector('#gallery-area');

// Estado do Jogo
let challenges = [];
let currentChallengeIndex = 0;
let currentChallenge = null;
let score = 0;
let startTime = null;
let attempts = 0;
const MAX_ATTEMPTS = 3; // Tentativas antes de mostrar dica

// --- Funções de Inicialização e Carregamento de Dados ---

/**
 * Carrega os dados dos desafios do arquivo JSON local.
 */
async function loadChallenges() {
    try {
        const response = await fetch('./data/images.json');
        challenges = await response.json();
        // Embaralha os desafios para começar
        challenges = shuffleArray(challenges);
        console.log("Desafios carregados:", challenges);
        // Inicializa o jogo
        initializeGame();
    } catch (error) {
        console.error("Erro ao carregar desafios:", error);
        challengeDescription.textContent = "Erro ao carregar os dados do jogo. Verifique o arquivo data/images.json.";
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
    // Atualiza variáveis no HTML
    document.querySelector('header p').textContent = `Descubra os lugares icônicos de ${CONFIG.CITY} e aprenda sobre sua história!`;
    document.querySelector('#gallery-area h2').textContent = `Galeria de Desafios (${CONFIG.ESCOPO_MVP})`;
    document.querySelector('#teacher-panel-area .panel-controls p:last-child').textContent = `Modo Equipes: ${CONFIG.TEAM_MODE ? 'Ativo' : 'Inativo'} (Máx. ${CONFIG.MAX_PLAYERS_PER_TEAM} por equipe)`;
    document.querySelector('#teacher-panel-area .panel-controls p:first-child').textContent = `Próximo Evento ${CONFIG.EVENT_FREQUENCY}: Desafios de Arquitetura Moderna.`;

    loadLeaderboard();
    loadChallenge(currentChallengeIndex);
    galleryAread.style.display = 'none';
}

/**
 * Carrega um desafio específico.
 * @param {number} index O índice do desafio no array `challenges`.
 */
function loadChallenge(index) {
    if (index >= challenges.length) {
        alert("Parabéns! Você completou todos os desafios!");
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
    challengeDescription.textContent = currentChallenge.description;
    
    // Aplica o desfoque inicial (controlado pelo CSS)
    challengeImage.style.filter = 'blur(10px)';
}

// --- Lógica do Jogo ---

/**
 * Calcula a pontuação baseada na dificuldade.
 * @param {string} difficulty A dificuldade do desafio.
 * @returns {number} A pontuação base.
 */
function getBasePoints(difficulty) {
    switch (difficulty) {
        case 'Fácil': return CONFIG.POINTS_EASY;
        case 'Médio': return CONFIG.POINTS_MEDIUM;
        case 'Difícil': return CONFIG.POINTS_HARD;
        default: return 0;
    }
}

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
        "localidade": CONFIG.CITY,
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
        const basePoints = getBasePoints(currentChallenge.difficulty);
        const speedBonus = calculateSpeedBonus(timeElapsed);
        const totalPoints = basePoints + speedBonus;
        
        score += totalPoints;
        
        // Revela a imagem
        challengeImage.style.filter = 'blur(0)';
        challengeImage.parentElement.classList.add('revealed');

        // Atualiza UI
        resultStatus.textContent = `Correto! (+${totalPoints} pontos)`;
        feedbackArea.classList.remove('hidden');
        feedbackArea.classList.remove('incorrect');
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
        feedbackArea.classList.remove('hidden');
        feedbackArea.classList.remove('correct');
        feedbackArea.classList.add('incorrect');
        viacepInfo.textContent = '';
        educationalText.textContent = '';

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

// --- Funcionalidades Simuladas (Mock) ---

/**
 * Mock de Eventos Mensais.
 */
toggleEventBtn.addEventListener('click', () => {
    const isEventActive = eventStatus.textContent.includes('Ativo');
    if (isEventActive) {
        eventStatus.textContent = "Status: Desativado";
        eventStatus.style.color = 'red';
    } else {
        eventStatus.textContent = "Status: Ativo (Desafios de Arquitetura Moderna)";
        eventStatus.style.color = 'green';
        alert(`Evento ${CONFIG.EVENT_FREQUENCY} ativado! Desafios de Arquitetura Moderna estão em destaque.`);
    }
});

/**
 * Mock de Criação de Equipe.
 */
document.getElementById('create-team-btn').addEventListener('click', () => {
    const teamName = prompt("Digite o nome da nova equipe:");
    if (teamName) {
        alert(`Equipe "${teamName}" criada com sucesso! (Mock)`);
        // Em um sistema real, a pontuação seria somada à equipe.
    }
});

/**
 * Mock de Submissão de Contribuição.
 */
contributionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const feedback = document.getElementById('contribution-feedback');
    feedback.classList.remove('hidden');
    // Simulação de salvamento em memória (apenas para demonstração)
    const formData = new FormData(contributionForm);
    const newChallenge = {
        id: "mock-" + Date.now(),
        title: formData.get('title'),
        description: formData.get('description'),
        difficulty: formData.get('difficulty'),
        image_path: "mock_upload.jpg", // Simulação
        submitter: "Usuário Local",
        timestamp: new Date().toISOString(),
        points: getBasePoints(formData.get('difficulty'))
    };
    console.log("Novo Desafio Submetido (Mock):", newChallenge);
    // Não atualiza o JSON real, apenas simula o processo.
    contributionForm.reset();
    setTimeout(() => feedback.classList.add('hidden'), 5000);
});

// --- Inicialização ---
loadChallenges();
