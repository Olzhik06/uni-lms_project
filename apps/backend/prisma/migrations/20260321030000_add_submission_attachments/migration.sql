-- CreateTable
CREATE TABLE "submission_attachments" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submission_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "submission_attachments_submission_id_idx" ON "submission_attachments"("submission_id");

-- AddForeignKey
ALTER TABLE "submission_attachments" ADD CONSTRAINT "submission_attachments_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
