import { Module } from '@nestjs/common';
import { DeadlineReminderService } from './deadline-reminder.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  providers: [DeadlineReminderService],
})
export class DeadlineReminderModule {}
