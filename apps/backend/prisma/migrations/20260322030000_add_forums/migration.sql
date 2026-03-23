-- CreateTable: forum_threads
CREATE TABLE "forum_threads" (
    "id"         TEXT         NOT NULL,
    "course_id"  TEXT         NOT NULL,
    "author_id"  TEXT         NOT NULL,
    "title"      TEXT         NOT NULL,
    "body"       TEXT         NOT NULL,
    "is_pinned"  BOOLEAN      NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable: forum_posts
CREATE TABLE "forum_posts" (
    "id"         TEXT         NOT NULL,
    "thread_id"  TEXT         NOT NULL,
    "author_id"  TEXT         NOT NULL,
    "body"       TEXT         NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forum_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "forum_threads_course_id_idx" ON "forum_threads"("course_id");
CREATE INDEX "forum_posts_thread_id_idx"  ON "forum_posts"("thread_id");

-- AddForeignKey
ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "forum_threads" ADD CONSTRAINT "forum_threads_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_thread_id_fkey"
    FOREIGN KEY ("thread_id") REFERENCES "forum_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_author_id_fkey"
    FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
