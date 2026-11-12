require("dotenv").config();
const express = require("express");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error("Configure JWT_SECRET no arquivo .env com pelo menos 32 caracteres.");
  process.exit(1);
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "../frontend")));

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 });
const tableConfig = {
  tutor: {
    pk: "id_tutor",
    fields: ["nome","cpf","telefone","email"],
    search: ["nome","cpf","telefone","email"],
    order: "nome"
  },
  animais: {
    pk: "id_animal",
    fields: ["id_tutor","nome","especie","raca","sexo","data_nascimento","peso","observacoes","ativo"],
    search: ["nome","especie","raca"],
    order: "nome"
  },
  funcionarios: {
    pk: "id_funcionario",
    fields: ["nome","cpf","telefone","email","cargo","endereco","ativo"],
    search: ["nome","cpf","cargo"],
    order: "nome"
  },
  usuarios: {
    pk: "id_usuario",
    fields: ["id_funcionario","login","senha","ativo"],
    search: ["login"],
    order: "login",
    hide: ["senha"]
  },
  vacinas: {
    pk: "id_vacina",
    fields: ["nome","fabricante","especie_indicada","descricao","intervalo_doses","ativo"],
    search: ["nome","fabricante","especie_indicada"],
    order: "nome"
  },
  lote_vacinas: {
    pk: "id_lote",
    fields: ["id_vacina","codigo_lote","data_validade","quantidade_inicial","quantidade_atual"],
    search: ["codigo_lote"],
    order: "data_validade"
  },
  aplicacoes: {
    pk: "id_aplicacao",
    fields: ["id_animal","id_vacina","id_lote","id_funcionario","data_aplicacao","numero_dose","proxima_dose","observacoes"],
    search: ["observacoes"],
    order: "data_aplicacao"
  },
  estoque_vacinas: {
    pk: "id_movimentacao",
    fields: ["id_lote","id_usuario","quantidade","motivo","tipo"],
    search: ["motivo","tipo"],
    order: "data_movimentacao"
  },
  agendamentos: {
    pk: "id_agendamento",
    fields: ["id_animal","id_vacina","id_funcionario","data_hora","observacoes","status"],
    search: ["observacoes","status"],
    order: "data_hora"
  },
  despesas: {
    pk: "id_despesa",
    fields: ["id_usuario","descricao","categoria","valor","data","forma_pagamento","comprovante"],
    search: ["descricao","categoria"],
    order: "data"
  },
  logs: {
    pk: "id_log",
    fields: ["id_usuario","acao","tabela_afetada"],
    search: ["acao","tabela_afetada"],
    order: "data_hora",
    readOnly: true
  }
};

function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ erro: "Faça login para continuar." });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ erro: "Sessão inválida ou expirada." });
  }
}


// Cadastro inicial: permitido somente enquanto ainda não existir nenhum usuário.
// Isso evita deixar uma tela pública capaz de criar contas indefinidamente.
app.post("/api/auth/register", loginLimiter, async (req, res) => {
  const { nome, cpf, telefone, email, cargo, endereco, login, senha } = req.body || {};
  if (!nome || !cpf || !cargo || !login || !senha) {
    return res.status(400).json({ erro: "Preencha nome, CPF, cargo, login e senha." });
  }
  if (String(senha).length < 8) {
    return res.status(400).json({ erro: "A senha deve ter pelo menos 8 caracteres." });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [users] = await connection.query("SELECT COUNT(*) AS total FROM usuarios");
    if (Number(users[0].total) > 0) {
      await connection.rollback();
      return res.status(403).json({
        erro: "O cadastro inicial já foi realizado. Peça a um administrador para criar novos acessos."
      });
    }

    const [employee] = await connection.execute(
      `INSERT INTO funcionarios (nome, cpf, telefone, email, cargo, endereco, ativo)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [nome, cpf, telefone || null, email || null, cargo, endereco || null]
    );
    const passwordHash = await bcrypt.hash(senha, 12);
    const [user] = await connection.execute(
      `INSERT INTO usuarios (id_funcionario, login, senha, ativo)
       VALUES (?, ?, ?, TRUE)`,
      [employee.insertId, login, passwordHash]
    );

    await connection.commit();
    res.status(201).json({
      mensagem: "Cadastro inicial concluído. Agora você já pode entrar.",
      id_usuario: user.insertId
    });
  } catch (e) {
    if (connection) await connection.rollback();
    console.error(e);
    res.status(400).json({
      erro: e.code === "ER_DUP_ENTRY"
        ? "Este CPF, e-mail ou login já está cadastrado."
        : "Não foi possível concluir o cadastro. Confira os dados e tente novamente."
    });
  } finally {
    if (connection) connection.release();
  }
});

app.post("/api/auth/login", loginLimiter, async (req, res) => {
  try {
    const { login, senha } = req.body || {};
    if (!login || !senha) return res.status(400).json({ erro: "Informe login e senha." });

    const [rows] = await pool.execute(
      `SELECT u.id_usuario, u.login, u.senha, u.ativo, f.nome, f.cargo
       FROM usuarios u JOIN funcionarios f ON f.id_funcionario = u.id_funcionario
       WHERE u.login = ? LIMIT 1`, [login]
    );
    const user = rows[0];
    if (!user || !user.ativo || !(await bcrypt.compare(senha, user.senha))) {
      return res.status(401).json({ erro: "Login ou senha inválidos." });
    }

    await pool.execute("UPDATE usuarios SET ultimo_acesso = NOW() WHERE id_usuario = ?", [user.id_usuario]);
    const token = jwt.sign(
      { id_usuario: user.id_usuario, login: user.login, nome: user.nome, cargo: user.cargo },
      JWT_SECRET, { expiresIn: "8h" }
    );
    res.json({ token, usuario: { nome: user.nome, login: user.login, cargo: user.cargo } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Não foi possível realizar o login." });
  }
});

app.get("/api/dashboard", auth, async (req, res) => {
  try {
    const queries = {
      tutores: "SELECT COUNT(*) total FROM tutor",
      animais: "SELECT COUNT(*) total FROM animais WHERE ativo = 1",
      vacinas: "SELECT COUNT(*) total FROM vacinas WHERE ativo = 1",
      agendamentos: "SELECT COUNT(*) total FROM agendamentos WHERE status = 'Agendado'",
      estoque: "SELECT COALESCE(SUM(quantidade_atual),0) total FROM lote_vacinas",
      despesas: "SELECT COALESCE(SUM(valor),0) total FROM despesas WHERE MONTH(data)=MONTH(CURRENT_DATE()) AND YEAR(data)=YEAR(CURRENT_DATE())"
    };
    const result = {};
    for (const [key, sql] of Object.entries(queries)) {
      const [rows] = await pool.query(sql);
      result[key] = rows[0].total;
    }
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao carregar indicadores." });
  }
});

app.get("/api/options", auth, async (req, res) => {
  try {
    const [tutores] = await pool.query("SELECT id_tutor AS id, nome AS label FROM tutor ORDER BY nome");
    const [animais] = await pool.query("SELECT id_animal AS id, nome AS label FROM animais ORDER BY nome");
    const [funcionarios] = await pool.query("SELECT id_funcionario AS id, nome AS label FROM funcionarios ORDER BY nome");
    const [vacinas] = await pool.query("SELECT id_vacina AS id, nome AS label FROM vacinas ORDER BY nome");
    const [lotes] = await pool.query("SELECT id_lote AS id, codigo_lote AS label FROM lote_vacinas ORDER BY codigo_lote");
    const [usuarios] = await pool.query("SELECT id_usuario AS id, login AS label FROM usuarios ORDER BY login");
    res.json({ tutores, animais, funcionarios, vacinas, lotes, usuarios });
  } catch (e) {
    res.status(500).json({ erro: "Erro ao carregar opções dos formulários." });
  }
});

app.get("/api/:table", auth, async (req, res) => {
  const cfg = tableConfig[req.params.table];
  if (!cfg) return res.status(404).json({ erro: "Módulo não encontrado." });
  try {
    const q = String(req.query.q || "").trim();
    const limit = Math.min(Math.max(Number(req.query.limit || 200), 1), 500);
    const params = [];
    let where = "";
    if (q && cfg.search.length) {
      where = " WHERE " + cfg.search.map(col => `CAST(\`${col}\` AS CHAR) LIKE ?`).join(" OR ");
      cfg.search.forEach(() => params.push(`%${q}%`));
    }
    const sql = `SELECT * FROM \`${req.params.table}\`${where} ORDER BY \`${cfg.order}\` DESC LIMIT ${limit}`;
    const [rows] = await pool.execute(sql, params);
    res.json(rows.map(row => {
      if (cfg.hide) cfg.hide.forEach(key => delete row[key]);
      return row;
    }));
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: "Erro ao consultar registros. Verifique os relacionamentos e os dados." });
  }
});

app.post("/api/:table", auth, async (req, res) => {
  const table = req.params.table, cfg = tableConfig[table];
  if (!cfg) return res.status(404).json({ erro: "Módulo não encontrado." });
  if (cfg.readOnly) return res.status(403).json({ erro: "Este módulo é somente leitura." });
  try {
    const data = {};
    cfg.fields.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) data[field] = req.body[field] === "" ? null : req.body[field];
    });
    if (table === "usuarios" && data.senha) data.senha = await bcrypt.hash(data.senha, 12);
    const keys = Object.keys(data);
    if (!keys.length) return res.status(400).json({ erro: "Nenhum campo válido informado." });
    const cols = keys.map(k => `\`${k}\``).join(",");
    const marks = keys.map(() => "?").join(",");
    const [result] = await pool.execute(`INSERT INTO \`${table}\` (${cols}) VALUES (${marks})`, keys.map(k => data[k]));
    res.status(201).json({ id: result.insertId, mensagem: "Registro cadastrado." });
  } catch (e) {
    console.error(e);
    res.status(400).json({ erro: e.code === "ER_DUP_ENTRY" ? "Já existe um registro com esse dado único." : "Não foi possível cadastrar. Confira os campos obrigatórios e os relacionamentos." });
  }
});

app.put("/api/:table/:id", auth, async (req, res) => {
  const table = req.params.table, cfg = tableConfig[table];
  if (!cfg) return res.status(404).json({ erro: "Módulo não encontrado." });
  if (cfg.readOnly) return res.status(403).json({ erro: "Este módulo é somente leitura." });
  try {
    const data = {};
    cfg.fields.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) data[field] = req.body[field] === "" ? null : req.body[field];
    });
    if (table === "usuarios") {
      if (!data.senha) delete data.senha;
      else data.senha = await bcrypt.hash(data.senha, 12);
    }
    const keys = Object.keys(data);
    if (!keys.length) return res.status(400).json({ erro: "Nenhum campo válido informado." });
    const set = keys.map(k => `\`${k}\` = ?`).join(", ");
    const [result] = await pool.execute(
      `UPDATE \`${table}\` SET ${set} WHERE \`${cfg.pk}\` = ?`,
      [...keys.map(k => data[k]), req.params.id]
    );
    res.json({ alterados: result.affectedRows, mensagem: "Registro atualizado." });
  } catch (e) {
    console.error(e);
    res.status(400).json({ erro: "Não foi possível atualizar. Confira os dados informados." });
  }
});

app.delete("/api/:table/:id", auth, async (req, res) => {
  const table = req.params.table, cfg = tableConfig[table];
  if (!cfg) return res.status(404).json({ erro: "Módulo não encontrado." });
  if (cfg.readOnly) return res.status(403).json({ erro: "Este módulo é somente leitura." });
  try {
    const [result] = await pool.execute(`DELETE FROM \`${table}\` WHERE \`${cfg.pk}\` = ?`, [req.params.id]);
    res.json({ excluidos: result.affectedRows, mensagem: "Registro excluído." });
  } catch (e) {
    res.status(409).json({ erro: "Este registro está relacionado a outros dados e não pode ser excluído. Considere desativá-lo." });
  }
});

app.get("*", (req, res) => res.sendFile(path.join(__dirname, "../frontend/index.html")));

app.listen(PORT, () => console.log(`Sistema disponível em http://localhost:${PORT}`));
