import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EntregaSchema } from '../database/schemas/entrega.schema';
import { EntregasService } from './entregas.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Entrega', schema: EntregaSchema },
    ]),
  ],
  providers: [EntregasService],
  exports: [EntregasService],
})
export class EntregasModule {} 