import { Injectable, Logger } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import { Socket } from 'socket.io';

@Injectable()
export class WhatsappService {
  private client: Client;
  private isAuthenticated = false;
  private socket: Socket;
  private readonly logger = new Logger(WhatsappService.name);

  constructor() {
    this.logger.log('Iniciando cliente WhatsApp...');
    try {
      this.client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ],
          headless: true
        }
      });
      this.logger.log('Cliente WhatsApp criado com sucesso');
    } catch (error) {
      this.logger.error('Erro ao criar cliente WhatsApp:', error);
      throw error;
    }

    this.client.on('qr', (qr) => {
      this.logger.log('QR Code do WhatsApp recebido');
      if (this.socket) {
        this.logger.log('Enviando QR Code para o cliente...');
        this.socket.emit('whatsapp-qr', { qr });
      } else {
        this.logger.warn('Socket não configurado para enviar QR Code');
      }
    });

    this.client.on('ready', () => {
      this.logger.log('Cliente WhatsApp inicializado e pronto para uso!');
      this.isAuthenticated = true;
      if (this.socket) {
        this.logger.log('Enviando status de autenticação para o cliente...');
        this.socket.emit('whatsapp-status', { isAuthenticated: true });
      } else {
        this.logger.warn('Socket não configurado para enviar status de autenticação');
      }
    });

    this.client.on('disconnected', (reason) => {
      this.logger.warn(`Cliente WhatsApp desconectado. Razão: ${reason}`);
      this.isAuthenticated = false;
      if (this.socket) {
        this.logger.log('Enviando status de desconexão para o cliente...');
        this.socket.emit('whatsapp-status', { isAuthenticated: false });
      } else {
        this.logger.warn('Socket não configurado para enviar status de desconexão');
      }
    });

    this.client.on('auth_failure', (msg) => {
      this.logger.error(`Falha na autenticação do WhatsApp: ${msg}`);
      this.isAuthenticated = false;
      if (this.socket) {
        this.socket.emit('whatsapp-status', { isAuthenticated: false, error: msg });
      }
    });

    this.client.on('loading_screen', (percent, message) => {
      this.logger.log(`Carregando WhatsApp: ${percent}% - ${message}`);
    });
  }

  public setSocket(socket: Socket) {
    this.logger.log('Configurando socket para o serviço WhatsApp...');
    this.socket = socket;
    this.logger.log('Socket configurado com sucesso');
  }

  public async initialize() {
    try {
      this.logger.log('Iniciando processo de inicialização do WhatsApp...');
      this.logger.log('Verificando estado atual do cliente...');
      this.logger.log(`Estado de autenticação atual: ${this.isAuthenticated ? 'Autenticado' : 'Não autenticado'}`);
      
      await this.client.initialize();
      this.logger.log('Cliente WhatsApp inicializado com sucesso');
      this.isAuthenticated = true;
      
      if (this.socket) {
        this.socket.emit('whatsapp-status', { isAuthenticated: true });
      }
    } catch (error) {
      this.logger.error('Erro ao inicializar WhatsApp:', error);
      this.logger.error('Stack trace do erro:', error.stack);
      if (this.socket) {
        this.socket.emit('whatsapp-status', { 
          isAuthenticated: false, 
          error: error.message 
        });
      }
      throw error;
    }
  }

  public isWhatsappAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  public async forcarGeracaoQRCode(): Promise<void> {
    this.logger.log('Forçando geração de novo QR code...');
    
    try {
      // Desconectar independentemente do status atual para garantir nova autenticação
      this.logger.log('Desconectando sessão atual do WhatsApp para gerar novo QR code...');
      // Usar logout para fechar a sessão atual, mas não apagar os dados de autenticação
      await this.client.logout();
      this.isAuthenticated = false;
      
      // Aguarda um pouco para garantir que a desconexão seja concluída
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reinicializa o cliente para gerar um novo QR code
      this.logger.log('Reinicializando cliente WhatsApp para gerar novo QR code...');
      await this.client.initialize();
    } catch (error) {
      this.logger.error('Erro ao forçar geração de QR code:', error);
      if (this.socket) {
        this.socket.emit('whatsapp-status', {
          isAuthenticated: false,
          error: 'Falha ao gerar QR code: ' + error.message
        });
      }
      throw error;
    }
  }

  /**
   * Formata um número de contato para o formato esperado pelo WhatsApp e envia uma mensagem
   * @param contato Número de telefone do contato
   * @param mensagem Texto da mensagem a ser enviada
   * @returns Resultado do envio da mensagem ou null se houver erro
   */
  public async enviarMensagem(contato: string, mensagem: string): Promise<any | null> {
    try {
      // Verificar se os dois primeiros caracteres são números
      const doisPrimeirosCaracteres = contato.substring(0, 2);
      
      if (!/^\d+$/.test(doisPrimeirosCaracteres)) {
        this.logger.warn(`Não foi possível enviar a mensagem para ${contato}: Os dois primeiros caracteres não são números`);
        return null;
      }
      
      // Adicionar "55" se necessário
      let contatoFormatado = contato;
      if (doisPrimeirosCaracteres !== "55") {
        contatoFormatado = "55" + contato;
        this.logger.log(`Prefixo "55" adicionado ao contato: ${contatoFormatado}`);
      }
      
      // Adicionar sufixo "@c.us"
      if (!contatoFormatado.endsWith("@c.us")) {
        contatoFormatado = contatoFormatado + "@c.us";
      }
      
      this.logger.log(`Enviando mensagem para ${contatoFormatado}`);
      
      // Verificar se o cliente está autenticado
      if (!this.isAuthenticated) {
        this.logger.error('Cliente WhatsApp não está autenticado. Impossível enviar mensagem.');
        return null;
      }
      
      // Enviar mensagem usando o cliente WhatsApp
      const resultado = await this.client.sendMessage(contatoFormatado, mensagem);
      this.logger.log(`Mensagem enviada com sucesso para ${contatoFormatado}`);
      
      return resultado;
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem para ${contato}:`, error);
      return null;
    }
  }
} 