-- CreateTable
CREATE TABLE "assignment_resources" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assignment_resources_assignment_id_idx" ON "assignment_resources"("assignment_id");

-- AddForeignKey
ALTER TABLE "assignment_resources" ADD CONSTRAINT "assignment_resources_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
