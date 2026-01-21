// Database Types
export interface Exam {
  examid?: number;
  langid: number;
  exam: string;
  syllabus?: string;
  exam_doc?: string;
  marks_total?: number;
  euserid: number;
  edate?: Date;
  del?: boolean;
}

export interface Subject {
  subjectid?: number;
  langid: number;
  examid: number;
  subject: string;
  syllabus?: string;
  subj_doc?: string;
  marks_total?: number;
  marks_theory?: number;
  marks_activity?: number;
  marks_practicum?: number;
  pass_total?: number;
  pass_practicum?: number;
  euserid: number;
  edate?: Date;
  del?: boolean;
}

export interface Unit {
  unitid?: number;
  langid: number;
  subjectid: number;
  unit: string;
  chapter?: string;
  unit_doc?: string;
  marks_total?: number;
  euserid: number;
  edate?: Date;
  del?: boolean;
}

export interface Lesson {
  lessonid?: number;
  langid: number;
  subjectid: number;
  unitid?: number;
  lesson: string;
  content?: string;
  topicid?: number[];
  lesson_doc?: string[];
  lesson_audio?: string[];
  lesson_video?: string[];
  marks_total?: number;
  euserid: number;
  edate?: Date;
  del?: boolean;

  // UI Only (JOIN)
  subject_name?: string;
  unit_name?: string;
  exam_name?: string;
}



export interface Topic {
  topicid?: number;
  langid: number;
  lessonid: number;
  topic: string;
  content?: string;
  topic_doc?: string[];
  topic_audio?: string[];
  topic_video?: string[];
  marks_total?: number;
  euserid: number;
  edate?: Date;
  del?: boolean;
}

export interface Question {
  questid?: number;
  langid: number;
  question: string;
  answer?: string;
  lessonid?: number[];
  quest_doc?: string[];
  quest_audio?: string[];
  quest_video?: string[];
  marks?: number;
  euserid: number;
  edate?: Date;
  del?: boolean;
}

export interface MCQ {
  mcqid?: number;
  langid: number;
  question: string;
  option1: string;
  option2: string;
  option3?: string;
  option4?: string;
  option5?: string;
  answer: number;
  lessonid?: number[];
  mcq_doc?: string[];
  mcq_audio?: string[];
  mcq_video?: string[];
  marks?: number;
  euserid: number;
  edate?: Date;
  del?: boolean;
}

export interface Teacher {
  teacherid?: number;
  userid: number;
  examid: number[];
  subjectid: number[];
  langid: number[];
  euserid: number;
  edate?: Date;
  del?: boolean;
}

export interface Learner {
  learnerid?: number;
  userid: number;
  examid: number;
  subjectid: number;
  euserid: number;
  edate?: Date;
  del?: boolean;
}

export interface Result {
  resultid?: number;
  learnerid: number;
  equestestid: number;
  marks_total: number;
  marks_scored?: number;
  completed?: boolean;
  euserid: number;
  edate?: Date;
}

export interface QuesTest {
  equestestid?: number;
  learnerid: number;
  mcqid: number[];
  euserid: number;
  edate?: Date;
}

export interface Test {
  testid?: number;
  resultid: number;
  learnerid: number;
  mcqid: number;
  opted?: number;
  euserid: number;
  edate?: Date;
}

export type TableName = 
  | 'exam' 
  | 'esubject' 
  | 'eunit' 
  | 'elesson' 
  | 'etopic' 
  | 'equest' 
  | 'emcq' 
  | 'eteacher' 
  | 'elearner' 
  | 'eresult' 
  | 'equestest' 
  | 'etest';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
