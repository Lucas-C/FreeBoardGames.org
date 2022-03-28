import { Module, HttpModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { RoomsModule } from './rooms/rooms.module';
import { MatchModule } from './match/match.module';
import { HealthzController } from './healthz.controller';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ChatModule } from './chat/chat.module';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

const CONNECTION: any = process.env.POSTGRES_URL
  ? {
      type: 'postgres',
      url: process.env.POSTGRES_URL,
      ssl: false,
      extra: {
        max: 22,
      },
    }
  : {
      type: 'sqlite',
      database: 'dev.db',
    };

const isProd = process.env.NODE_ENV === 'production';
const forceDbSync = process.env.FORCE_DB_SYNC === 'true';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...CONNECTION,
      autoLoadEntities: true,
      synchronize: !isProd || forceDbSync,
      logging: false,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      debug: !isProd,
      playground: !isProd,
      installSubscriptionHandlers: true,
      autoSchemaFile: join(process.cwd(), '../common/gql/schema.gql'),
      context: ({ req }) => ({ req }),
    }),
    UsersModule,
    RoomsModule,
    MatchModule,
    ChatModule,
    HttpModule.register({
      timeout: 2000,
      maxRedirects: 5,
    }),
  ],
  controllers: [HealthzController],
})
export class AppModule {}
