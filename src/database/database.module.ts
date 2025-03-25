import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DATABASE_URL || 'mongodb+srv://renatodevmaximiano:maxjr1972@clusterrenato.asdih.mongodb.net/Sistema_EcoClean?retryWrites=true&w=majority&appName=ClusterRenato'),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {} 