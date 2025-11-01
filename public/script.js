let isLogin = false;

const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const toggleMode = document.getElementById("toggleMode");
const status = document.getElementById("status");

toggleMode.addEventListener("click", () => {
  isLogin = !isLogin;
  formTitle.textContent = isLogin ? "Log In" : "Sign Up";
  submitBtn.textContent = isLogin ? "Log In" : "Sign Up";
  toggleMode.textContent = isLogin
    ? "Don't have an account? Sign up"
    : "Already have an account? Log in";
  status.textContent = "";
});

// 🧠 Helper: POST JSON to backend
async function postData(route, data) {
  try {
    const res = await fetch(route, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const text = await res.text(); // get raw text in case JSON parse fails
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      console.error("Server did not return JSON:", text);
      throw new Error("Server error (not JSON)");
    }

    if (!res.ok) {
      throw new Error(json.message || "Request failed");
    }
    return json;
  } catch (err) {
    throw err;
  }
}

submitBtn.addEventListener("click", async () => {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    status.textContent = "Please fill out all fields.";
    status.style.color = "red";
    return;
  }

  // ✅ Make sure this includes /api/
  const route = isLogin ? "/api/login" : "/api/signup";
  console.log("Submitting to:", route);

  try {
    const data = await postData(route, { username, password });
    status.style.color = "#00ff90";
    status.textContent = data.message || "Success!";

    // Redirect to chat page after successful login
    if (isLogin) {
      setTimeout(() => {
        window.location.href = "/chat.html";
      }, 1000);
    }
  } catch (err) {
    console.error("Request error:", err);
    status.style.color = "red";
    status.textContent = err.message;
  }
});
