-- CreateTable
CREATE TABLE "grade_categories" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grade_categories_course_id_idx" ON "grade_categories"("course_id");

-- AlterTable: add category_id to assignments
ALTER TABLE "assignments" ADD COLUMN "category_id" TEXT;

-- AlterTable: add category_id to quizzes
ALTER TABLE "quizzes" ADD COLUMN "category_id" TEXT;

-- AddForeignKey
ALTER TABLE "grade_categories" ADD CONSTRAINT "grade_categories_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "assignments" ADD CONSTRAINT "assignments_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "grade_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "grade_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
