import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'path';
import express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.use(helmet());
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  const cfg = new DocumentBuilder()
    .setTitle('UniLMS API')
    .setDescription('Unified LMS platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth')
    .addTag('Courses')
    .addTag('Assignments')
    .addTag('Attendance')
    .addTag('Materials')
    .addTag('Notifications')
    .addTag('Schedule')
    .addTag('Search')
    .addTag('Admin')
    .addTag('Activity Log')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, cfg));
  const server = await app.listen(4000);
  // Increase timeouts for long-running AI requests (quiz generation can take 60s+)
  server.headersTimeout = 300000; // 5 minutes
  server.requestTimeout = 300000;
  console.log('Backend running on http://localhost:4000');
}
bootstrap();
