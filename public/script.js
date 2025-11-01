window.addEventListener("DOMContentLoaded", () => {
  // UI elements
  const authContainer = document.getElementById("authContainer");
  const chatContainer = document.getElementById("chatContainer");
  const formTitle = document.getElementById("formTitle");
  const submitBtn = document.getElementById("submitBtn");
  const toggleMode = document.getElementById("toggleMode");
  const status = document.getElementById("status");
  const messagesDiv = document.getElementById("messages");
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  const currentChannelEl = document.getElementById("currentChannel");

  let isLogin = false;
  let currentChannel = "welcome";

  // Toggle between login/signup
  toggleMode.addEventListener("click", () => {
    isLogin = !isLogin;
    formTitle.textContent = isLogin ? "Log In" : "Sign Up";
    submitBtn.textContent = isLogin ? "Log In" : "Sign Up";
    toggleMode.textContent = isLogin
      ? "Don't have an account? Sign up"
      : "Already have an account? Log in";
    status.textContent = "";
  });

  // Helper to send JSON POST
  async function postData(route, data) {
    const res = await fetch(route, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      console.error("Server did not return JSON:", text);
      throw new Error("Server error");
    }
    if (!res.ok) throw new Error(json.message || "Request failed");
    return json;
  }

  // Handle sign up / log in
  submitBtn.addEventListener("click", async () => {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      status.textContent = "Please fill out all fields.";
      status.style.color = "red";
      return;
    }

    const route = isLogin ? "/api/login" : "/api/signup";
    try {
      const data = await postData(route, { username, password });
      status.style.color = "#00ff90";
      status.textContent = data.message;

      if (isLogin) {
        // Switch to chat
        authContainer.style.display = "none";
        chatContainer.style.display = "flex";
        loadMessages();
        setInterval(loadMessages, 3000);
      }
    } catch (err) {
      console.error("Request error:", err);
      status.style.color = "red";
      status.textContent = err.message;
    }
  });

  // Load chat messages
  async function loadMessages() {
    try {
      const res = await fetch(`/api/messages/${currentChannel}`);
      const data = await res.json();
      messagesDiv.innerHTML = "";
      data.forEach((msg) => {
        const div = document.createElement("div");
        div.className = "message";
        div.innerHTML = `<strong>${msg.username}:</strong> ${msg.content}`;
        messagesDiv.appendChild(div);
      });
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    } catch (err) {
      console.error("Failed to load messages", err);
    }
  }

  // Send message
  async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content) return;
    try {
      await fetch(`/api/messages/${currentChannel}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      messageInput.value = "";
      loadMessages();
    } catch (err) {
      console.error("Failed to send message", err);
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
});
