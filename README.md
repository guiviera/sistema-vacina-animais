# VetCare — sistema de vacinação veterinária

Projeto inicial com frontend em HTML/CSS/JavaScript puro, backend Node.js + Express e banco MySQL.

## 1. Requisitos
- Node.js LTS instalado
- MySQL Server instalado e em execução
- MySQL Workbench (opcional, recomendado)

## 2. Banco de dados
Execute no MySQL Workbench o SQL das 11 tabelas que foi preparado para o projeto anteriormente. O nome esperado é `sistema_vacinacao_pet`.

## 3. Configuração
Na pasta principal do projeto:
1. Duplique `.env.example` e renomeie a cópia para `.env`.
2. Preencha usuário, senha e dados de conexão do MySQL.
3. Defina `JWT_SECRET` com uma chave aleatória longa (pelo menos 32 caracteres).

## 4. Instalar e executar
Abra o terminal na pasta do projeto e execute:

```bash
npm install
npm start
```

Acesse `http://localhost:3000`.

Para desenvolvimento com reinicialização automática:
```bash
npm install --save-dev nodemon
npm run dev
```

## 5. Primeiro acesso e cadastro
1. Inicie o projeto com `npm start`.
2. Abra `http://localhost:3000/cadastro.html`.
3. Preencha os dados do responsável, escolha um cargo, login e senha (mínimo de 8 caracteres).
4. O sistema cadastra o funcionário e o usuário em uma transação e protege a senha com bcrypt.
5. Depois, acesse `http://localhost:3000` e entre com o login e a senha que acabou de criar.

**Segurança:** a página de cadastro é de uso inicial e só cria a primeira conta, enquanto a tabela `usuarios` estiver vazia. Depois disso, o endpoint público bloqueia novos cadastros. Novos acessos devem ser criados por um administrador dentro do sistema.

## 6. O que já está incluído
- Tela de login
- Dashboard com indicadores reais
- Navegação pelos 11 módulos
- Listagem, pesquisa, cadastro e edição genéricos
- Exclusão com confirmação
- Tema claro/escuro
- API REST no Express
- Consultas parametrizadas e validação de tabelas/campos permitidos
- Senhas com bcrypt e autenticação JWT

## 7. Pontos que precisam ser finalizados antes de uso real
Este é um ponto de partida funcional, não um sistema pronto para operação de uma clínica.
- Ajustar permissões por cargo; atualmente a autenticação identifica o funcionário, mas não aplica uma matriz completa de permissões.
- Implementar baixa de estoque transacional ao registrar aplicação e validar saldo/validade do lote.
- Impedir movimentações inconsistentes e registrar automaticamente logs de auditoria.
- Melhorar exclusão lógica para cadastros que precisam preservar histórico.
- Adicionar validações de CPF, datas, campos obrigatórios e regras de negócio no backend.
- Implementar upload seguro de comprovantes.
- Implementar paginação e relatórios.
- Proteger segredos, configurar HTTPS e revisar segurança antes de publicar na internet.

**Atenção:** não exponha o servidor diretamente à internet sem concluir essas etapas.
