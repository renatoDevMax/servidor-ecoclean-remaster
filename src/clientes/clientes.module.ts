import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClienteSchema } from '../database/schemas/cliente.schema';
import { ClientesService } from './clientes.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Cliente', schema: ClienteSchema },
    ]),
  ],
  providers: [ClientesService],
  exports: [ClientesService],
})
export class ClientesModule {} 