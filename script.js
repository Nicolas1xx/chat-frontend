// 1. Configuração e Conexão Socket.IO
const socket = io("https://hatbot-flask-backend.onrender.com", { transports: ["websocket"] });

// 2. Referências aos Elementos do DOM
const chatArea = document.getElementById('chat-area');
const mensagemInput = document.getElementById('mensagem-input');
const chatForm = document.getElementById('chat-form');
const enviarBtn = document.getElementById('enviar-btn');

// Caminho do avatar (ajustável conforme a estrutura)
const AVATAR_BOT_URL = './static/astro.png';
// Variável para rastrear o elemento de carregamento
let loadingMessageElement = null;

// Segurança e configuração do marked
if (typeof marked !== 'undefined') {
  marked.setOptions({
    mangle: false,
    headerIds: false,
  });
}

/**
 * Cria e exibe o indicador de carregamento com pontinhos animados.
 */
function displayLoadingMessage() {
  const messageWrapper = document.createElement('div');
  messageWrapper.className = 'flex items-start space-x-3 sm:space-x-4';
  
  const avatar = `
    <div class="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden" title="Avatar do Astrolino">
      <img src="${AVATAR_BOT_URL}" alt="Avatar do Astrolino" class="w-full h-full object-cover">
    </div>
  `;
  
  // Elemento com animação de loading (pontinhos)
  const loadingContent = `
    <div class="bg-indigo-700 bg-opacity-60 p-4 rounded-tl-none rounded-2xl text-sm chat-message max-w-lg break-words shadow-xl">
      <div id="loading-dots" class="text-white text-lg font-bold">
        .
      </div>
    </div>
  `;

  messageWrapper.innerHTML = avatar + loadingContent;
  chatArea.appendChild(messageWrapper);
  chatArea.scrollTop = chatArea.scrollHeight;
  
  // Armazena a referência e inicia a animação
  loadingMessageElement = messageWrapper;
  animateDots();
  
  // NOVIDADE: Desabilita o botão e o input para evitar spam
  enviarBtn.disabled = true;
  mensagemInput.disabled = true;
}

/**
 * Anima os pontos de carregamento (..., .., .)
 */
function animateDots() {
    const dotsElement = document.getElementById('loading-dots');
    if (!dotsElement) return;

    let dotCount = 1;
    const animationInterval = setInterval(() => {
        if (!loadingMessageElement || !chatArea.contains(loadingMessageElement)) {
            clearInterval(animationInterval);
            return;
        }
        dotCount = (dotCount % 3) + 1; // Cicla entre 1, 2 e 3
        dotsElement.textContent = '.'.repeat(dotCount);
    }, 500); // Altera a cada 400ms
    
    // Armazena o ID do intervalo na variável global para poder limpá-lo
    loadingMessageElement.dataset.intervalId = animationInterval;
}


/**
 * Remove o indicador de carregamento da área de chat.
 */
function removeLoadingMessage() {
  if (loadingMessageElement) {
    // Limpa a animação
    const intervalId = parseInt(loadingMessageElement.dataset.intervalId);
    if (!isNaN(intervalId)) {
        clearInterval(intervalId);
    }
    // Remove o elemento do DOM
    loadingMessageElement.remove();
    loadingMessageElement = null;
    
    // NOVIDADE: Habilita o botão e o input novamente
    enviarBtn.disabled = false;
    mensagemInput.disabled = false;
  }
}


// Exibir mensagens (função original mantida e limpa)
function displayMessage(sender, text) {
  const messageWrapper = document.createElement('div');
  messageWrapper.className = `flex items-start space-x-3 sm:space-x-4 ${sender === 'user' ? 'justify-end' : 'justify-start'}`;
  let contentHTML = '';

  if (sender === 'bot') {
    const avatar = `
      <div class="w-10 h-10 flex-shrink-0 rounded-full overflow-hidden" title="Avatar do Astrolino">
        <img src="${AVATAR_BOT_URL}" alt="Avatar do Astrolino" class="w-full h-full object-cover">
      </div>
    `;
    const messageContent = `
      <div class="bg-indigo-700 bg-opacity-60 p-4 rounded-tl-none rounded-2xl text-sm chat-message max-w-lg break-words shadow-xl">
        ${marked.parse(text)}
      </div>
    `;
    contentHTML = avatar + messageContent;
  } else {
    const messageContent = `
      <div class="bg-purple-600 text-white p-4 rounded-tr-none rounded-2xl text-sm chat-message max-w-lg break-words shadow-xl font-medium">
        ${text}
      </div>
    `;
    contentHTML = messageContent;
  }

  messageWrapper.innerHTML = contentHTML;
  chatArea.appendChild(messageWrapper);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function sendMessage() {
  const message = mensagemInput.value.trim();
  if (!message) return;
  
  // 1. Exibe a mensagem do usuário
  displayMessage('user', message);
  
  // 2. Exibe o indicador de carregamento e desabilita o input/botão
  displayLoadingMessage(); 

  // 3. Envia a mensagem para o servidor
  socket.emit("enviar_mensagem", { mensagem: message });
  
  // Limpa o input e foca
  mensagemInput.value = "";
  // Não foca até que a resposta chegue, pois o input está desabilitado.
}

// Ouve a resposta do bot
socket.on("nova_mensagem", (data) => {
    // 1. Remove o indicador de carregamento e habilita o input/botão
    removeLoadingMessage();
    // 2. Exibe a resposta real
    displayMessage("bot", data.texto);
    mensagemInput.focus(); // Foca após a resposta
});

// Ouve erros
socket.on("erro", (data) => {
    // 1. Remove o indicador de carregamento e habilita o input/botão
    removeLoadingMessage(); 
    // 2. Exibe a mensagem de erro
    displayMessage("bot", `🚨 **ERRO CÓSMICO!** ${data.erro || 'Erro desconhecido.'}`);
    mensagemInput.focus(); // Foca após o erro
});

// Ouve status de conexão
socket.on("status_conexao", (data) => displayMessage("bot", data.data || data.mensagem || "Conectado ao servidor!"));


enviarBtn.addEventListener('click', (e) => { e.preventDefault(); sendMessage(); });
mensagemInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !enviarBtn.disabled) { // Verifica se não está desabilitado
    e.preventDefault();
    sendMessage();
  }
});

window.addEventListener('load', () => mensagemInput.focus());
