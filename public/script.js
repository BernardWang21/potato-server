// Simple Discord-style frontend (localStorage based)

let currentUser = localStorage.getItem("username") || "very-fried-potato";
let channels = JSON.parse(localStorage.getItem("channels")) || [
  { id: 1, name: "welcome", messages: [{ author: "very-fried-potato", text: "Welcome to Potato Server! 🥔" }] },
  { id: 2, name: "general", messages: [] },
  { id: 3, name: "random", messages: [] }
];
let activeChannel = 1;

const messageInput = document.getElementById("messageInput");
const messagesDiv = document.getElementById("messages");
const channelList = document.getElementById("channelList");
const memberList = document.getElementById("memberList");
const chatHeader = document.getElementById("chatHeader");

// Simulate online members
const members = ["very-fried-potato", "you", "potato-friend", "mashed-tuber"];

// Save channels
function saveChannels() {
  localStorage.setItem("channels", JSON.stringify(channels));
}

// Render Channels
function renderChannels() {
  channelList.innerHTML = "";
  channels.forEach((ch) => {
    const btn = document.createElement("button");
    btn.textContent = `# ${ch.name}`;
    btn.className =
      "w-full text-left px-3 py-2 rounded hover:bg-[#3A3C40] transition " +
      (ch.id === activeChannel ? "bg-[#404249] text-orange-400 font-semibold" : "text-gray-300");
    btn.onclick = () => {
      activeChannel = ch.id;
      renderMessages();
      renderChannels();
      chatHeader.textContent = `# ${ch.name}`;
    };
    channelList.appendChild(btn);
  });
}

// Render Messages
function renderMessages() {
  messagesDiv.innerHTML = "";
  const ch = channels.find((c) => c.id === activeChannel);
  if (!ch) return;
  if (ch.messages.length === 0) {
    messagesDiv.innerHTML = `<p class="text-gray-500 text-center mt-8">No messages yet...</p>`;
    return;
  }

  ch.messages.forEach((msg) => {
    const div = document.createElement("div");
    div.className = "flex flex-col";
    div.innerHTML = `
      <div class="text-sm">
        <span class="font-semibold text-orange-400">${msg.author}</span>
        <span class="text-gray-400 text-xs ml-2">${new Date().toLocaleTimeString()}</span>
      </div>
      <div class="text-gray-200">${msg.text}</div>
    `;
    messagesDiv.appendChild(div);
  });
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Render Members
function renderMembers() {
  memberList.innerHTML = "";
  members.forEach((m) => {
    const div = document.createElement("div");
    div.className =
      "flex items-center justify-between bg-[#2B2D31] px-3 py-2 rounded text-gray-300";
    div.textContent = m;
    memberList.appendChild(div);
  });
}

// Send message
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  const ch = channels.find((c) => c.id === activeChannel);
  if (!ch) return;

  ch.messages.push({ author: currentUser, text });
  saveChannels();
  renderMessages();
  messageInput.value = "";
}

// Handle Enter key
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

// Add new channel
document.getElementById("newChannelBtn").addEventListener("click", () => {
  const name = prompt("Enter new channel name:");
  if (!name) return;
  channels.push({ id: Date.now(), name, messages: [] });
  saveChannels();
  renderChannels();
});

// Logout button (just clears username)
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("username");
  alert("You have been logged out.");
});

// Initial load
renderChannels();
renderMessages();
renderMembers();
