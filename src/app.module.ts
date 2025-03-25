import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppGateway } from './gateways/app.gateway';
import { DatabaseModule } from './database/database.module';
import { EntregasModule } from './entregas/entregas.module';
import { ClientesModule } from './clientes/clientes.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [DatabaseModule, EntregasModule, ClientesModule, UsuariosModule, WhatsappModule],
  controllers: [AppController],
  providers: [AppService, AppGateway],
})
export class AppModule {}
