import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Entrega } from '../database/schemas/entrega.schema';
import { entregasTipo } from '../types/entregaType';

@Injectable()
export class EntregasService {
  private readonly logger = new Logger(EntregasService.name);

  constructor(
    @InjectModel('Entrega') private readonly entregaModel: Model<Entrega>,
  ) {}

  async buscarEntregasDoDia(): Promise<entregasTipo[]> {
    const dataAtual = new Date();
    const dia = dataAtual.getDate();
    const mes = dataAtual.getMonth() + 1; // Mês começa em 0
    const ano = dataAtual.getFullYear();

    // Busca entregas onde o array dia tem os valores [dia, mes, ano]
    const entregas = await this.entregaModel.find({
      dia: [dia, mes, ano],
    }).exec();
    
    // Converte os documentos do Mongoose para o tipo entregasTipo
    return entregas.map(entrega => this.converterParaEntregaTipo(entrega));
  }
  
  /**
   * Cria uma nova entrega no banco de dados
   * @param entregaData Dados da entrega a ser criada
   * @returns A entrega criada
   */
  async criarEntrega(entregaData: entregasTipo): Promise<entregasTipo> {
    // Se a data não foi fornecida, usa a data atual
    if (!entregaData.dia || !Array.isArray(entregaData.dia) || entregaData.dia.length !== 3) {
      const dataAtual = new Date();
      entregaData.dia = [
        dataAtual.getDate(),
        dataAtual.getMonth() + 1,
        dataAtual.getFullYear()
      ];
    }
    
    // Cria uma nova entrega no banco de dados
    const novaEntrega = new this.entregaModel(entregaData);
    const entregaSalva = await novaEntrega.save();
    
    // Converte e retorna a entrega criada
    return this.converterParaEntregaTipo(entregaSalva);
  }
  
  /**
   * Atualiza uma entrega existente no banco de dados pelo ID
   * @param id ID da entrega a ser atualizada
   * @param entregaData Dados atualizados da entrega
   * @returns A entrega atualizada ou null se não encontrada
   */
  async atualizarEntrega(id: string, entregaData: entregasTipo): Promise<entregasTipo | null> {
    // Remove o campo id do objeto de atualização, se existir
    if (entregaData.id) {
      delete entregaData.id;
    }
    
    // Busca e atualiza a entrega pelo ID
    const entregaAtualizada = await this.entregaModel.findByIdAndUpdate(
      id,
      entregaData,
      { new: true } // Retorna o documento atualizado
    ).exec();
    
    // Se não encontrou a entrega, retorna null
    if (!entregaAtualizada) {
      return null;
    }
    
    // Converte e retorna a entrega atualizada
    return this.converterParaEntregaTipo(entregaAtualizada);
  }
  
  /**
   * Converte um documento Mongoose para o tipo entregasTipo
   */
  private converterParaEntregaTipo(entrega: Entrega): entregasTipo {
    const entregaObj = entrega.toObject();
    
    // Converte o _id do MongoDB para o campo id
    if (entregaObj._id) {
      entregaObj.id = entregaObj._id.toString();
      delete entregaObj._id;
    }
    
    // Remove campos internos do Mongoose
    delete entregaObj.__v;
    
    // Garantindo que horario seja uma tupla se existir
    if (Array.isArray(entregaObj.horario) && entregaObj.horario.length === 2) {
      entregaObj.horario = entregaObj.horario as [number, number];
    }
    
    return entregaObj as entregasTipo;
  }

  /**
   * Busca todas as entregas no banco de dados, independente da data
   * @returns Array com todas as entregas
   */
  async buscarTodasEntregas(): Promise<entregasTipo[]> {
    // Busca todas as entregas no banco
    const entregas = await this.entregaModel.find().exec();
    
    // Converte os documentos do Mongoose para o tipo entregasTipo
    return entregas.map(entrega => this.converterParaEntregaTipo(entrega));
  }

  /**
   * Deleta uma entrega do banco de dados pelo ID
   * @param id ID da entrega a ser deletada
   * @returns true se a entrega foi deletada, false se não foi encontrada
   */
  async deletarEntrega(id: string): Promise<boolean> {
    try {
      const resultado = await this.entregaModel.findByIdAndDelete(id).exec();
      return resultado !== null;
    } catch (error) {
      this.logger.error(`Erro ao deletar entrega: ${error.message}`);
      return false;
    }
  }
} 