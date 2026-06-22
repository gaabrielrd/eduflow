-- CreateEnum
CREATE TYPE "CourseModuleStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "CourseModule" ADD COLUMN     "status" "CourseModuleStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "status" "LessonStatus" NOT NULL DEFAULT 'ACTIVE';
