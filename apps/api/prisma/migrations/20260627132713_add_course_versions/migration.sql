-- CreateEnum
CREATE TYPE "CourseVersionStatus" AS ENUM ('PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "CourseVersion" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "snapshotJson" JSONB NOT NULL,
    "status" "CourseVersionStatus" NOT NULL DEFAULT 'PUBLISHED',
    "publishedById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseVersion_organizationId_idx" ON "CourseVersion"("organizationId");

-- CreateIndex
CREATE INDEX "CourseVersion_publishedById_idx" ON "CourseVersion"("publishedById");

-- CreateIndex
CREATE UNIQUE INDEX "CourseVersion_courseId_versionNumber_key" ON "CourseVersion"("courseId", "versionNumber");

-- AddForeignKey
ALTER TABLE "CourseVersion" ADD CONSTRAINT "CourseVersion_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseVersion" ADD CONSTRAINT "CourseVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseVersion" ADD CONSTRAINT "CourseVersion_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateFunction
CREATE FUNCTION "reject_course_version_snapshot_update"()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD."snapshotJson" IS DISTINCT FROM NEW."snapshotJson" THEN
        RAISE EXCEPTION 'CourseVersion.snapshotJson is immutable after creation';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CreateTrigger
CREATE TRIGGER "CourseVersion_snapshotJson_immutable"
BEFORE UPDATE ON "CourseVersion"
FOR EACH ROW
EXECUTE FUNCTION "reject_course_version_snapshot_update"();
