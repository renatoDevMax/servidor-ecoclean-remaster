# Servidor EcoClean Remaster

API de serviço para o aplicativo EcoClean, utilizando Socket.io e NestJS.

## Descrição

Este servidor fornece uma API em tempo real usando Socket.io para gerenciar entregas, clientes, usuários e integração com WhatsApp.

## Funcionalidades

- Gerenciamento de entregas
- Gerenciamento de clientes
- Autenticação de usuários
- Integração com WhatsApp para envio de mensagens
- Painel web para administração

## Tecnologias Utilizadas

- NestJS
- Socket.io
- MongoDB com Mongoose
- WhatsApp Web.js

## Pré-requisitos

- Node.js v18+
- MongoDB
- Puppeteer (para a integração com WhatsApp)

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/renatoDevMax/servidor-ecoclean-remaster.git
cd servidor-ecoclean-remaster
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas credenciais
```

4. Execute o servidor em modo de desenvolvimento:
```bash
npm run start:dev
```

## Deploy

### Deploy no Railway

1. Certifique-se de ter uma conta no [Railway](https://railway.app/)
2. Conecte sua conta do GitHub ao Railway
3. Crie um novo projeto a partir do repositório GitHub
4. Configure as variáveis de ambiente no Railway
5. A plataforma fará o deploy automaticamente

## Endpoints Socket.io

- `Entregas do Dia`: Busca as entregas do dia atual
- `Relatorio Entregas`: Busca todas as entregas do banco de dados
- `Buscar Clientes`: Busca todos os clientes cadastrados
- `Buscar Usuarios`: Busca todos os usuários cadastrados
- `Adicionar Entrega`: Adiciona uma nova entrega
- `Atualizar Entrega`: Atualiza uma entrega existente
- `Atualizar Cliente`: Atualiza ou cria um cliente
- `Autenticar Usuario`: Autentica um usuário
- `Localizar Entregador`: Atualiza a localização de um entregador
- `Enviar Mensagem`: Envia uma mensagem via WhatsApp

## Licença

Este projeto está licenciado sob a licença MIT.
