import { randomUUID } from "node:crypto";

import { ValidationPipe, type DynamicModule, type INestApplication, type Type } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";

import { AllExceptionsFilter } from "../common/filters/all-exceptions.filter.js";
import { PrismaService } from "../database/prisma.service.js";
import { Role } from "../generated/prisma/enums.js";

process.env.NODE_ENV = "test";
process.env.PORT = "4001";
process.env.DATABASE_URL ??= "postgresql://eduflow:eduflow@localhost:5432/eduflow";
process.env.REDIS_URL ??= "redis://localhost:6379";
process.env.JWT_SECRET ??= "test-secret";
process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ??= "1h";
process.env.JWT_REFRESH_TOKEN_EXPIRES_IN ??= "30d";
process.env.STORAGE_ENDPOINT ??= "http://localhost:9000";
process.env.STORAGE_ACCESS_KEY ??= "eduflow";
process.env.STORAGE_SECRET_KEY ??= "eduflow123";
process.env.STORAGE_BUCKET_NAME ??= "eduflow-media";
process.env.STORAGE_REGION ??= "us-east-1";
process.env.STORAGE_PUBLIC_BASE_URL ??= "http://localhost:9000";
process.env.MEDIA_UPLOAD_MAX_SIZE_BYTES ??= "10485760";

type ModuleImport = DynamicModule | Promise<DynamicModule> | Type<unknown>;

export type TestAppContext = {
  app: INestApplication;
  prisma: PrismaService;
};

export async function bootstrapTestApp(
  additionalImports: ModuleImport[] = []
): Promise<TestAppContext> {
  const { AppModule } = await import("../app.module.js");

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule, ...additionalImports]
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();

  return {
    app,
    prisma: app.get(PrismaService)
  };
}

export async function resetDatabase(prisma: PrismaService) {
  await prisma.$transaction([
    prisma.lessonProgress.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.authSession.deleteMany(),
    prisma.mediaAsset.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.courseModule.deleteMany(),
    prisma.courseVersion.deleteMany(),
    prisma.course.deleteMany(),
    prisma.membership.deleteMany(),
    prisma.invitation.deleteMany(),
    prisma.organization.deleteMany(),
    prisma.user.deleteMany()
  ]);
}

export async function closeTestApp(app: INestApplication) {
  if (app) {
    await app.close();
  }
}

export function uniqueSuffix() {
  return randomUUID().slice(0, 8);
}

export async function createAuthUserPayload(email: string) {
  return {
    name: "Gabriel Roda",
    email,
    password: "strong-password"
  };
}

export async function createUserAndToken(
  app: INestApplication,
  email: string,
  name = `User ${email}`
) {
  const response = await request(app.getHttpServer())
    .post("/auth/register")
    .send({
      name,
      email,
      password: "strong-password"
    })
    .expect(201);

  return {
    user: response.body.user as { id: string; email: string; name: string },
    accessToken: response.body.accessToken as string,
    refreshToken: response.body.refreshToken as string
  };
}

export async function createOrganizationForUser(params: {
  prisma: PrismaService;
  userId: string;
  name: string;
  slug: string;
  role?: Role;
}) {
  const organization = await params.prisma.organization.create({
    data: {
      name: params.name,
      slug: params.slug
    },
    select: {
      id: true,
      name: true,
      slug: true
    }
  });

  await params.prisma.membership.create({
    data: {
      userId: params.userId,
      organizationId: organization.id,
      role: params.role ?? Role.OWNER
    }
  });

  return organization;
}
