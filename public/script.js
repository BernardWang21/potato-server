let currentUser = null;
let currentChannel = null;
let refreshInterval = null;

async function api(url, method = "GET", body) {
  const opt = { method, headers: { "Content-Type": "application/json" } };
  if (body) opt.body = JSON.stringify(body);
  const res = await fetch(url, opt);
  if (!res.ok) throw new Error(await res.text());
  return res.json().catch(() => ({}));
}

async function signup() {
  const u = user.value.trim(), p = pass.value.trim();
  await api("/signup", "POST", { username: u, password: p });
  currentUser = u; startChat();
}

async function login() {
  const u = user.value.trim(), p = pass.value.trim();
  await api("/login", "POST", { username: u, password: p });
  currentUser = u; startChat();
}

async function logout() {
  await api("/logout", "POST");
  location.reload();
}

async function startChat() {
  auth.classList.add("hidden");
  chat.classList.remove("hidden");
  const channels = await api("/channels");
  channelsEl = document.getElementById("channels");
  channelsEl.innerHTML = channels.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  currentChannel = channels[0].id;
  loadMessages();
  refreshInterval = setInterval(loadMessages, 2000);
}

async function loadMessages() {
  const msgs = await api(`/messages?channel=${currentChannel}`);
  messages.innerHTML = msgs.map(m => `<div><b>${m.user}</b>: ${m.content}</div>`).join("");
}

async function sendMsg() {
  const text = msg.value.trim();
  if (!text) return;
  await api("/messages", "POST", { channel: currentChannel, content: text });
  msg.value = "";
  loadMessages();
}
