import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { getAssignmentEmailContent, getGradeEmailContent, getDeadlineReminderEmailContent } from '../common/user-content';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  async sendAssignmentCreated(to: string, assignmentTitle: string, courseName: string, dueAt: Date, preferredLang?: string | null) {
    if (!process.env.SMTP_USER) {
      this.logger.debug(`[EMAIL SKIPPED] Assignment created: ${assignmentTitle} → ${to}`);
      return;
    }
    const content = getAssignmentEmailContent(assignmentTitle, courseName, dueAt, preferredLang);
    await this.send(to, content.subject, content.html);
  }

  async sendGradePublished(to: string, assignmentTitle: string, score: number, maxScore: number, feedback?: string | null, preferredLang?: string | null) {
    if (!process.env.SMTP_USER) {
      this.logger.debug(`[EMAIL SKIPPED] Grade published for ${assignmentTitle} → ${to}`);
      return;
    }
    const content = getGradeEmailContent(assignmentTitle, score, maxScore, feedback, preferredLang);
    await this.send(to, content.subject, content.html);
  }

  async sendDeadlineReminder(to: string, assignmentTitle: string, courseTitle: string, dueAt: Date, hoursLeft: number, preferredLang?: string | null) {
    if (!process.env.SMTP_USER) {
      this.logger.debug(`[EMAIL SKIPPED] Deadline ${hoursLeft}h reminder: ${assignmentTitle} → ${to}`);
      return;
    }
    const content = getDeadlineReminderEmailContent(assignmentTitle, courseTitle, dueAt, hoursLeft, preferredLang);
    await this.send(to, content.subject, content.html);
  }

  private async send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@unilms.local',
        to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
    }
  }
}
