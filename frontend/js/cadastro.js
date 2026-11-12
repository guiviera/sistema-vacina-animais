const form = document.querySelector("#registerForm");
const errorBox = document.querySelector("#registerError");
const successBox = document.querySelector("#registerSuccess");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBox.textContent = "";
  successBox.textContent = "";

  const data = Object.fromEntries(new FormData(form).entries());
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.erro || "Não foi possível realizar o cadastro.");

    successBox.textContent = result.mensagem || "Cadastro realizado. Você já pode entrar.";
    form.reset();
    setTimeout(() => window.location.href = "index.html", 1800);
  } catch (error) {
    errorBox.textContent = error.message;
  }
});
