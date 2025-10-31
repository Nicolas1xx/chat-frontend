// 1. Configuração e Conexão Socket.IO
const socket = io("https://hatbot-flask-backend.onrender.com", { transports: ["websocket"] });

// 2. Referências aos Elementos do DOM
const chatArea = document.getElementById('chat-area');
const mensagemInput = document.getElementById('mensagem-input');
const chatForm = document.getElementById('chat-form');
const enviarBtn = document.getElementById('enviar-btn');

// Caminho do avatar (ajustável conforme a estrutura)
const AVATAR_BOT_URL = './static/astro.png';

// Segurança e configuração do marked
if (typeof marked !== 'undefined') {
  marked.setOptions({
    mangle: false,
    headerIds: false,
  });
}

// Exibir mensagens
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
  displayMessage('user', message);
  socket.emit("enviar_mensagem", { mensagem: message });
  mensagemInput.value = "";
  mensagemInput.focus();
}

socket.on("nova_mensagem", (data) => displayMessage("bot", data.texto));
socket.on("erro", (data) => displayMessage("bot", `🚨 **ERRO CÓSMICO!** ${data.erro || 'Erro desconhecido.'}`));
socket.on("status_conexao", (data) => {
  const texto = data.data || data.mensagem || "Conectado ao servidor!";
  displayMessage("bot", texto);
});

enviarBtn.addEventListener('click', (e) => { e.preventDefault(); sendMessage(); });
mensagemInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

window.addEventListener('load', () => mensagemInput.focus());
