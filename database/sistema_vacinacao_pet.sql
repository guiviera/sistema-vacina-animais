CREATE DATABASE sistema_vacinacao_pet;

USE sistema_vacinacao_pet;



CREATE TABLE tutor (
    id_tutor INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE animais (
    id_animal INT AUTO_INCREMENT PRIMARY KEY,
    id_tutor INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    raca VARCHAR(60),
    sexo ENUM('Macho', 'Femea', 'Nao informado'),
    data_nascimento DATE,
    peso DECIMAL(6,2),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (id_tutor) REFERENCES tutor(id_tutor)
);


CREATE TABLE funcionarios (
    id_funcionario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    cargo VARCHAR(60) NOT NULL,
    endereco VARCHAR(200),
    ativo BOOLEAN DEFAULT TRUE
);



CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    id_funcionario INT NOT NULL UNIQUE,
    login VARCHAR(50) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    ultimo_acesso DATETIME,

    FOREIGN KEY (id_funcionario) REFERENCES funcionarios(id_funcionario)
);



CREATE TABLE vacinas (
    id_vacina INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    fabricante VARCHAR(100),
    especie_indicada VARCHAR(100),
    descricao TEXT,
    intervalo_doses INT,
    ativo BOOLEAN DEFAULT TRUE
);


CREATE TABLE lote_vacinas (
    id_lote INT AUTO_INCREMENT PRIMARY KEY,
    id_vacina INT NOT NULL,
    codigo_lote VARCHAR(50) NOT NULL,
    data_validade DATE NOT NULL,
    quantidade_inicial INT NOT NULL,
    quantidade_atual INT NOT NULL,

    UNIQUE (id_vacina, codigo_lote),

    FOREIGN KEY (id_vacina) REFERENCES vacinas(id_vacina)
);


CREATE TABLE aplicacoes (
    id_aplicacao INT AUTO_INCREMENT PRIMARY KEY,
    id_animal INT NOT NULL,
    id_vacina INT NOT NULL,
    id_lote INT NOT NULL,
    id_funcionario INT NOT NULL,
    data_aplicacao DATETIME NOT NULL,
    numero_dose INT NOT NULL,
    proxima_dose DATE,
    observacoes TEXT,

    FOREIGN KEY (id_animal) REFERENCES animais(id_animal),
    FOREIGN KEY (id_vacina) REFERENCES vacinas(id_vacina),
    FOREIGN KEY (id_lote) REFERENCES lote_vacinas(id_lote),
    FOREIGN KEY (id_funcionario) REFERENCES funcionarios(id_funcionario)
);



CREATE TABLE estoque_vacinas (
    id_movimentacao INT AUTO_INCREMENT PRIMARY KEY,
    id_lote INT NOT NULL,
    id_usuario INT NOT NULL,
    quantidade INT NOT NULL,
    data_movimentacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    motivo VARCHAR(200),
    tipo ENUM('Entrada', 'Saida', 'Ajuste') NOT NULL,

    FOREIGN KEY (id_lote) REFERENCES lote_vacinas(id_lote),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);



CREATE TABLE agendamentos (
    id_agendamento INT AUTO_INCREMENT PRIMARY KEY,
    id_animal INT NOT NULL,
    id_vacina INT,
    id_funcionario INT,
    data_hora DATETIME NOT NULL,
    observacoes TEXT,
    status ENUM('Agendado', 'Concluido', 'Cancelado')
        DEFAULT 'Agendado',

    FOREIGN KEY (id_animal) REFERENCES animais(id_animal),
    FOREIGN KEY (id_vacina) REFERENCES vacinas(id_vacina),
    FOREIGN KEY (id_funcionario) REFERENCES funcionarios(id_funcionario)
);


CREATE TABLE despesas (
    id_despesa INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    descricao VARCHAR(200) NOT NULL,
    categoria VARCHAR(60),
    valor DECIMAL(10,2) NOT NULL,
    data DATE NOT NULL,
    forma_pagamento VARCHAR(50),
    comprovante VARCHAR(255),

    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);


CREATE TABLE logs (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    acao VARCHAR(100) NOT NULL,
    tabela_afetada VARCHAR(60),
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
