-- CreateTable
CREATE TABLE "assignment_comments" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignment_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assignment_comments_assignment_id_idx" ON "assignment_comments"("assignment_id");

-- CreateIndex
CREATE INDEX "assignment_comments_author_id_idx" ON "assignment_comments"("author_id");

-- AddForeignKey
ALTER TABLE "assignment_comments" ADD CONSTRAINT "assignment_comments_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_comments" ADD CONSTRAINT "assignment_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
