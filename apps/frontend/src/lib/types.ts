export type Role = 'ADMIN'|'TEACHER'|'STUDENT';
export type CourseRole = 'STUDENT'|'TEACHER';
export type ScheduleType = 'LECTURE'|'PRACTICE'|'LAB'|'EXAM';
export type SubmissionStatus = 'DRAFT'|'SUBMITTED';
export type NotificationType = 'ASSIGNMENT_DUE'|'ANNOUNCEMENT'|'GRADE_PUBLISHED'|'SYSTEM';
export interface User { id:string; email:string; fullName:string; role:Role; groupId?:string|null; group?:{id?:string;name:string}|null; createdAt?:string; }
export interface Group { id:string; name:string; degree?:string|null; year?:number|null; _count?:{users:number}; }
export interface Course { id:string; code:string; title:string; description:string; teacherId?:string|null; semester:string; teacher?:{id:string;fullName:string;email?:string}|null; _count?:{enrollments:number;assignments:number}; roleInCourse?:CourseRole; }
export interface Enrollment { id:string; userId:string; courseId:string; roleInCourse:CourseRole; user?:User; course?:{id:string;code:string;title:string}; }
export interface Announcement { id:string; courseId?:string|null; authorId:string; title:string; body:string; createdAt:string; author?:{fullName:string}; course?:{id:string;code:string;title:string}|null; }
export interface Assignment { id:string; courseId:string; title:string; description:string; dueAt:string; maxScore:number; _count?:{submissions:number}; course?:{id:string;code:string;title:string}; }
export interface Submission { id:string; assignmentId:string; studentId:string; contentText?:string|null; contentUrl?:string|null; submittedAt?:string|null; status:SubmissionStatus; student?:User; grade?:Grade|null; }
export interface Grade { id:string; submissionId:string; gradedById:string; score:number; feedback?:string|null; gradedAt:string; gradedBy?:{fullName:string}; submission?:Submission&{assignment?:Assignment&{course?:{id:string;code:string;title:string}}}; }
export interface ScheduleItem { id:string; courseId:string; startsAt:string; endsAt:string; room:string; type:ScheduleType; course?:{id:string;code:string;title:string}; group?:{name:string}|null; }
export interface Notification { id:string; userId:string; type:NotificationType; title:string; body?:string|null; link?:string|null; isRead:boolean; createdAt:string; }
export interface AuthResponse { accessToken:string; refreshToken:string; user:User; }
export interface CalendarData { scheduleItems:ScheduleItem[]; assignments:Assignment[]; }
