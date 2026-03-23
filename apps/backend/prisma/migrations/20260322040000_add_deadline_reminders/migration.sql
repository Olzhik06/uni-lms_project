CREATE TABLE "deadline_reminders" (
  "id"            TEXT NOT NULL,
  "assignment_id" TEXT NOT NULL,
  "user_id"       TEXT NOT NULL,
  "reminder_type" TEXT NOT NULL,
  "sent_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "deadline_reminders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "deadline_reminders_assignment_id_user_id_reminder_type_key"
  ON "deadline_reminders"("assignment_id", "user_id", "reminder_type");

CREATE INDEX "deadline_reminders_user_id_idx"
  ON "deadline_reminders"("user_id");

ALTER TABLE "deadline_reminders"
  ADD CONSTRAINT "deadline_reminders_assignment_id_fkey"
  FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "deadline_reminders"
  ADD CONSTRAINT "deadline_reminders_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
