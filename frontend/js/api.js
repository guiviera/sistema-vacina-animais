const API = {
  token: localStorage.getItem("vetcare_token"),
  async request(url, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    const response = await fetch(`/api${url}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      this.logout();
      throw new Error(data.erro || "Sua sessão expirou. Entre novamente.");
    }
    if (!response.ok) throw new Error(data.erro || "Ocorreu um erro na solicitação.");
    return data;
  },
  login(login, senha) {
    return this.request("/auth/login", { method: "POST", body: JSON.stringify({ login, senha }) });
  },
  logout() {
    this.token = null;
    localStorage.removeItem("vetcare_token");
  },
  list(table, q = "") {
    return this.request(`/${table}?q=${encodeURIComponent(q)}`);
  },
  create(table, data) {
    return this.request(`/${table}`, { method: "POST", body: JSON.stringify(data) });
  },
  update(table, id, data) {
    return this.request(`/${table}/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  remove(table, id) {
    return this.request(`/${table}/${id}`, { method: "DELETE" });
  }
};
