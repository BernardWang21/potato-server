const authScreen = document.getElementById("auth-screen");
const chatApp = document.getElementById("chat-app");
const authButton = document.getElementById("auth-button");
const toggleAuth = document.getElementById("toggle-auth");
const authTitle = document.getElementById("auth-title");
const authError = document.getElementById("auth-error");

let isSignup = false;
let currentUser = null;

toggleAuth.onclick = () => {
  isSignup = !isSignup;
  authTitle.textContent = isSignup ? "Create your account" : "Welcome back";
  authButton.textContent = isSignup ? "Sign Up" : "Log In";
  toggleAuth.textContent = isSignup
    ? "Already have an account? Log in"
    : "Don't have an account? Sign up";
  authError.textContent = "";
};

authButton.onclick = async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  if (!username || !password) return (authError.textContent = "Enter all fields!");

  const endpoint = isSignup ? "/api/signup" : "/api/login";
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) return (authError.textContent = data.message || "Error");

  currentUser = username;
  authScreen.classList.add("hidden");
  chatApp.classList.remove("hidden");
  document.getElementById("user-info").textContent = `Hello, ${username}`;
  loadChannels();
};

document.getElementById("logout").onclick = () => {
  fetch("/api/logout", { method: "POST" });
  location.reload();
};

const channelsDiv = document.getElementById("channels");
const messagesDiv = document.getElementById("messages");
let activeChannel = null;

async function loadChannels() {
  const res = await fetch("/api/channels").catch(() => null);
  const channels = res?.ok ? await res.json() : [
    { name: "general" },
    { name: "announcements" }
  ];

  channelsDiv.innerHTML = "";
  channels.forEach(c => {
    const btn = document.createElement("button");
    btn.textContent = `# ${c.name}`;
    btn.onclick = () => loadMessages(c.name);
    channelsDiv.appendChild(btn);
  });

  if (channels.length) loadMessages(channels[0].name);
}

async function loadMessages(channel) {
  activeChannel = channel;
  const res = await fetch(`/api/messages/${channel}`);
  const data = await res.json().catch(() => []);
  messagesDiv.innerHTML = "";
  data.forEach(msg => {
    const div = document.createElement("div");
    div.className = "message";
    div.innerHTML = `<span class="user">${msg.username}</span>: ${msg.content}`;
    messagesDiv.appendChild(div);
  });
}

document.getElementById("send").onclick = async () => {
  const content = document.getElementById("new-message").value.trim();
  if (!content) return;
  await fetch(`/api/messages/${activeChannel}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  document.getElementById("new-message").value = "";
  loadMessages(activeChannel);
};
