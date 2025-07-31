import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { PostModule } from './post/post.module';
import { UserModule } from './user/user.module';
import { CustomGraphQLError } from './common/error';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerMiddleware } from './logger/logger.middleware';
import { LoggerModule } from './logger/logger.module';
import Joi from 'joi';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/user.entity';
import { AuthModule } from './auth/auth.module';
import { Post } from './post/post.entity';
import { Request } from 'express';
import { Blog } from './blog/blog.entity';
import { BlogModule } from './blog/blog.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { FileModule } from './file/file.module';
import { ResumeModule } from './resume/resume.module';
import { Resume } from './resume/entities/resume.entity';

@Module({
  imports: [
    // =============================== //
    // ===== 앱 구동을 위한 셋팅 ===== //
    // =============================== //
    // ===== 1. 환경변수 설정 모듈 ===== //
    ConfigModule.forRoot({
      isGlobal: true, // 해당 모듈을 전역에서 접근할 수 있도록 isGlobal: true로 설정
      // 환경변수 파일
      envFilePath:
        process.env.NODE_ENV === 'LOCAL'
          ? '.env.local'
          : process.env.NODE_ENV === 'DEV'
            ? '.env.dev'
            : '.env.prod',
      // 환경변수 셋팅 확인
      validationSchema: Joi.object({
        // 환경
        NODE_ENV: Joi.string().valid('LOCAL', 'DEV', 'PROD').required(),
        // 로그 stacktrace 포함 여부
        INCLUDE_STACKTRACE: Joi.boolean().required(),
        // mysql
        MYSQL_HOST: Joi.string().required(),
        MYSQL_PORT: Joi.number().required(),
        MYSQL_USERNAME: Joi.string().required(),
        MYSQL_PASSWORD: Joi.string().required(),
        MYSQL_DATABASE: Joi.string().required(),
        // jwt
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().required(), // 만료시간
        JWT_ISSUER: Joi.string().required(), // 토큰 발급자
        JWT_SUBJECT: Joi.string().required(), // 토큰 발급자
        // cloudflare
        CLOUDFLARE_ACCOUNT_ID: Joi.string().required(), // cloudflare 계정
        CLOUDFLARE_API_TOKEN: Joi.string().required(), // cloudflare api 토큰
        // APP_PORT
        APP_PORT: Joi.number().required(),
      }),
    }),
    // ===== 2. GraphQL 설정 모듈 ===== //
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          graphiql: true,
          autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
          context: ({ req }: { req: Request }) => {
            return {
              access_token: req.headers['authorization']?.split('Bearer ')[1],
            };
          },
          formatError: (error: any) => {
            // 'INCLUDE_STACKTRACE' 가 true인 경우는 STACKTRACE를 남기도록 셋팅
            const includeStackTrace =
              configService.get<boolean>('INCLUDE_STACKTRACE') ?? false;

            // 에러 로그
            // TODO 만들어둔 custom logger 사용하기
            console.log('error format: ', error);

            // 커스텀 에러가 아닌 경우 커스텀 에러로 감싸기. 단, 에러 문구 및 코드값을 같이 표현하기 위해 아래 로직 추가함
            if (error.extensions?.customFlag !== true) {
              const errorRawMessageList: Array<string> = [
                error.message,
                error.extensions?.code,
                ...(Array.isArray(error.extensions?.originalError?.message)
                  ? error.extensions.originalError.message
                  : []),
              ];
              const errorMessageList: Array<string> = [];

              if (errorRawMessageList.length > 0) {
                for (const rawError of errorRawMessageList) {
                  if (Array.isArray(rawError)) {
                    errorMessageList.push(...rawError.filter((per) => !per));
                  } else {
                    if (rawError) {
                      errorMessageList.push(rawError);
                    }
                  }
                }
              }

              const errorMessage = `[${errorMessageList.join('] - [')}]`;

              return new CustomGraphQLError(errorMessage, {
                extensions: {
                  code: 'ERR_UNEXPECTED',
                  customFlag: false,
                },
              });
            }

            if (includeStackTrace === false) {
              delete error.extensions.stacktrace;
            }

            return error;
          },
          cors: {
            // 프론트 서버의 오리진
            origin:
              process.env.NODE_ENV === 'PROD'
                ? ['https://blue-port.co.kr']
                : ['http://localhost:3000'],
            // 쿠키, 인증헤더 등을 사용할 수 있게 할 것인지
            credentials: true,
          },
        };
      },
    }),
    // ===== 3. TypeOrm 설정 모듈 ===== //
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('MYSQL_HOST'),
        port: +configService.get('MYSQL_PORT'),
        username: configService.get('MYSQL_USERNAME'),
        password: configService.get('MYSQL_PASSWORD'),
        database: configService.get('MYSQL_DATABASE'),
        entities: [
          // 유저
          User,
          // 블로그
          Blog,
          // 게시글
          Post,
          // 이력서
          Resume,
        ],
        synchronize: ['PROD', 'DEV'].includes(process.env.NODE_ENV as string)
          ? false
          : true,
        logging: process.env.NODE_ENV === 'PROD' ? false : true,
      }),
    }),
    // ===== 4. 이벤트 모듈 ===== //
    EventEmitterModule.forRoot(),
    // ============================ //
    // ===== 커스텀 공통 모듈 ===== //
    // ============================ //
    // ===== 1. 권한 ===== //
    AuthModule,
    // ===== 2. 로거 ====== //
    LoggerModule,
    // ===== 3. 파일 업로드 ===== //
    FileModule,
    // ====================================================== //
    // ===== 앱 구동을 위해 커스텀된 실제 비즈니스 로직 ===== //
    // ====================================================== //
    // ===== 1. 게시글 ===== //
    PostModule,
    // ===== 2. 유저 ===== //
    UserModule,
    // ===== 3. 블로그 ===== //
    BlogModule,
    // ===== 4. 이력서 ===== //
    ResumeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
