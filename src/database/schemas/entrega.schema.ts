import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'Entregas' })
export class Entrega extends Document {
  @Prop({ type: [Number], required: false })
  dia?: number[];

  @Prop({ required: false })
  nome?: string;

  @Prop({ required: false })
  status?: string;

  @Prop({ required: false })
  telefone?: string;

  @Prop({ required: false })
  cidade?: string;

  @Prop({ required: false })
  bairro?: string;

  @Prop({ required: false })
  rua?: string;

  @Prop({ required: false })
  numero?: string;

  @Prop({ 
    type: { 
      latitude: { type: Number, required: false }, 
      longitude: { type: Number, required: false } 
    }, 
    required: false 
  })
  coordenadas?: {
    latitude?: number;
    longitude?: number;
  };

  @Prop({ required: false })
  valor?: string;

  @Prop({ required: false })
  pagamento?: string;

  @Prop({ required: false })
  entregador?: string;

  @Prop({ required: false })
  volume?: string;

  @Prop({ required: false })
  observacoes?: string;

  @Prop({ required: false })
  statusPagamento?: string;

  @Prop({ 
    type: [{ type: Number }], 
    required: false,
    validate: {
      validator: function(v) {
        // Permitir null/undefined ou um array com exatamente 2 elementos
        return v === undefined || v === null || (Array.isArray(v) && v.length === 2);
      },
      message: props => `${props.value} deve ser um array com exatamente 2 elementos [horas, minutos]`
    }
  })
  horario?: [number, number]; // Tupla [horas, minutos]

  @Prop({ required: false })
  statusMensagem?: string;
}

export const EntregaSchema = SchemaFactory.createForClass(Entrega); 