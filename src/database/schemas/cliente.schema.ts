import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'Clientes' })
export class Cliente extends Document {
  @Prop()
  nome: string;

  @Prop()
  telefone: string;

  @Prop()
  cidade: string;

  @Prop()
  bairro: string;

  @Prop()
  rua: string;

  @Prop()
  numero: string;

  @Prop({ type: { latitude: Number, longitude: Number } })
  coordenadas: {
    latitude: number;
    longitude: number;
  };
}

export const ClienteSchema = SchemaFactory.createForClass(Cliente); 