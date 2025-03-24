import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Main');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Configurar pasta de arquivos estáticos
  app.useStaticAssets(join(__dirname, '..', 'public'));
  
  const port = process.env.PORT || 3000;
  
  await app.listen(port);
  logger.log(`Servidor HTTP inicializado na porta ${port}`);
}
bootstrap();
