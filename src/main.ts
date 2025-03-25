import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function bootstrap() {
  const logger = new Logger('Main');
  
  // Log de depuração para variáveis de ambiente
  logger.log('Variáveis de ambiente:');
  logger.log(`PORT: ${process.env.PORT}`);
  logger.log(`PORT Railway: ${process.env.RAILWAY_PORT}`);
  logger.log(`PORT Internal: ${process.env.PORT_INTERNAL}`);
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Configurar pasta de arquivos estáticos
  app.useStaticAssets(join(__dirname, '..', 'public'));
  
  // Habilitar CORS para todos os domínios
  app.enableCors();
  
  // Usar a porta correta - Railway define PORT=8080 por padrão
  const port = process.env.PORT || 3000;
  
  await app.listen(port, '0.0.0.0'); // Importante: escutar em todos os IPs
  logger.log(`Servidor HTTP inicializado na porta ${port}`);
  logger.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
