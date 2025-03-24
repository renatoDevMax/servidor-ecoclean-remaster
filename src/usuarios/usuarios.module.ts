import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsuarioSchema } from '../database/schemas/usuario.schema';
import { UsuariosService } from './usuarios.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Usuario', schema: UsuarioSchema },
    ]),
  ],
  providers: [UsuariosService],
  exports: [UsuariosService],
})
export class UsuariosModule {} 