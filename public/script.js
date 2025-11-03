// === Persistent Local Data ===
let users = JSON.parse(localStorage.getItem("users")) || [
  { username: "very-fried-potato", password: "601121W@ngheh", isAdmin: true }
];
let channels = JSON.parse(localStorage.getItem("channels")) || [
  { id: 1, name: "welcome", locked: true, messages: [
    { author: "very-fried-potato", text: "Welcome to Potato Server! 🥔", time: new Date().toISOString() }
  ]},
  { id: 2, name: "general", locked: false, messages: [] }
];
let activeChannel = 1;
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

function saveData() {
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("channels", JSON.stringify(channels));
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
}

// === DOM Elements ===
const channelList = document.getElementById("channelList");
const memberList = document.getElementById("memberList");
const chatTitle = document.getElementById("chatTitle");
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const messageInputBox = document.getElementById("messageInputBox");
const lockedNotice = document.getElementById("lockedNotice");
const addChannelBtn = document.getElementById("addChannel");
const currentUserEl = document.getElementById("currentUser");
const logoutBtn = document.getElementById("logoutBtn");

// === Authentication ===
if (!currentUser) {
  const username = prompt("Enter username:");
  const password = prompt("Enter password:");

  let user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    const create = confirm("User not found. Create account?");
    if (create) {
      user = { username, password, isAdmin: username === "very-fried-potato" };
      users.push(user);
      alert("Account created!");
    } else {
      alert("Goodbye.");
      throw new Error("No user logged in");
    }
  }
  currentUser = user;
  saveData();
}

currentUserEl.textContent = currentUser.username + (currentUser.isAdmin ? " (Admin)" : "");

// === Render Channels ===
function renderChannels() {
  channelList.innerHTML = "";
  channels.forEach((ch) => {
    const div = document.createElement("div");
    div.className = `flex items-center justify-between px-3 py-2 rounded hover:bg-[#3A3C40] cursor-pointer ${
      activeChannel === ch.id ? "bg-[#404249] text-orange-400" : "text-gray-300"
    }`;

    const nameSpan = document.createElement("span");
    nameSpan.textContent = `# ${ch.name}`;
    nameSpan.onclick = () => {
      activeChannel = ch.id;
      renderMessages();
      renderChannels();
    };

    div.appendChild(nameSpan);

    if (currentUser.isAdmin) {
      const tools = document.createElement("div");
      tools.className = "flex gap-2 text-sm";
      const lockBtn = document.createElement("button");
      lockBtn.textContent = ch.locked ? "🔒" : "🔓";
      lockBtn.onclick = (e) => {
        e.stopPropagation();
        ch.locked = !ch.locked;
        saveData();
        renderChannels();
        renderMessages();
      };

      const renameBtn = document.createElement("button");
      renameBtn.textContent = "✏️";
      renameBtn.onclick = (e) => {
        e.stopPropagation();
        const newName = prompt("Rename channel:", ch.name);
        if (newName) {
          ch.name = newName;
          saveData();
          renderChannels();
        }
      };

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "🗑️";
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Delete channel #${ch.name}?`)) {
          channels = channels.filter(c => c.id !== ch.id);
          if (activeChannel === ch.id) activeChannel = channels[0]?.id || null;
          saveData();
          renderChannels();
          renderMessages();
        }
      };

      tools.append(lockBtn, renameBtn, deleteBtn);
      div.appendChild(tools);
    }

    channelList.appendChild(div);
  });
}

// === Render Messages ===
function renderMessages() {
  const ch = channels.find(c => c.id === activeChannel);
  if (!ch) return;

  chatTitle.textContent = `# ${ch.name}`;
  messagesDiv.innerHTML = "";

  ch.messages.forEach((msg, i) => {
    const div = document.createElement("div");
    div.className = "group px-2 py-1 flex justify-between items-center hover:bg-[#3A3C40] rounded";

    const left = document.createElement("div");
    left.innerHTML = `
      <span class="font-semibold text-orange-400">${msg.author}</span>
      <span class="text-gray-400 text-xs ml-2">${new Date(msg.time).toLocaleTimeString()}</span>
      <div class="text-gray-100 break-words max-w-[90%]">${msg.text}</div>
    `;

    const right = document.createElement("div");
    right.className = "opacity-0 group-hover:opacity-100 transition";
    
    // 🗑 Delete message button
    if (currentUser.isAdmin || msg.author === currentUser.username) {
      const delBtn = document.createElement("button");
      delBtn.textContent = "🗑️";
      delBtn.className = "text-red-400 hover:text-red-300 text-sm ml-2";
      delBtn.onclick = () => {
        if (confirm("Delete this message?")) {
          ch.messages.splice(i, 1);
          saveData();
          renderMessages();
        }
      };
      right.appendChild(delBtn);
    }

    div.append(left, right);
    messagesDiv.appendChild(div);
  });

  // Lock visibility
  if (ch.locked && !currentUser.isAdmin) {
    messageInputBox.classList.add("hidden");
    lockedNotice.classList.remove("hidden");
  } else {
    messageInputBox.classList.remove("hidden");
    lockedNotice.classList.add("hidden");
  }
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// === Render Members ===
function renderMembers() {
  memberList.innerHTML = "";
  users.forEach((u) => {
    const div = document.createElement("div");
    div.className = "flex justify-between items-center bg-[#2B2D31] px-3 py-2 rounded";
    const name = document.createElement("span");
    name.textContent = u.username + (u.isAdmin ? " [Admin]" : "");

    if (currentUser.isAdmin && u.username !== "very-fried-potato") {
      const controls = document.createElement("div");
      controls.className = "flex gap-2";
      const rename = document.createElement("button");
      rename.textContent = "✏️";
      rename.onclick = () => {
        const newName = prompt("Rename member:", u.username);
        if (!newName) return;
        // Update username in messages
        channels.forEach(c =>
          c.messages.forEach(m => {
            if (m.author === u.username) m.author = newName;
          })
        );
        u.username = newName;
        saveData();
        renderMembers();
        renderMessages();
      };

      const remove = document.createElement("button");
      remove.textContent = "🗑️";
      remove.onclick = () => {
        if (confirm(`Remove ${u.username}?`)) {
          users = users.filter(x => x.username !== u.username);
          saveData();
          renderMembers();
        }
      };
      controls.append(rename, remove);
      div.appendChild(controls);
    }

    div.appendChild(name);
    memberList.appendChild(div);
  });
}

// === Send Message ===
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  const ch = channels.find(c => c.id === activeChannel);
  if (!ch) return;

  if (ch.locked && !currentUser.isAdmin) {
    alert("This channel is locked!");
    return;
  }

  ch.messages.push({
    author: currentUser.username,
    text,
    time: new Date().toISOString()
  });

  messageInput.value = "";
  saveData();
  renderMessages();
}

messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

addChannelBtn.onclick = () => {
  if (!currentUser.isAdmin) return alert("Only admin can add channels.");
  const name = prompt("New channel name:");
  if (!name) return;
  channels.push({ id: Date.now(), name, locked: false, messages: [] });
  saveData();
  renderChannels();
};

logoutBtn.onclick = () => {
  localStorage.removeItem("currentUser");
  location.reload();
};

// === Initial Load ===
renderChannels();
renderMessages();
renderMembers();
