// =================================================================================
// ARQUIVO: app_didatico.js
// OBJETIVO: Ensinar a sequência lógica e o funcionamento do JavaScript para iniciantes.
// =================================================================================

// ---------------------------------------------------------------------------------
// 1. VARIÁVEIS DE CONFIGURAÇÃO (Onde guardamos as regras do jogo)
// ---------------------------------------------------------------------------------
// O objeto 'CONFIG' armazena todas as regras e valores que podem mudar no jogo.
// Usamos 'const' porque essas regras não devem ser alteradas durante a execução do código.
const CONFIG = {
    CITY: "São Paulo", // A cidade foco do jogo.
    IMAGES_FOLDER: "assets/images/", // Onde as imagens dos desafios estão guardadas.
    ESCOPO_MVP: "galeria local + jogo com pontuação + painel professor simulado", // Descrição das funcionalidades.
    EVENT_FREQUENCY: "mensal", // Frequência de eventos simulados.
    TEAM_MODE: true, // Se o modo equipe está ativo (true) ou não (false).
    MAX_PLAYERS_PER_TEAM: 5, // Limite de jogadores por equipe.
    POINTS_EASY: 10, // Pontuação base para desafios fáceis.
    POINTS_MEDIUM: 20, // Pontuação base para desafios médios.
    POINTS_HARD: 40 // Pontuação base para desafios difíceis.
};

// ---------------------------------------------------------------------------------
// 2. ELEMENTOS DO DOM (Conectando o JavaScript com o HTML)
// ---------------------------------------------------------------------------------
// O DOM (Document Object Model) é a representação do seu HTML no JavaScript.
// Usamos 'document.getElementById' para encontrar elementos no HTML e guardá-los
// em variáveis. Assim, podemos mudar o que o usuário vê na tela.
const challengeImage = document.getElementById('challenge-image');
const challengeDescription = document.getElementById('challenge-description');
const guessForm = document.getElementById('guess-form'); // O formulário de palpite.
const guessInput = document.getElementById('guess-input'); // O campo de texto onde o usuário digita.
const feedbackArea = document.getElementById('feedback-area'); // Área de mensagem (acerto/erro).
const resultStatus = document.getElementById('result-status');
const educationalText = document.getElementById('educational-text');
const viacepInfo = document.getElementById('viacep-info');
const nextChallengeBtn = document.getElementById('next-challenge-btn'); // Botão para ir ao próximo desafio.
const leaderboardBody = document.querySelector('#leaderboard-table tbody'); // O corpo da tabela de classificação.
const toggleEventBtn = document.getElementById('toggle-event-btn');
const eventStatus = document.getElementById('event-status');
const contributionForm = document.getElementById('contribution-form');

// ---------------------------------------------------------------------------------
// 3. ESTADO DO JOGO (Onde guardamos o que está acontecendo agora)
// ---------------------------------------------------------------------------------
// Variáveis que mudam constantemente durante o jogo. Usamos 'let' para elas.
let challenges = []; // Array que vai guardar todos os desafios carregados do JSON.
let currentChallengeIndex = 0; // Qual desafio estamos jogando (começa no primeiro, índice 0).
let currentChallenge = null; // O objeto do desafio atual.
let score = 0; // A pontuação do jogador.
let startTime = null; // O momento em que o desafio começou (para calcular o bônus de velocidade).
let attempts = 0; // Quantas vezes o jogador tentou acertar o desafio atual.
const MAX_ATTEMPTS = 3; // Limite de tentativas antes de dar uma dica.

// =================================================================================
// 4. FUNÇÕES DE INICIALIZAÇÃO E CARREGAMENTO DE DADOS (O que acontece no início)
// =================================================================================

/**
 * Função Principal: Carrega os dados dos desafios do arquivo JSON local.
 * É a primeira função a ser chamada para iniciar o jogo.
 */
async function loadChallenges() {
    // O 'async' e 'await' servem para esperar que a internet traga o arquivo JSON.
    try {
        // 1. Tenta buscar o arquivo 'data/images.json'.
        const response = await fetch('./data/images.json');
        
        // 2. Converte o texto do arquivo JSON em um objeto JavaScript (Array).
        challenges = await response.json();
        
        // 3. Embaralha os desafios para que o jogo seja diferente a cada vez.
        challenges = shuffleArray(challenges);
        
        // 4. Chama a próxima função para configurar a tela e começar o jogo.
        initializeGame();
    } catch (error) {
        // Se der erro (ex: arquivo não encontrado), mostra uma mensagem.
        console.error("Erro ao carregar desafios:", error);
        challengeDescription.textContent = "Erro ao carregar os dados do jogo. Verifique o arquivo data/images.json.";
    }
}

/**
 * Função Auxiliar: Embaralha um array (lista de desafios).
 * @param {Array} array O array a ser embaralhado.
 * @returns {Array} O array embaralhado.
 */
function shuffleArray(array) {
    // Este é um algoritmo famoso (Fisher-Yates) para misturar itens de forma justa.
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // Troca o item atual (i) com um item aleatório (j).
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Função de Configuração: Inicia o jogo e carrega o primeiro desafio.
 */
function initializeGame() {
    // 1. Atualiza textos na tela com base nas variáveis do CONFIG.
    document.querySelector('header p').textContent = `Descubra os lugares icônicos de ${CONFIG.CITY} e aprenda sobre sua história!`;
    // ... (outras atualizações de texto) ...

    // 2. Carrega a pontuação salva localmente (localStorage).
    loadLeaderboard();
    
    // 3. Carrega o primeiro desafio (índice 0).
    loadChallenge(currentChallengeIndex);
}

/**
 * Função de Jogo: Carrega um desafio específico na tela.
 * @param {number} index O índice do desafio a ser carregado.
 */
function loadChallenge(index) {
    // 1. Verifica se o jogo acabou.
    if (index >= challenges.length) {
        alert("Parabéns! Você completou todos os desafios!");
        return;
    }

    // 2. Define o desafio atual e reseta contadores.
    currentChallenge = challenges[index];
    attempts = 0;
    startTime = Date.now(); // Marca o tempo de início.

    // 3. Reseta a interface do usuário (UI) para o novo desafio.
    guessForm.classList.remove('hidden'); // Mostra o formulário de palpite.
    // ... (outros resets de elementos) ...
    
    // 4. Configura a imagem e a descrição do novo desafio.
    challengeImage.src = CONFIG.IMAGES_FOLDER + currentChallenge.image_path;
    challengeDescription.textContent = currentChallenge.description;
    
    // 5. Aplica o efeito de desfoque na imagem (para dificultar).
    challengeImage.style.filter = 'blur(10px)';
}

// =================================================================================
// 5. LÓGICA DO JOGO (Como o jogo funciona)
// =================================================================================

/**
 * Função de Pontuação: Calcula a pontuação base.
 * @param {string} difficulty A dificuldade do desafio ('Fácil', 'Médio', 'Difícil').
 * @returns {number} A pontuação base.
 */
function getBasePoints(difficulty) {
    // O 'switch' verifica o valor da dificuldade e retorna a pontuação correspondente.
    switch (difficulty) {
        case 'Fácil': return CONFIG.POINTS_EASY;
        case 'Médio': return CONFIG.POINTS_MEDIUM;
        case 'Difícil': return CONFIG.POINTS_HARD;
        default: return 0;
    }
}

/**
 * Função de Pontuação: Calcula o bônus por velocidade.
 * @param {number} timeInSeconds O tempo gasto no desafio.
 * @returns {number} O bônus de pontuação.
 */
function calculateSpeedBonus(timeInSeconds) {
    // Se o jogador for rápido (menos de 20 segundos), ele ganha bônus.
    const maxTime = 20;
    const bonus = Math.max(0, maxTime - timeInSeconds); // Garante que o bônus não seja negativo.
    return Math.floor(bonus);
}

/**
 * Função de Simulação: Simula a busca de endereço via viaCEP.
 * @param {string} cep O CEP a ser buscado.
 */
async function mockViaCEP(cep) {
    // Esta função simula o que um sistema real faria ao consultar uma API externa.
    if (!cep) {
        viacepInfo.textContent = "Informação de endereço não disponível para este desafio.";
        return;
    }

    // Aqui, em vez de chamar a API real, usamos dados falsos (mockData) para mostrar o resultado esperado.
    const mockData = {
        "logradouro": "Rua Exemplo",
        "bairro": "Bairro Histórico",
        "localidade": CONFIG.CITY,
        "uf": "SP"
    };

    // Mostra o resultado simulado na tela.
    viacepInfo.textContent = `Endereço (viaCEP mock): ${mockData.logradouro}, ${mockData.bairro}, ${mockData.localidade}/${mockData.uf}.`;
}

/**
 * Event Listener: O bloco de código mais importante do jogo.
 * Ele espera o usuário clicar no botão "Palpitar" (submit do formulário).
 */
guessForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Impede que a página recarregue ao enviar o formulário.
    
    // 1. Pega o palpite do usuário e o título correto, convertendo para minúsculas para comparar.
    const guess = guessInput.value.trim().toLowerCase();
    const correctTitle = currentChallenge.title.trim().toLowerCase();
    
    // 2. Calcula o tempo que o jogador levou.
    const timeElapsed = Math.floor((Date.now() - startTime) / 1000);

    // 3. Estrutura de Decisão: O palpite está correto?
    if (guess === correctTitle) {
        // --- ACERTO ---
        
        // Calcula a pontuação total.
        const basePoints = getBasePoints(currentChallenge.difficulty);
        const speedBonus = calculateSpeedBonus(timeElapsed);
        const totalPoints = basePoints + speedBonus;
        
        score += totalPoints; // Adiciona os pontos à pontuação geral.
        
        // Revela a imagem (remove o desfoque).
        challengeImage.style.filter = 'blur(0)';
        challengeImage.parentElement.classList.add('revealed');

        // Atualiza a área de feedback com a mensagem de sucesso.
        resultStatus.textContent = `Correto! (+${totalPoints} pontos)`;
        feedbackArea.classList.remove('hidden');
        guessForm.classList.add('hidden'); // Esconde o formulário de palpite.
        
        // Mostra o conteúdo educativo.
        educationalText.innerHTML = `<strong>${currentChallenge.title}</strong>: ${currentChallenge.educational_content}`;

        // Chama a simulação do viaCEP.
        await mockViaCEP(currentChallenge.cep);

        // Salva a nova pontuação.
        updateLeaderboard(currentChallenge.title, totalPoints);

    } else {
        // --- ERRO ---
        
        attempts++; // Incrementa o contador de tentativas.
        resultStatus.textContent = `Incorreto. Tente novamente. Tentativas: ${attempts}/${MAX_ATTEMPTS}`;
        feedbackArea.classList.remove('hidden');

        // Se o jogador errou muitas vezes, mostra a dica e aplica penalidade.
        if (attempts >= MAX_ATTEMPTS) {
            document.getElementById('hint-area').classList.remove('hidden');
            score = Math.max(0, score - 5); // Penalidade de 5 pontos (mínimo 0).
            updateLeaderboard("Penalidade", -5);
        }
    }
});

/**
 * Event Listener: Espera o clique no botão "Próximo Desafio".
 */
nextChallengeBtn.addEventListener('click', () => {
    currentChallengeIndex++; // Avança para o próximo índice.
    loadChallenge(currentChallengeIndex); // Carrega o novo desafio.
});

// =================================================================================
// 6. GAMIFICAÇÃO (Leaderboard e Pontuação)
// =================================================================================

/**
 * Função de Dados: Carrega a tabela de classificação salva no navegador.
 */
function loadLeaderboard() {
    // localStorage é como um pequeno banco de dados no seu navegador.
    const storedLeaderboard = localStorage.getItem('geodesafio_leaderboard');
    // Se houver dados, converte de volta para objeto JavaScript; senão, cria um array vazio.
    let leaderboard = storedLeaderboard ? JSON.parse(storedLeaderboard) : [];
    
    // ... (lógica para garantir a entrada do jogador atual) ...

    // Ordena a lista do maior para o menor.
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Chama a função para desenhar a tabela na tela.
    renderLeaderboard(leaderboard);
}

/**
 * Função de Renderização: Desenha a tabela de classificação no HTML.
 * @param {Array} leaderboard O array de entradas da classificação.
 */
function renderLeaderboard(leaderboard) {
    leaderboardBody.innerHTML = ''; // Limpa a tabela antiga.
    
    // Para cada entrada na lista, cria uma nova linha na tabela.
    leaderboard.forEach((entry, index) => {
        const row = leaderboardBody.insertRow();
        row.insertCell().textContent = index + 1; // Posição.
        row.insertCell().textContent = entry.name; // Nome.
        row.insertCell().textContent = entry.score; // Pontuação.
    });
}

/**
 * Função de Dados: Atualiza a pontuação e salva no localStorage.
 * @param {string} reason Razão da atualização (ex: "Acerto", "Penalidade").
 * @param {number} points Pontos a adicionar/subtrair.
 */
function updateLeaderboard(reason, points) {
    // ... (lógica para encontrar e atualizar a pontuação do jogador) ...
    
    // Salva a lista atualizada no localStorage (convertendo para texto JSON).
    localStorage.setItem('geodesafio_leaderboard', JSON.stringify(leaderboard));
    
    loadLeaderboard(); // Recarrega e redesenha a tabela.
}

// =================================================================================
// 7. FUNCIONALIDADES SIMULADAS (MOCK)
// =================================================================================

// Estas funções simulam funcionalidades que, em um sistema real, precisariam de um servidor (backend).

/**
 * Mock de Eventos Mensais.
 */
toggleEventBtn.addEventListener('click', () => {
    // ... (lógica de simulação de ativação/desativação de evento) ...
});

/**
 * Mock de Criação de Equipe.
 */
document.getElementById('create-team-btn').addEventListener('click', () => {
    // ... (lógica de simulação de criação de equipe) ...
});

/**
 * Mock de Submissão de Contribuição.
 */
contributionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    // ... (lógica de simulação de submissão de formulário) ...
});

// =================================================================================
// 8. INICIALIZAÇÃO (O Ponto de Partida)
// =================================================================================

// Esta é a última linha do código, mas é a primeira instrução que realmente inicia a lógica do jogo.
// Ela chama a função principal que, por sua vez, chama todas as outras.
loadChallenges();
