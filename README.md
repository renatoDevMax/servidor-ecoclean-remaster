# Servidor Socket.io com NestJS

Um servidor Socket.io básico desenvolvido com NestJS, pronto para ser expandido com funcionalidades personalizadas.

## Requisitos

- Node.js (v14 ou superior)
- npm (v6 ou superior)

## Instalação

```bash
# Clonar o repositório
git clone [url-do-repositorio]

# Entrar no diretório
cd socket-server

# Instalar dependências
npm install
```

## Executando o servidor

```bash
# Modo de desenvolvimento
npm run start:dev

# Modo de produção
npm run build
npm run start:prod
```

O servidor estará disponível em [http://localhost:3000](http://localhost:3000).

## Funcionalidades

- Servidor HTTP básico com Express
- Integração com Socket.io
- Manipulação de eventos de conexão, desconexão
- Manipulação de mensagens personalizadas
- Suporte para broadcast

## Eventos Socket.io

### Eventos do Cliente para o Servidor

- `message`: Envia uma mensagem para o servidor
  ```javascript
  socket.emit('message', { text: 'Olá servidor!' });
  ```

- `broadcast`: Solicita que uma mensagem seja transmitida para todos os outros clientes
  ```javascript
  socket.emit('broadcast', { text: 'Mensagem para todos!' });
  ```

### Eventos do Servidor para o Cliente

- `response`: Resposta do servidor após receber uma mensagem
  ```javascript
  socket.on('response', (data) => {
    console.log(data);
  });
  ```

- `broadcast`: Mensagem transmitida pelo servidor (de outro cliente)
  ```javascript
  socket.on('broadcast', (data) => {
    console.log(data);
  });
  ```

- `broadcastSent`: Confirmação de que uma solicitação de broadcast foi processada
  ```javascript
  socket.on('broadcastSent', (data) => {
    console.log(data);
  });
  ```

## Estrutura do Projeto

```
socket-server/
├── node_modules/
├── public/              # Arquivos estáticos
│   └── index.html       # Página HTML de teste
├── src/
│   ├── gateways/
│   │   └── app.gateway.ts  # Gateway Socket.io
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts          # Ponto de entrada da aplicação
├── package.json
└── README.md
```

## Expandindo o Projeto

Para adicionar mais funcionalidades ao servidor Socket.io:

1. Crie novos métodos no arquivo `src/gateways/app.gateway.ts` decorados com `@SubscribeMessage('nome-do-evento')`
2. Implemente a lógica de negócios para manipular e responder aos eventos
3. Se necessário, crie novos módulos para organizar funcionalidades relacionadas

## Licença

Este projeto está licenciado sob a licença [MIT](LICENSE).
