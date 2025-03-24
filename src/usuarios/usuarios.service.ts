import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Usuario } from '../database/schemas/usuario.schema';
import { usuariosTipo } from '../types/userTypes';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel('Usuario') private readonly usuarioModel: Model<Usuario>,
  ) {}

  async buscarTodosUsuarios(): Promise<usuariosTipo[]> {
    // Retorna todos os usuários da coleção Usuarios
    const usuarios = await this.usuarioModel.find().exec();
    return usuarios.map(usuario => this.converterParaUsuarioTipo(usuario));
  }
  
  /**
   * Busca um usuário pelo userName
   * @param userName Nome de usuário a ser buscado
   * @returns O usuário encontrado ou null se não encontrado
   */
  async buscarUsuarioPorUserName(userName: string): Promise<usuariosTipo | null> {
    const usuario = await this.usuarioModel.findOne({ userName }).exec();
    if (!usuario) {
      return null;
    }
    return this.converterParaUsuarioTipo(usuario);
  }
  
  /**
   * Verifica se as credenciais de um usuário são válidas
   * @param userName Nome de usuário
   * @param senha Senha do usuário
   * @returns O usuário autenticado ou null se as credenciais forem inválidas
   */
  async autenticarUsuario(userName: string, senha: string): Promise<usuariosTipo | null> {
    // Busca o usuário pelo userName
    const usuario = await this.usuarioModel.findOne({ userName }).exec();
    
    // Verifica se o usuário existe e se a senha está correta
    if (!usuario || usuario.senha !== senha) {
      return null;
    }
    
    // Retorna o usuário convertido
    return this.converterParaUsuarioTipo(usuario);
  }
  
  /**
   * Atualiza um usuário existente pelo userName
   * @param usuarioData Dados do usuário a ser atualizado
   * @returns O usuário atualizado ou null se não encontrado
   */
  async atualizarUsuarioPorUserName(usuarioData: usuariosTipo): Promise<usuariosTipo | null> {
    // Verificar se o userName foi fornecido
    if (!usuarioData.userName) {
      return null;
    }
    
    // Buscar o usuário pelo userName
    const usuarioExistente = await this.usuarioModel.findOne({ 
      userName: usuarioData.userName 
    }).exec();
    
    // Se o usuário não existir, retornar null
    if (!usuarioExistente) {
      return null;
    }
    
    // Criar um novo objeto sem o campo id para atualização
    const { id, ...dadosAtualizacao } = usuarioData;
    
    // Atualizar o usuário encontrado
    const usuarioAtualizado = await this.usuarioModel.findByIdAndUpdate(
      usuarioExistente._id,
      dadosAtualizacao,
      { new: true } // Retorna o documento atualizado
    ).exec();
    
    if (!usuarioAtualizado) {
      return null;
    }
    
    // Retornar o usuário atualizado
    return this.converterParaUsuarioTipo(usuarioAtualizado);
  }
  
  /**
   * Converte um documento Mongoose para o tipo usuariosTipo
   */
  private converterParaUsuarioTipo(usuario: Usuario): usuariosTipo {
    const usuarioObj = usuario.toObject();
    
    // Converte o _id do MongoDB para o campo id
    if (usuarioObj._id) {
      usuarioObj.id = usuarioObj._id.toString();
      delete usuarioObj._id;
    }
    
    // Remove campos internos do Mongoose
    delete usuarioObj.__v;
    
    return usuarioObj as usuariosTipo;
  }
} 