const authContainer = document.getElementById("auth-container");
const chatContainer = document.getElementById("chat-container");
const formTitle = document.getElementById("formTitle");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submitBtn");
const toggleMode = document.getElementById("toggleMode");
const statusDiv = document.getElementById("status");

let isLogin = false;
let currentUser = null;
let currentChannel = "welcome";

async function postData(url, data) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Server error");
    return await res.json();
  } catch (err) {
    console.error("Request error:", err);
    throw err;
  }
}

toggleMode.addEventListener("click", () => {
  isLogin = !isLogin;
  formTitle.textContent = isLogin ? "Log In" : "Sign Up";
  submitBtn.textContent = isLogin ? "Log In" : "Sign Up";
  toggleMode.textContent = isLogin
    ? "Don't have an account? Sign up"
    : "Already have an account? Log in";
});

submitBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !password) {
    statusDiv.textContent = "Please fill all fields.";
    return;
  }

  const endpoint = isLogin ? "/api/login" : "/api/signup";
  try {
    const result = await postData(endpoint, { username, password });
    console.log(result);
    currentUser = username;
    enterChat();
  } catch {
    statusDiv.textContent = "Error logging in or signing up.";
  }
});

function enterChat() {
  authContainer.classList.add("hidden");
  chatContainer.classList.remove("hidden");

  if (currentUser === "very-fried-potato") {
    document.querySelector(".admin-only").classList.remove("hidden");
  }

  setupChannels();
  loadMessages(currentChannel);
}

function setupChannels() {
  const channels = ["welcome", "announcements", "chatting"];
  const list = document.getElementById("channelList");
  list.innerHTML = "";
  channels.forEach((ch) => {
    const li = document.createElement("li");
    li.textContent = "#" + ch;
    li.addEventListener("click", () => {
      currentChannel = ch;
      document.getElementById("chatHeader").textContent = "#" + ch;
      loadMessages(ch);
    });
    list.appendChild(li);
  });
}

async function loadMessages(channel) {
  const res = await fetch(`/api/messages/${channel}`);
  const messagesDiv = document.getElementById("messages");
  messagesDiv.innerHTML = "";

  if (res.ok) {
    const messages = await res.json();
    messages.forEach((m) => {
      const div = document.createElement("div");
      div.classList.add("message");
      div.innerHTML = `<span class="username">${m.username}</span>: ${m.content}`;
      messagesDiv.appendChild(div);
    });
  } else {
    messagesDiv.innerHTML = "<p>Failed to load messages.</p>";
  }
}

document.getElementById("sendBtn").addEventListener("click", async () => {
  const input = document.getElementById("messageInput");
  const content = input.value.trim();
  if (!content) return;
  input.value = "";

  await postData(`/api/messages/${currentChannel}`, { content });
  loadMessages(currentChannel);
});
