const API = window.location.origin;
const chatEl = document.getElementById("chat");
const authEl = document.getElementById("auth");

const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const logoutBtn = document.getElementById("logout-btn");
const sendBtn = document.getElementById("send-btn");

let token = localStorage.getItem("token");
let username = localStorage.getItem("username");

async function api(path, data) {
  const res = await fetch(API + path, {
    method: data ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {})
    },
    body: data ? JSON.stringify(data) : undefined
  });
  return res.json();
}

function showChat() {
  authEl.style.display = "none";
  chatEl.style.display = "flex";
  loadMessages();
}

function showAuth() {
  authEl.style.display = "flex";
  chatEl.style.display = "none";
}

if (token && username) showChat();
else showAuth();

loginBtn.onclick = async () => {
  const u = document.getElementById("login-username").value;
  const p = document.getElementById("login-password").value;
  const res = await api("/login", { username: u, password: p });
  if (res.token) {
    token = res.token;
    username = u;
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    showChat();
  } else alert(res.error || "Login failed");
};

signupBtn.onclick = async () => {
  const u = document.getElementById("signup-username").value;
  const p = document.getElementById("signup-password").value;
  const res = await api("/signup", { username: u, password: p });
  if (res.success) alert("Signup successful! You can now log in.");
  else alert(res.error || "Signup failed");
};

logoutBtn.onclick = () => {
  localStorage.clear();
  token = null;
  showAuth();
};

sendBtn.onclick = async () => {
  const input = document.getElementById("message-input");
  const text = input.value.trim();
  if (!text) return;
  await api("/message", { text });
  input.value = "";
  loadMessages();
};

async function loadMessages() {
  const res = await api("/messages");
  const msgEl = document.getElementById("messages");
  msgEl.innerHTML = "";
  res.forEach(m => {
    const div = document.createElement("div");
    div.textContent = `${m.username}: ${m.text}`;
    msgEl.appendChild(div);
  });
}
