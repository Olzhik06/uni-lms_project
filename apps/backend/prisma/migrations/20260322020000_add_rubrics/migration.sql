-- CreateTable: rubrics
CREATE TABLE "rubrics" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rubrics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rubrics_assignment_id_key" ON "rubrics"("assignment_id");

-- CreateTable: rubric_criteria
CREATE TABLE "rubric_criteria" (
    "id" TEXT NOT NULL,
    "rubric_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "points" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rubric_criteria_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rubric_criteria_rubric_id_idx" ON "rubric_criteria"("rubric_id");

-- CreateTable: rubric_levels
CREATE TABLE "rubric_levels" (
    "id" TEXT NOT NULL,
    "criterion_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "points" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rubric_levels_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rubric_levels_criterion_id_idx" ON "rubric_levels"("criterion_id");

-- CreateTable: rubric_evaluations
CREATE TABLE "rubric_evaluations" (
    "id" TEXT NOT NULL,
    "rubric_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "evaluated_by_id" TEXT NOT NULL,
    "total_score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rubric_evaluations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rubric_evaluations_submission_id_key" ON "rubric_evaluations"("submission_id");
CREATE INDEX "rubric_evaluations_rubric_id_idx" ON "rubric_evaluations"("rubric_id");

-- CreateTable: rubric_criterion_scores
CREATE TABLE "rubric_criterion_scores" (
    "id" TEXT NOT NULL,
    "evaluation_id" TEXT NOT NULL,
    "criterion_id" TEXT NOT NULL,
    "level_id" TEXT NOT NULL,
    "comment" TEXT,

    CONSTRAINT "rubric_criterion_scores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "rubric_criterion_scores_evaluation_id_criterion_id_key" ON "rubric_criterion_scores"("evaluation_id", "criterion_id");
CREATE INDEX "rubric_criterion_scores_evaluation_id_idx" ON "rubric_criterion_scores"("evaluation_id");

-- AddForeignKey
ALTER TABLE "rubrics" ADD CONSTRAINT "rubrics_assignment_id_fkey"
    FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rubrics" ADD CONSTRAINT "rubrics_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rubric_criteria" ADD CONSTRAINT "rubric_criteria_rubric_id_fkey"
    FOREIGN KEY ("rubric_id") REFERENCES "rubrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rubric_levels" ADD CONSTRAINT "rubric_levels_criterion_id_fkey"
    FOREIGN KEY ("criterion_id") REFERENCES "rubric_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rubric_evaluations" ADD CONSTRAINT "rubric_evaluations_rubric_id_fkey"
    FOREIGN KEY ("rubric_id") REFERENCES "rubrics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rubric_evaluations" ADD CONSTRAINT "rubric_evaluations_submission_id_fkey"
    FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rubric_evaluations" ADD CONSTRAINT "rubric_evaluations_evaluated_by_id_fkey"
    FOREIGN KEY ("evaluated_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rubric_criterion_scores" ADD CONSTRAINT "rubric_criterion_scores_evaluation_id_fkey"
    FOREIGN KEY ("evaluation_id") REFERENCES "rubric_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rubric_criterion_scores" ADD CONSTRAINT "rubric_criterion_scores_criterion_id_fkey"
    FOREIGN KEY ("criterion_id") REFERENCES "rubric_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rubric_criterion_scores" ADD CONSTRAINT "rubric_criterion_scores_level_id_fkey"
    FOREIGN KEY ("level_id") REFERENCES "rubric_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
