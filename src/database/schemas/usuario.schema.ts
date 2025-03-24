import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'Usuarios' })
export class Usuario extends Document {
  @Prop()
  nome: string;

  @Prop({ type: String, enum: ['disponível', 'indisponível', 'ocupado', 'offline'] })
  status: string;

  @Prop()
  userName: string;

  @Prop()
  senha: string;

  @Prop({ type: { latitude: Number, longitude: Number } })
  localizacao: {
    latitude: number;
    longitude: number;
  };
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario); 