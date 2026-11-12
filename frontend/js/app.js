const $ = (s) => document.querySelector(s);
const moduleNames = {
  tutor:"Tutores", animais:"Animais", funcionarios:"Funcionários", usuarios:"Usuários",
  vacinas:"Vacinas", lote_vacinas:"Lotes de vacinas", aplicacoes:"Aplicações",
  estoque_vacinas:"Estoque de vacinas", agendamentos:"Agendamentos", despesas:"Despesas", logs:"Logs do sistema"
};
const fields = {
 tutor:[["nome","Nome","text",true],["cpf","CPF","text",true],["telefone","Telefone","tel",true],["email","E-mail","email"],["data_cadastro","Data de cadastro","datetime-local"]],
 animais:[["id_tutor","Tutor","select:tutores",true],["nome","Nome do animal","text",true],["especie","Espécie","text",true],["raca","Raça","text"],["sexo","Sexo","select:sexo"],["data_nascimento","Nascimento","date"],["peso","Peso (kg)","number"],["observacoes","Observações","textarea"],["ativo","Ativo","select:boolean"]],
 funcionarios:[["nome","Nome","text",true],["cpf","CPF","text",true],["telefone","Telefone","tel"],["email","E-mail","email"],["cargo","Cargo","text",true],["endereco","Endereço","text"],["ativo","Ativo","select:boolean"]],
 usuarios:[["id_funcionario","Funcionário","select:funcionarios",true],["login","Login","text",true],["senha","Senha (será protegida)","password"],["ativo","Ativo","select:boolean"]],
 vacinas:[["nome","Nome da vacina","text",true],["fabricante","Fabricante","text"],["especie_indicada","Espécie indicada","text"],["descricao","Descrição","textarea"],["intervalo_doses","Intervalo entre doses (dias)","number"],["ativo","Ativo","select:boolean"]],
 lote_vacinas:[["id_vacina","Vacina","select:vacinas",true],["codigo_lote","Código do lote","text",true],["data_validade","Validade","date",true],["quantidade_inicial","Quantidade inicial","number",true],["quantidade_atual","Quantidade atual","number",true]],
 aplicacoes:[["id_animal","Animal","select:animais",true],["id_vacina","Vacina","select:vacinas",true],["id_lote","Lote","select:lotes",true],["id_funcionario","Funcionário","select:funcionarios",true],["data_aplicacao","Data da aplicação","datetime-local",true],["numero_dose","Número da dose","number",true],["proxima_dose","Próxima dose","date"],["observacoes","Observações","textarea"]],
 estoque_vacinas:[["id_lote","Lote","select:lotes",true],["id_usuario","Usuário","select:usuarios",true],["quantidade","Quantidade","number",true],["motivo","Motivo","text"],["tipo","Tipo","select:tipo",true]],
 agendamentos:[["id_animal","Animal","select:animais",true],["id_vacina","Vacina","select:vacinas"],["id_funcionario","Funcionário","select:funcionarios"],["data_hora","Data e hora","datetime-local",true],["observacoes","Observações","textarea"],["status","Status","select:status"]],
 despesas:[["id_usuario","Usuário responsável","select:usuarios",true],["descricao","Descrição","text",true],["categoria","Categoria","text"],["valor","Valor (R$)","number",true],["data","Data","date",true],["forma_pagamento","Forma de pagamento","text"],["comprovante","Caminho do comprovante","text"]],
 logs:[["id_usuario","Usuário","number"],["acao","Ação","text"],["tabela_afetada","Tabela afetada","text"],["data_hora","Data e hora","text"]]
};
let currentPage = "dashboard", currentRows = [], editingId = null, optionData = {};

function toast(message) {
 const el=$("#toast"); el.textContent=message; el.classList.add("show");
 setTimeout(()=>el.classList.remove("show"),2600);
}
function escapeHtml(value) {
 return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function niceDate(value) {
 if (!value) return "—";
 return String(value).replace("T"," ").slice(0,16);
}
function labelFor(key) {
 const map={id_tutor:"Tutor",id_animal:"Animal",id_vacina:"Vacina",id_lote:"Lote",id_funcionario:"Funcionário",id_usuario:"Usuário",data_cadastro:"Cadastro",data_nascimento:"Nascimento",data_validade:"Validade",data_aplicacao:"Aplicação",proxima_dose:"Próxima dose",data_movimentacao:"Movimentação",data_hora:"Data e hora",quantidade_atual:"Quantidade",quantidade_inicial:"Qtd. inicial",numero_dose:"Dose",intervalo_doses:"Intervalo (dias)",especie_indicada:"Espécie indicada",tabela_afetada:"Tabela",forma_pagamento:"Pagamento"};
 return map[key] || key.replaceAll("_"," ").replace(/^\w/,c=>c.toUpperCase());
}
function displayValue(key, value) {
 if (value === null || value === undefined || value === "") return "—";
 if (key === "ativo") return Number(value) ? '<span class="pill">Ativo</span>' : '<span class="pill" style="background:#fbeaea;color:#c44">Inativo</span>';
 if (key === "senha") return "••••••••";
 if (key.startsWith("data") || key.endsWith("_dose") || key === "ultimo_acesso") return escapeHtml(niceDate(value));
 if (key === "valor") return Number(value).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
 return escapeHtml(value);
}
async function loadOptions() {
 try { optionData = await API.request("/options"); } catch { optionData = {}; }
}
function selectOptions(type) {
 const fixed={
  sexo:[["Macho","Macho"],["Femea","Fêmea"],["Nao informado","Não informado"]],
  boolean:[["1","Ativo"],["0","Inativo"]],
  tipo:[["Entrada","Entrada"],["Saida","Saída"],["Ajuste","Ajuste"]],
  status:[["Agendado","Agendado"],["Concluido","Concluído"],["Cancelado","Cancelado"]]
 };
 return fixed[type] || (optionData[type]||[]).map(x=>[x.id,x.label]);
}
function renderField(field, value="") {
 const [key,label,type,required]=field;
 const req=required?"required":"";
 let control="";
 if (type.startsWith("select:")) {
  const opts=selectOptions(type.split(":")[1]);
  control=`<select name="${key}" ${req}><option value="">Selecione...</option>${opts.map(([v,l])=>`<option value="${escapeHtml(v)}" ${String(value)===String(v)?"selected":""}>${escapeHtml(l)}</option>`).join("")}</select>`;
 } else if (type==="textarea") control=`<textarea name="${key}" ${req}>${escapeHtml(value)}</textarea>`;
 else {
  let v=value ?? "";
  if (type==="datetime-local" && v) v=String(v).replace(" ","T").slice(0,16);
  control=`<input name="${key}" type="${type}" value="${escapeHtml(v)}" ${req} ${type==="number"?'step="any" min="0"':""} ${key==="senha"?'autocomplete="new-password"':""}>`;
 }
 return `<label class="${type==="textarea"?"span-2":""}">${label}${control}</label>`;
}
function openModal(row=null) {
 editingId=row ? row[primaryKey(currentPage)] : null;
 $("#modalTitle").textContent=row?"Editar registro":"Novo registro";
 $("#formError").textContent="";
 $("#formFields").innerHTML=fields[currentPage].map(f=>renderField(f,row?.[f[0]] ?? "")).join("");
 if (currentPage==="usuarios" && row) {
  const pass=$("#formFields [name=senha]"); if(pass) pass.required=false;
 }
 $("#modal").classList.remove("hidden");
}
function closeModal(){ $("#modal").classList.add("hidden"); }
function primaryKey(table) {
 return {tutor:"id_tutor",animais:"id_animal",funcionarios:"id_funcionario",usuarios:"id_usuario",vacinas:"id_vacina",lote_vacinas:"id_lote",aplicacoes:"id_aplicacao",estoque_vacinas:"id_movimentacao",agendamentos:"id_agendamento",despesas:"id_despesa",logs:"id_log"}[table];
}
function renderTable(rows) {
 const keys=fields[currentPage].map(f=>f[0]);
 const cols=[...new Set([...keys,primaryKey(currentPage)])].filter(k=>k!=="senha");
 $("#tableContent").innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr>${cols.map(k=>`<th>${labelFor(k)}</th>`).join("")}<th>Ações</th></tr></thead><tbody>${rows.map(row=>`<tr>${cols.map(k=>`<td>${displayValue(k,row[k])}</td>`).join("")}<td><div class="actions">${currentPage==="logs"?"<span class='muted'>Somente leitura</span>":`<button class="small-btn" data-edit="${row[primaryKey(currentPage)]}">Editar</button><button class="small-btn danger" data-delete="${row[primaryKey(currentPage)]}">Excluir</button>`}</div></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">Nenhum registro encontrado.</div>`;
}
async function loadModule(q="") {
 const rows=await API.list(currentPage,q); currentRows=rows; renderTable(rows);
}
async function showModule(table) {
 currentPage=table;
 $("#pageTitle").textContent=moduleNames[table];
 $("#breadcrumb").textContent="GERENCIAMENTO";
 $("#pageContent").innerHTML=`<div class="page-head"><div><h3>${moduleNames[table]}</h3><p>Consulte e gerencie os registros cadastrados.</p></div>${table==="logs"?"":'<button class="btn primary" id="newRecord">＋ Novo registro</button>'}</div><div class="table-card"><div class="table-head"><h3>Registros cadastrados</h3><input id="searchInput" class="search" placeholder="Pesquisar..." aria-label="Pesquisar registros"></div><div id="tableContent"><div class="empty">Carregando...</div></div></div>`;
 if(table!=="logs") $("#newRecord").addEventListener("click",()=>openModal());
 $("#searchInput").addEventListener("input",e=>loadModule(e.target.value).catch(err=>toast(err.message)));
 await loadModule();
}
async function showDashboard() {
 currentPage="dashboard"; $("#pageTitle").textContent="Visão geral"; $("#breadcrumb").textContent="PAINEL";
 $("#pageContent").innerHTML=`<div class="welcome"><div><h3>Olá, ${escapeHtml((window.vetUser?.nome||"equipe").split(" ")[0])} 👋</h3><div class="muted">Aqui está o resumo da sua clínica.</div></div><span class="pill">Sistema conectado</span></div><div class="stats" id="stats"><div class="stat-card">Carregando indicadores...</div></div><div class="dashboard-grid"><div class="panel"><h3>Acesso rápido</h3><p>Abra diretamente os módulos mais utilizados.</p><div class="quick-grid">${[["animais","♡","Cadastrar animal"],["aplicacoes","✓","Registrar aplicação"],["agendamentos","▣","Ver agendamentos"],["estoque_vacinas","▥","Consultar estoque"]].map(([p,i,l])=>`<button class="quick-link" data-quick="${p}"><span>${i}</span>${l}</button>`).join("")}</div></div><div class="panel"><h3>Organização do sistema</h3><p>Os módulos estão conectados ao banco de dados MySQL por uma API Node.js.</p><p>Cadastre primeiro tutores, funcionários, vacinas e usuários. Depois registre animais, lotes e movimentações.</p></div></div>`;
 try {
  const d=await API.request("/dashboard");
  const cards=[["Tutores",d.tutores,"♙"],["Animais ativos",d.animais,"♡"],["Vacinas ativas",d.vacinas,"✚"],["Agendamentos pendentes",d.agendamentos,"▣"],["Doses em estoque",d.estoque,"▥"],["Despesas do mês",Number(d.despesas).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}),"＄"]];
  $("#stats").innerHTML=cards.map(([name,val,ico])=>`<div class="stat-card"><div class="stat-top">${name}<span class="stat-icon">${ico}</span></div><div class="stat-value">${val}</div><div class="stat-note">Dados atualizados do banco</div></div>`).join("");
 } catch(e) { $("#stats").innerHTML=`<div class="stat-card">${escapeHtml(e.message)}</div>`; }
}
async function navigate(page) {
 $("#sidebar").classList.remove("open");
 document.querySelectorAll(".nav-item[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
 if(page==="dashboard") return showDashboard();
 return showModule(page);
}
$("#loginForm").addEventListener("submit",async e=>{
 e.preventDefault(); $("#loginError").textContent="";
 const data=Object.fromEntries(new FormData(e.target).entries());
 try {
  const result=await API.login(data.login,data.senha);
  API.token=result.token; localStorage.setItem("vetcare_token",result.token);
  window.vetUser=result.usuario; startApp();
 } catch(err) { $("#loginError").textContent=err.message; }
});
function startApp() {
 $("#loginScreen").classList.add("hidden"); $("#appShell").classList.remove("hidden");
 $("#userName").textContent=window.vetUser?.nome||"Usuário"; $("#userRole").textContent=window.vetUser?.cargo||"Equipe";
 loadOptions().then(()=>showDashboard()).catch(()=>showDashboard());
}
$("#navigation").addEventListener("click",e=>{
 const b=e.target.closest("[data-page]"); if(b) navigate(b.dataset.page).catch(err=>toast(err.message));
});
$("#pageContent").addEventListener("click",async e=>{
 const quick=e.target.closest("[data-quick]"); if(quick) return navigate(quick.dataset.quick);
 const edit=e.target.closest("[data-edit]"); if(edit){const row=currentRows.find(r=>String(r[primaryKey(currentPage)])===edit.dataset.edit);if(row)openModal(row);}
 const del=e.target.closest("[data-delete]");
 if(del && confirm("Tem certeza de que deseja excluir este registro? Esta ação não poderá ser desfeita.")){
  try{await API.remove(currentPage,del.dataset.delete);toast("Registro excluído.");await loadOptions();await loadModule($("#searchInput")?.value||"");}
  catch(err){toast(err.message);}
 }
});
$("#recordForm").addEventListener("submit",async e=>{
 e.preventDefault(); $("#formError").textContent="";
 const data=Object.fromEntries(new FormData(e.target).entries());
 fields[currentPage].forEach(f=>{if(f[2]==="number" && data[f[0]]!=="")data[f[0]]=Number(data[f[0]]);});
 if(currentPage==="usuarios" && !data.senha) delete data.senha;
 try {
  if(editingId) await API.update(currentPage,editingId,data); else await API.create(currentPage,data);
  closeModal();toast("Registro salvo com sucesso.");await loadOptions();await loadModule($("#searchInput")?.value||"");
 } catch(err){$("#formError").textContent=err.message;}
});
$("#modalClose").onclick=closeModal;$("#cancelModal").onclick=closeModal;
$("#modal").addEventListener("click",e=>{if(e.target.dataset.close)closeModal();});
$("#themeToggle").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("vetcare_theme",document.body.classList.contains("dark")?"dark":"light");};
if(localStorage.getItem("vetcare_theme")==="dark")document.body.classList.add("dark");
$("#logoutBtn").onclick=()=>{API.logout();window.vetUser=null;$("#appShell").classList.add("hidden");$("#loginScreen").classList.remove("hidden");};
$("#menuToggle").onclick=()=>$("#sidebar").classList.toggle("open");
if(API.token) {
 // O token é validado ao consultar o painel; a sessão pode ser retomada durante sua validade.
 window.vetUser={nome:"Equipe",cargo:"Usuário"};
 startApp();
}
