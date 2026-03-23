-- CreateEnum
CREATE TYPE "QuizStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ_SINGLE', 'MCQ_MULTI', 'TRUE_FALSE', 'SHORT_ANSWER');

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" "QuizStatus" NOT NULL DEFAULT 'DRAFT',
    "time_limit_minutes" INTEGER,
    "max_attempts" INTEGER NOT NULL DEFAULT 1,
    "shuffle_questions" BOOLEAN NOT NULL DEFAULT false,
    "show_results" BOOLEAN NOT NULL DEFAULT true,
    "available_from" TIMESTAMP(3),
    "available_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "body" TEXT NOT NULL,
    "options" JSONB,
    "correct_option" JSONB,
    "explanation" TEXT,
    "points" INTEGER NOT NULL DEFAULT 1,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "max_score" DOUBLE PRECISION,
    "time_taken_seconds" INTEGER,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_answer_records" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "answer" JSONB,
    "is_correct" BOOLEAN,
    "points_earned" DOUBLE PRECISION,
    "teacher_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_answer_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quizzes_course_id_idx" ON "quizzes"("course_id");
CREATE INDEX "quizzes_status_idx" ON "quizzes"("status");
CREATE INDEX "quiz_questions_quiz_id_idx" ON "quiz_questions"("quiz_id");
CREATE UNIQUE INDEX "quiz_attempts_quiz_id_student_id_attempt_number_key" ON "quiz_attempts"("quiz_id", "student_id", "attempt_number");
CREATE INDEX "quiz_attempts_quiz_id_idx" ON "quiz_attempts"("quiz_id");
CREATE INDEX "quiz_attempts_student_id_idx" ON "quiz_attempts"("student_id");
CREATE UNIQUE INDEX "quiz_answer_records_attempt_id_question_id_key" ON "quiz_answer_records"("attempt_id", "question_id");
CREATE INDEX "quiz_answer_records_attempt_id_idx" ON "quiz_answer_records"("attempt_id");
CREATE INDEX "quiz_answer_records_question_id_idx" ON "quiz_answer_records"("question_id");

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_answer_records" ADD CONSTRAINT "quiz_answer_records_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_answer_records" ADD CONSTRAINT "quiz_answer_records_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
