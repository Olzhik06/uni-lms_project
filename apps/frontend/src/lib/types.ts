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
export interface CourseMaterial { id:string; courseId:string; title:string; type:'link'|'file'|'text'; url?:string|null; content?:string|null; createdAt:string; }
export interface Attendance { id:string; courseId:string; studentId:string; date:string; status:'PRESENT'|'ABSENT'|'LATE'; createdAt:string; student?:{id:string;fullName:string;email?:string}; }
export interface ActivityLog { id:string; userId:string; action:string; entity:string; entityId?:string|null; createdAt:string; user?:{id:string;fullName:string;email:string;role:Role}; }
export interface AdminStats { users:{total:number;students:number;teachers:number}; courses:number; assignments:number; submissions:number; enrollments:number; grades:number; }
export interface CourseProgress { courseId:string; progress:number; completedAssignments:number; totalAssignments:number; }
export interface SearchResults { courses:{id:string;code:string;title:string;description:string}[]; materials:{id:string;courseId:string;title:string;type:string;url?:string|null;course?:{code:string;title:string}}[]; assignments:{id:string;courseId:string;title:string;description:string;dueAt:string;course?:{code:string;title:string}}[]; }
export interface AuthResponse { accessToken:string; refreshToken:string; user:User; }
export interface CalendarData { scheduleItems:ScheduleItem[]; assignments:Assignment[]; }
