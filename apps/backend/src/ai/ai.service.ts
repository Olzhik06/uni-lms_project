import { Injectable, Logger, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { AssignmentFeedbackDto, GenerateQuizDto, CourseSummaryDto, StudentAnalysisDto } from './ai.dto';

const QuizSchema = z.object({
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()).length(4),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string(),
  })),
});

const DEMO_NOTE = 'This is a demo response. Set LLM_API_KEY to enable real AI.';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client: Anthropic | null = null;

  constructor(private db: PrismaService) {
    const apiKey = process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    } else {
      this.logger.warn('LLM_API_KEY not set — AI features running in demo mode');
    }
  }

  get isDemo() { return !this.client; }

  private async log(userId: string, type: string, prompt: string, response: string) {
    try {
      await this.db.aiRequestLog.create({ data: { userId, type, prompt, response } });
    } catch (e) {
      this.logger.warn('Failed to write AI request log', e);
    }
  }

  async getAssignmentFeedback(dto: AssignmentFeedbackDto, userId: string, userRole: string) {
    const submission = await this.db.submission.findUnique({
      where: { id: dto.submissionId },
      include: { assignment: true, grade: true },
    });
    if (!submission) throw new InternalServerErrorException('Submission not found');

    // Students may only get feedback on their own submissions
    if (userRole === 'STUDENT' && submission.studentId !== userId) {
      throw new ForbiddenException('You can only get AI feedback on your own submissions');
    }

    if (this.isDemo) {
      return {
        _demo: true,
        assessment: `${DEMO_NOTE} Overall this submission demonstrates a solid understanding of the assignment requirements.`,
        strengths: ['Clear structure and logical flow', 'Addresses the core requirements', 'Good use of terminology'],
        improvements: ['Could expand on supporting arguments', 'More specific examples would strengthen the response'],
        suggestions: ['Review lecture notes on this topic', 'Compare with model solutions if available', 'Ask your teacher for clarification on any unclear points'],
      };
    }

    const prompt = `You are an educational assistant. Provide constructive feedback for this student submission.

Assignment: ${submission.assignment.title}
Description: ${submission.assignment.description || 'N/A'}
Max Score: ${submission.assignment.maxScore}
Student Answer: ${submission.contentText || submission.contentUrl || '(file submission)'}
${submission.grade ? `Current Score: ${submission.grade.score}/${submission.assignment.maxScore}\nTeacher Comment: ${submission.grade.feedback || 'none'}` : 'Not graded yet'}

Provide:
1. Overall quality assessment (2-3 sentences)
2. Specific strengths (2-3 bullet points)
3. Areas for improvement (2-3 bullet points)
4. Actionable suggestions to improve the grade

Be encouraging and constructive. Format as JSON: { "assessment": "...", "strengths": ["..."], "improvements": ["..."], "suggestions": ["..."] }`;

    const response = await this.client!.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') throw new InternalServerErrorException('No response from AI');

    let result: any;
    try {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : textBlock.text);
    } catch {
      result = { assessment: textBlock.text, strengths: [], improvements: [], suggestions: [] };
    }

    await this.log(userId, 'assignment-feedback', prompt, JSON.stringify(result));
    return result;
  }

  async generateQuiz(dto: GenerateQuizDto, userId: string) {
    const count = dto.questionCount ?? 5;
    const difficulty = dto.difficulty ?? 'medium';

    const course = await this.db.course.findUnique({ where: { id: dto.courseId } });
    const courseName = course?.title ?? 'the course';

    if (this.isDemo) {
      return {
        _demo: true,
        questions: Array.from({ length: count }, (_, i) => ({
          question: `[Demo] Sample question ${i + 1} about "${dto.topic}"?`,
          options: ['Option A (correct)', 'Option B', 'Option C', 'Option D'],
          correctIndex: 0,
          explanation: `${DEMO_NOTE} This is a placeholder question.`,
        })),
      };
    }

    const prompt = `Generate a ${difficulty} difficulty quiz about "${dto.topic}" for the course "${courseName}".
Create exactly ${count} multiple-choice questions.
Each question must have exactly 4 answer options (A, B, C, D).

Return ONLY valid JSON matching this exact structure:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation of the correct answer"
    }
  ]
}

correctIndex is 0-based (0=A, 1=B, 2=C, 3=D). Do not include any text outside the JSON.`;

    const response = await this.client!.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 16000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') throw new InternalServerErrorException('No response from AI');

    let result: any;
    try {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      const raw = JSON.parse(jsonMatch ? jsonMatch[0] : textBlock.text);
      result = QuizSchema.parse(raw);
    } catch (e) {
      this.logger.error('Quiz parse error', e);
      throw new InternalServerErrorException('Failed to parse quiz response');
    }

    await this.log(userId, 'generate-quiz', prompt, JSON.stringify(result));
    return result;
  }

  async getCourseSummary(dto: CourseSummaryDto, userId: string) {
    const course = await this.db.course.findUnique({
      where: { id: dto.courseId },
      include: {
        assignments: true,
        announcements: { take: 5, orderBy: { createdAt: 'desc' } },
        materials: true,
      },
    });
    if (!course) throw new InternalServerErrorException('Course not found');

    if (this.isDemo) {
      return {
        _demo: true,
        summary: `${DEMO_NOTE} ${course.title} covers fundamental concepts and practical applications in the field.`,
        keyTopics: ['Core concepts', 'Practical applications', 'Assessment strategies'],
        tips: ['Review materials regularly', 'Complete assignments on time', 'Participate in discussions'],
        workload: 'moderate' as const,
      };
    }

    const assignmentTitles = course.assignments.map(a => `- ${a.title} (max ${a.maxScore}pts)`).join('\n');
    const recentAnnouncements = course.announcements.map(a => `- ${a.title}`).join('\n');

    const prompt = `Summarize this university course for students:

Course: ${course.title} (${course.code})
Description: ${course.description || 'N/A'}
Assignments (${course.assignments.length}):
${assignmentTitles || 'None yet'}
Materials available: ${course.materials.length}
Recent announcements:
${recentAnnouncements || 'None'}

Provide a helpful course overview as JSON:
{
  "summary": "2-3 sentence overview of what this course covers",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "tips": ["study tip 1", "study tip 2"],
  "workload": "light | moderate | heavy"
}`;

    const response = await this.client!.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') throw new InternalServerErrorException('No response from AI');

    let result: any;
    try {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : textBlock.text);
    } catch {
      result = { summary: textBlock.text, keyTopics: [], tips: [], workload: 'moderate' };
    }

    await this.log(userId, 'course-summary', prompt, JSON.stringify(result));
    return result;
  }

  async getStudentAnalysis(dto: StudentAnalysisDto, userId: string, userRole: string) {
    if (userRole === 'STUDENT' && dto.studentId !== userId) {
      throw new ForbiddenException('Students can only view their own analysis');
    }

    const student = await this.db.user.findUnique({
      where: { id: dto.studentId },
      include: {
        submissions: {
          include: {
            assignment: { include: { course: true } },
            grade: true,
          },
          ...(dto.courseId ? { where: { assignment: { courseId: dto.courseId } } } : {}),
        },
        attendance: {
          ...(dto.courseId ? { where: { courseId: dto.courseId } } : {}),
        },
      },
    });
    if (!student) throw new InternalServerErrorException('Student not found');

    if (this.isDemo) {
      return {
        _demo: true,
        analysis: `${DEMO_NOTE} ${student.fullName} shows consistent engagement with course materials and submits work on time.`,
        strengths: ['Consistent assignment submission', 'Good attendance record'],
        areasToImprove: ['Could improve grade scores', 'More active participation recommended'],
        recommendations: ['Schedule office hours with instructor', 'Form study groups with peers', 'Review feedback on past assignments'],
        riskLevel: 'low' as const,
      };
    }

    const gradeLines = student.submissions
      .filter(s => s.grade)
      .map(s => `${s.assignment.course.code} / ${s.assignment.title}: ${s.grade!.score}/${s.assignment.maxScore}`)
      .join('\n');

    const totalAttendance = student.attendance.length;
    const presentCount = student.attendance.filter(a => a.status === 'PRESENT').length;
    const lateCount = student.attendance.filter(a => a.status === 'LATE').length;

    const prompt = `Analyze this student's academic performance and provide actionable insights.

Student: ${student.fullName}
Submissions: ${student.submissions.length}
Grades:
${gradeLines || 'No grades yet'}
Attendance: ${presentCount} present, ${lateCount} late, ${totalAttendance - presentCount - lateCount} absent out of ${totalAttendance} sessions

Provide analysis as JSON:
{
  "analysis": "2-3 sentence overall performance summary",
  "strengths": ["strength 1", "strength 2"],
  "areasToImprove": ["area 1", "area 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "riskLevel": "low | medium | high"
}`;

    const response = await this.client!.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') throw new InternalServerErrorException('No response from AI');

    let result: any;
    try {
      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : textBlock.text);
    } catch {
      result = { analysis: textBlock.text, strengths: [], areasToImprove: [], recommendations: [], riskLevel: 'low' };
    }

    await this.log(userId, 'student-analysis', prompt, JSON.stringify(result));
    return result;
  }

  async *chatStream(message: string, userId: string, context?: string): AsyncGenerator<string> {
    if (this.isDemo) {
      const demoMsg = `[Demo mode] ${DEMO_NOTE} You asked: "${message}". In a real deployment, I would provide a detailed academic response here.`;
      for (const word of demoMsg.split(' ')) {
        yield word + ' ';
      }
      return;
    }

    const systemPrompt = `You are an AI academic assistant for UniLMS, a university learning management system.
You help students understand course material, clarify assignment requirements, and provide study guidance.
Be concise, encouraging, and educational. ${context ? `Context: ${context}` : ''}`;

    const stream = this.client!.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    });

    let fullResponse = '';
    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        fullResponse += event.delta.text;
        yield event.delta.text;
      }
    }

    await this.log(userId, 'chat', message, fullResponse);
  }
}
