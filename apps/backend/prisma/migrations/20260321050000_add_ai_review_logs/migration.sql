-- CreateTable
CREATE TABLE "ai_review_logs" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "output" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_review_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_review_logs_submission_id_idx" ON "ai_review_logs"("submission_id");
