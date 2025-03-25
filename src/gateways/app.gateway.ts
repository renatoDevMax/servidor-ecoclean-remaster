import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect, 
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Logger, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { EntregasService } from '../entregas/entregas.service';
import { ClientesService } from '../clientes/clientes.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { entregasTipo } from '../types/entregaType';
import { clientesTipo } from '../types/clientesType';
import { usuariosTipo } from '../types/userTypes';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('AppGateway');

  constructor(
    private readonly entregasService: EntregasService,
    private readonly clientesService: ClientesService,
    private readonly usuariosService: UsuariosService,
    private readonly whatsappService: WhatsappService
  ) {}

  afterInit(server: Server) {
    this.logger.log('Servidor Socket.io inicializado');
    
    // Inicializa o WhatsApp automaticamente ao iniciar o servidor
    this.logger.log('Inicializando cliente WhatsApp automaticamente...');
    this.whatsappService.initialize()
      .then(() => {
        this.logger.log('Cliente WhatsApp inicializado com sucesso ao iniciar servidor');
      })
      .catch((error) => {
        this.logger.error('Erro ao inicializar WhatsApp na inicialização do servidor:', error);
      });
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('whatsapp-login')
  async handleWhatsappLogin(
    @ConnectedSocket() client: Socket
  ) {
    this.logger.log('Solicitação de login do WhatsApp recebida');
    
    if (this.whatsappService.isWhatsappAuthenticated()) {
      client.emit('whatsapp-status', { isAuthenticated: true });
      return;
    }

    this.whatsappService.setSocket(client);
    await this.whatsappService.initialize();
  }

  @SubscribeMessage('verificar-whatsapp-status')
  handleVerificarWhatsappStatus(
    @ConnectedSocket() client: Socket
  ) {
    this.logger.log('Solicitação de verificação do status do WhatsApp recebida');
    
    // Verificar o status atual de autenticação
    const isAuthenticated = this.whatsappService.isWhatsappAuthenticated();
    this.logger.log(`Status atual do WhatsApp: ${isAuthenticated ? 'Autenticado' : 'Não autenticado'}`);
    
    // Configura o socket para comunicações futuras
    this.whatsappService.setSocket(client);
    
    // Envia o status atual para o cliente
    client.emit('whatsapp-status', { isAuthenticated });
    
    // Se não estiver autenticado, solicitar geração de QR code
    if (!isAuthenticated) {
      this.logger.log('Cliente não autenticado, solicitando geração de QR code');
      this.whatsappService.forcarGeracaoQRCode()
        .catch(error => {
          this.logger.error('Erro ao gerar QR code:', error);
        });
    }
  }

  @SubscribeMessage('forcar-whatsapp-qr')
  async handleForcarWhatsappQR(
    @ConnectedSocket() client: Socket
  ) {
    this.logger.log('Solicitação para forçar geração de QR code do WhatsApp recebida');
    
    // Configura o socket para receber o QR code
    this.whatsappService.setSocket(client);
    
    // Solicita a geração de um novo QR code
    await this.whatsappService.forcarGeracaoQRCode();
  }

  @SubscribeMessage('Enviar Mensagem')
  async handleEnviarMensagem(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { contato: string, mensagem: string }
  ) {
    this.logger.log(`Solicitação para enviar mensagem recebida: ${JSON.stringify(payload)}`);
    
    // Verificar se o payload é válido
    if (!payload || !payload.contato || !payload.mensagem) {
      this.logger.error('Payload inválido para envio de mensagem');
      client.emit('Enviar Mensagem Resposta', {
        success: false,
        error: 'Payload inválido. Os campos "contato" e "mensagem" são obrigatórios.'
      });
      return;
    }
    
    // Verificar se o WhatsApp está autenticado
    if (!this.whatsappService.isWhatsappAuthenticated()) {
      this.logger.error('Tentativa de enviar mensagem sem o WhatsApp estar autenticado');
      client.emit('Enviar Mensagem Resposta', {
        success: false,
        error: 'O WhatsApp não está autenticado. Faça login primeiro.'
      });
      return;
    }
    
    try {
      // Enviar a mensagem usando o serviço de WhatsApp
      const resultado = await this.whatsappService.enviarMensagem(payload.contato, payload.mensagem);
      
      if (resultado) {
        client.emit('Enviar Mensagem Resposta', {
          success: true,
          message: 'Mensagem enviada com sucesso',
          result: resultado
        });
      } else {
        client.emit('Enviar Mensagem Resposta', {
          success: false,
          error: 'Não foi possível enviar a mensagem, verifique o formato do contato.'
        });
      }
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem: ${error.message}`);
      client.emit('Enviar Mensagem Resposta', {
        success: false,
        error: `Erro ao enviar mensagem: ${error.message}`
      });
    }
  }

  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ): void {
    this.logger.log(`Mensagem recebida do cliente ${client.id}: ${JSON.stringify(payload)}`);
    
    // Responde ao cliente que enviou a mensagem
    client.emit('response', {
      status: 'ok',
      message: 'Mensagem recebida com sucesso',
      timestamp: new Date().toISOString(),
      receivedData: payload
    });
  }

  @SubscribeMessage('broadcast')
  handleBroadcast(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ): void {
    this.logger.log(`Transmissão solicitada pelo cliente ${client.id}: ${JSON.stringify(payload)}`);
    
    // Transmite para todos os clientes (exceto o remetente)
    client.broadcast.emit('broadcast', {
      from: client.id,
      timestamp: new Date().toISOString(),
      data: payload
    });
    
    // Confirma para o remetente
    client.emit('broadcastSent', {
      success: true,
      timestamp: new Date().toISOString()
    });
  }

  @SubscribeMessage('Entregas do Dia')
  async handleEntregasDoDia(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ): Promise<void> {
    this.logger.log(`Solicitação de entregas do dia recebida do cliente ${client.id}`);
    
    try {
      // Busca as entregas do dia atual no banco de dados
      const entregasDoDia = await this.entregasService.buscarEntregasDoDia();
      
      // Responde ao cliente com a lista de entregas do dia
      client.emit('Entregas do Dia', entregasDoDia);
      
      this.logger.log(`Enviado ${entregasDoDia.length} entregas do dia para o cliente ${client.id}`);
    } catch (error) {
      this.logger.error(`Erro ao buscar entregas do dia: ${error.message}`);
      
      // Informa o cliente sobre o erro
      client.emit('error', {
        message: 'Erro ao buscar entregas do dia',
        timestamp: new Date().toISOString()
      });
    }
  }

  @SubscribeMessage('Buscar Clientes')
  async handleBuscarClientes(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ): Promise<void> {
    this.logger.log(`Solicitação de lista de clientes recebida do cliente ${client.id}`);
    
    try {
      // Busca todos os clientes no banco de dados
      const clientes = await this.clientesService.buscarTodosClientes();
      
      // Responde ao cliente com a lista de clientes
      client.emit('Buscar Clientes', clientes);
      
      this.logger.log(`Enviado ${clientes.length} clientes para o cliente ${client.id}`);
    } catch (error) {
      this.logger.error(`Erro ao buscar clientes: ${error.message}`);
      
      // Informa o cliente sobre o erro
      client.emit('error', {
        message: 'Erro ao buscar clientes',
        timestamp: new Date().toISOString()
      });
    }
  }

  @SubscribeMessage('Buscar Usuarios')
  async handleBuscarUsuarios(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ): Promise<void> {
    this.logger.log(`Solicitação de lista de usuários recebida do cliente ${client.id}`);
    
    try {
      // Busca todos os usuários no banco de dados
      const usuarios = await this.usuariosService.buscarTodosUsuarios();
      
      // Responde ao cliente com a lista de usuários
      client.emit('Buscar Usuarios', usuarios);
      
      this.logger.log(`Enviado ${usuarios.length} usuários para o cliente ${client.id}`);
    } catch (error) {
      this.logger.error(`Erro ao buscar usuários: ${error.message}`);
      
      // Informa o cliente sobre o erro
      client.emit('error', {
        message: 'Erro ao buscar usuários',
        timestamp: new Date().toISOString()
      });
    }
  }

  @SubscribeMessage('Adicionar Entrega')
  async handleAdicionarEntrega(
    @ConnectedSocket() client: Socket,
    @MessageBody() entregaData: entregasTipo,
  ): Promise<void> {
    this.logger.log(`Solicitação para adicionar nova entrega recebida do cliente ${client.id}`);
    
    try {
      // Adiciona a entrega no banco de dados
      const novaEntrega = await this.entregasService.criarEntrega(entregaData);
      
      this.logger.log(`Entrega adicionada com sucesso: ${novaEntrega.id}`);
      
      // Busca todas as entregas do dia atual
      const entregasDoDia = await this.entregasService.buscarEntregasDoDia();
      
      // Emite as entregas atualizadas para TODOS os clientes conectados
      this.server.emit('Entregas do Dia', entregasDoDia);
      
      this.logger.log(`Enviado ${entregasDoDia.length} entregas atualizadas para todos os clientes`);
    } catch (error) {
      this.logger.error(`Erro ao adicionar entrega: ${error.message}`);
      
      // Informa o cliente sobre o erro
      client.emit('error', {
        message: 'Erro ao adicionar entrega',
        detalhes: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  @SubscribeMessage('Atualizar Entrega')
  async handleAtualizarEntrega(
    @ConnectedSocket() client: Socket,
    @MessageBody() entregaData: entregasTipo,
  ): Promise<void> {
    this.logger.log(`Solicitação para atualizar entrega recebida do cliente ${client.id}`);
    
    try {
      // Verifica se o ID da entrega foi fornecido
      if (!entregaData.id) {
        throw new Error('ID da entrega não fornecido. Impossível atualizar.');
      }
      
      const id = entregaData.id;
      this.logger.log(`Atualizando entrega com ID: ${id}`);
      
      // Atualiza a entrega no banco de dados
      const entregaAtualizada = await this.entregasService.atualizarEntrega(id, entregaData);
      
      // Verifica se a entrega foi encontrada e atualizada
      if (!entregaAtualizada) {
        throw new Error(`Entrega com ID ${id} não encontrada`);
      }
      
      this.logger.log(`Entrega atualizada com sucesso: ${id}`);
      
      // Busca todas as entregas do dia atual
      const entregasDoDia = await this.entregasService.buscarEntregasDoDia();
      
      // Emite as entregas atualizadas para TODOS os clientes conectados
      this.server.emit('Entregas do Dia', entregasDoDia);
      
      this.logger.log(`Enviado ${entregasDoDia.length} entregas atualizadas para todos os clientes`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar entrega: ${error.message}`);
      
      // Informa o cliente sobre o erro
      client.emit('error', {
        message: 'Erro ao atualizar entrega',
        detalhes: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  @SubscribeMessage('Atualizar Cliente')
  async handleAtualizarCliente(
    @ConnectedSocket() client: Socket,
    @MessageBody() clienteData: clientesTipo,
  ): Promise<void> {
    this.logger.log(`Solicitação para atualizar/criar cliente recebida do cliente ${client.id}`);
    
    try {
      // Verifica se o nome do cliente foi fornecido
      if (!clienteData.nome) {
        throw new Error('Nome do cliente não fornecido. Impossível atualizar/criar.');
      }
      
      this.logger.log(`Buscando cliente com nome: ${clienteData.nome}`);
      
      // Atualiza ou cria o cliente no banco de dados
      const clienteAtualizado = await this.clientesService.atualizarOuCriarClientePorNome(clienteData);
      
      if (!clienteAtualizado) {
        throw new Error(`Falha ao atualizar/criar cliente: ${clienteData.nome}`);
      }
      
      this.logger.log(`Cliente ${clienteData.nome} ${clienteAtualizado.id ? 'atualizado' : 'criado'} com sucesso`);
      
      // Busca todos os clientes para retornar ao cliente
      const todosClientes = await this.clientesService.buscarTodosClientes();
      
      // Envia a lista atualizada de clientes para o cliente que fez a solicitação
      client.emit('Atualizar Cliente', todosClientes);
      
      this.logger.log(`Enviado ${todosClientes.length} clientes para o cliente ${client.id}`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar/criar cliente: ${error.message}`);
      
      // Informa o cliente sobre o erro
      client.emit('error', {
        message: 'Erro ao atualizar/criar cliente',
        detalhes: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  @SubscribeMessage('Autenticar Usuario')
  async handleAutenticarUsuario(
    @ConnectedSocket() client: Socket,
    @MessageBody() credenciais: { userName: string; senha: string },
  ): Promise<void> {
    this.logger.log(`Solicitação de autenticação para usuário: ${credenciais.userName}`);
    
    try {
      // Verifica se o userName foi fornecido
      if (!credenciais.userName) {
        throw new Error('Nome de usuário não fornecido');
      }
      
      // Tenta autenticar o usuário apenas com o userName
      const usuarioAutenticado = await this.usuariosService.autenticarUsuario(
        credenciais.userName
      );
      
      if (usuarioAutenticado) {
        // Autenticação bem-sucedida
        this.logger.log(`Usuário autenticado com sucesso: ${credenciais.userName}`);
        
        // Retorna o objeto usuarioTipo completo
        client.emit('Autenticar Usuario', usuarioAutenticado);
      } else {
        // Autenticação falhou
        this.logger.warn(`Falha na autenticação para: ${credenciais.userName}`);
        
        // Retorna mensagem de erro
        client.emit('Autenticar Usuario', { 
          mensagemServer: "Não foi possível identificar o usuário" 
        });
      }
    } catch (error) {
      // Erro durante a autenticação
      this.logger.error(`Erro ao autenticar usuário: ${error.message}`);
      
      // Retorna mensagem de erro
      client.emit('Autenticar Usuario', { 
        mensagemServer: `Erro: ${error.message}` 
      });
    }
  }

  @SubscribeMessage('Localizar Entregador')
  async handleLocalizarEntregador(
    @ConnectedSocket() client: Socket,
    @MessageBody() usuarioData: usuariosTipo,
  ): Promise<void> {
    this.logger.log(`Solicitação para atualizar localização do entregador: ${usuarioData.userName}`);
    
    try {
      // Verificar se o userName foi fornecido
      if (!usuarioData.userName) {
        throw new Error('Nome de usuário não fornecido. Impossível atualizar.');
      }
      
      // Atualizar o usuário no banco de dados
      const usuarioAtualizado = await this.usuariosService.atualizarUsuarioPorUserName(usuarioData);
      
      if (!usuarioAtualizado) {
        throw new Error(`Usuário com userName ${usuarioData.userName} não encontrado.`);
      }
      
      // Emitir no console a mensagem solicitada
      console.log(`Usuario atualizado. Usuario: ${usuarioData.userName}`);
      this.logger.log(`Usuario atualizado. Usuario: ${usuarioData.userName}`);
      
      // Buscar todos os usuários para enviar via evento
      const todosUsuarios = await this.usuariosService.buscarTodosUsuarios();
      
      // Emitir evento para todos os clientes conectados
      this.server.emit('Atualizando todos entregadores', todosUsuarios);
      
      this.logger.log(`Enviado ${todosUsuarios.length} usuários para todos os clientes.`);
    } catch (error) {
      this.logger.error(`Erro ao atualizar entregador: ${error.message}`);
      
      // Informa o cliente sobre o erro
      client.emit('error', {
        message: 'Erro ao atualizar entregador',
        detalhes: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  @SubscribeMessage('Relatorio Entregas')
  async handleRelatorioEntregas(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ): Promise<void> {
    this.logger.log(`Solicitação de relatório completo de entregas recebida do cliente ${client.id}`);
    
    try {
      // Busca todas as entregas no banco de dados
      const todasEntregas = await this.entregasService.buscarTodasEntregas();
      
      // Responde ao cliente com a lista completa de entregas
      client.emit('Relatorio Entregas', todasEntregas);
      
      this.logger.log(`Enviado relatório com ${todasEntregas.length} entregas para o cliente ${client.id}`);
    } catch (error) {
      this.logger.error(`Erro ao buscar relatório de entregas: ${error.message}`);
      
      // Informa o cliente sobre o erro
      client.emit('error', {
        message: 'Erro ao buscar relatório de entregas',
        detalhes: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
} 