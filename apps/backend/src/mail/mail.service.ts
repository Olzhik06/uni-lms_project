import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

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

  async sendAssignmentCreated(to: string, assignmentTitle: string, courseName: string, dueAt: Date) {
    if (!process.env.SMTP_USER) {
      this.logger.debug(`[EMAIL SKIPPED] Assignment created: ${assignmentTitle} → ${to}`);
      return;
    }
    await this.send(to, `New Assignment: ${assignmentTitle}`,
      `<p>A new assignment <strong>${assignmentTitle}</strong> has been added to <strong>${courseName}</strong>.</p>
       <p>Due: ${dueAt.toLocaleDateString()}</p>`);
  }

  async sendGradePublished(to: string, assignmentTitle: string, score: number, maxScore: number, feedback?: string | null) {
    if (!process.env.SMTP_USER) {
      this.logger.debug(`[EMAIL SKIPPED] Grade published for ${assignmentTitle} → ${to}`);
      return;
    }
    await this.send(to, `Grade Published: ${assignmentTitle}`,
      `<p>Your assignment <strong>${assignmentTitle}</strong> has been graded.</p>
       <p>Score: <strong>${score} / ${maxScore}</strong></p>
       ${feedback ? `<p>Feedback: ${feedback}</p>` : ''}`);
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
