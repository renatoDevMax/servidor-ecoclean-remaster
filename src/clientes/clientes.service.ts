import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cliente } from '../database/schemas/cliente.schema';
import { clientesTipo } from '../types/clientesType';

@Injectable()
export class ClientesService {
  constructor(
    @InjectModel('Cliente') private readonly clienteModel: Model<Cliente>,
  ) {}

  async buscarTodosClientes(): Promise<clientesTipo[]> {
    // Retorna todos os clientes da coleção Clientes
    const clientes = await this.clienteModel.find().exec();
    return clientes.map(cliente => this.converterParaClienteTipo(cliente));
  }
  
  /**
   * Busca um cliente pelo nome
   * @param nome Nome do cliente a ser buscado
   * @returns O cliente encontrado ou null se não encontrado
   */
  async buscarClientePorNome(nome: string): Promise<clientesTipo | null> {
    const cliente = await this.clienteModel.findOne({ nome }).exec();
    if (!cliente) {
      return null;
    }
    return this.converterParaClienteTipo(cliente);
  }
  
  /**
   * Cria um novo cliente no banco de dados
   * @param clienteData Dados do cliente a ser criado
   * @returns O cliente criado
   */
  async criarCliente(clienteData: clientesTipo): Promise<clientesTipo> {
    const novoCliente = new this.clienteModel(clienteData);
    const clienteSalvo = await novoCliente.save();
    return this.converterParaClienteTipo(clienteSalvo);
  }
  
  /**
   * Atualiza um cliente existente pelo ID
   * @param id ID do cliente a ser atualizado
   * @param clienteData Dados atualizados do cliente
   * @returns O cliente atualizado ou null se não encontrado
   */
  async atualizarCliente(id: string, clienteData: clientesTipo): Promise<clientesTipo | null> {
    // Remove o campo id do objeto de atualização, se existir
    if (clienteData.id) {
      delete clienteData.id;
    }
    
    const clienteAtualizado = await this.clienteModel.findByIdAndUpdate(
      id,
      clienteData,
      { new: true } // Retorna o documento atualizado
    ).exec();
    
    if (!clienteAtualizado) {
      return null;
    }
    
    return this.converterParaClienteTipo(clienteAtualizado);
  }
  
  /**
   * Atualiza um cliente existente pelo nome ou cria um novo se não existir
   * @param clienteData Dados do cliente a ser atualizado ou criado
   * @returns O cliente atualizado ou criado
   */
  async atualizarOuCriarClientePorNome(clienteData: clientesTipo): Promise<clientesTipo> {
    // Busca cliente pelo nome
    const clienteExistente = await this.clienteModel.findOne({ nome: clienteData.nome }).exec();
    
    if (clienteExistente) {
      // Se encontrou o cliente, atualiza
      // Remove o campo id do objeto de atualização, se existir
      if (clienteData.id) {
        delete clienteData.id;
      }
      
      const clienteAtualizado = await this.clienteModel.findByIdAndUpdate(
        clienteExistente._id,
        clienteData,
        { new: true } // Retorna o documento atualizado
      ).exec();
      
      if (!clienteAtualizado) {
        // Caso improvável mas possível
        return this.criarCliente(clienteData);
      }
      
      return this.converterParaClienteTipo(clienteAtualizado);
    } else {
      // Se não encontrou, cria um novo cliente
      return this.criarCliente(clienteData);
    }
  }
  
  /**
   * Converte um documento Mongoose para o tipo clientesTipo
   */
  private converterParaClienteTipo(cliente: Cliente): clientesTipo {
    const clienteObj = cliente.toObject();
    
    // Converte o _id do MongoDB para o campo id
    if (clienteObj._id) {
      clienteObj.id = clienteObj._id.toString();
      delete clienteObj._id;
    }
    
    // Remove campos internos do Mongoose
    delete clienteObj.__v;
    
    return clienteObj as clientesTipo;
  }
} 