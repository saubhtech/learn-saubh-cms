// ====================================
// DATABASE TYPE DEFINITIONS (MATCH SQL)
// ====================================

// ---- Language Table ----
export interface Language {
  langid: number;
  lang_name: string;
  euserid?: number;
  edate?: Date;
  del?: boolean;
}

// ---- Exam Table ----
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

  // UI JOIN
  lang_name?: string;
  subject_count?: number;
}

// ---- Subject Table ----
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

  // UI JOIN
  lang_name?: string;
  exam_name?: string;
  unit_count?: number;
  lesson_count?: number;
}

// ---- Unit Table ----
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

  // UI JOIN
  lang_name?: string;
  subject_name?: string;
  exam_name?: string;
}

// ---- Lesson Table ----
export interface Lesson {
  lessonid?: number;
  langid: number;
  examid?: number;
  subjectid: number;
  unitid?: number;
  lesson: string;
  content?: string;
  topicid?: number[]; // SQL = INTEGER[]
  lesson_doc?: string[]; 
  lesson_audio?: string[];
  lesson_video?: string[];
  marks_total?: number;
  euserid: number;
  edate?: Date;
  del?: boolean;

  // UI JOIN
  lang_name?: string;
  subject_name?: string;
  unit_name?: string;
  exam_name?: string;
}

// ---- Topic Table ----
export interface Topic {
  topicid?: number;
  langid: number;
  examid?: number;
  subjectid?: number;
  lessonid: number;
  topic: string;
  explain?: string;
  topic_doc?: string[];
  topic_audio?: string[];
  topic_video?: string[];
  euserid: number;
  edate?: Date;
  del?: boolean;

  // UI JOIN
  lang_name?: string;
  lesson_name?: string;
  subject_name?: string;
  exam_name?: string;
}

// ---- Descriptive Question (equest) ----
export interface Question {
  questid?: number;
  langid: number;
  topicid: number[];
  question: string;
  quest_doc?: string[];
  answer: string;
  answer_doc?: string[];
  explain?: string;
  euserid: number;
  edate?: Date;
  del?: boolean;

  // UI JOIN
  lang_name?: string;
  topics?: { topicid: number; topic: string }[];
}

// ---- MCQ (emcq) ----
export interface MCQ {
  mcqid?: number;
  langid: number;
  lessonid: number[];
  question: string;
  quest_doc?: string[];
  option1: string;
  option2: string;
  option3?: string;
  option4?: string;
  answer: '1' | '2' | '3' | '4';
  answer_doc?: string[];
  explain?: string;
  euserid: number;
  edate?: Date;
  del?: boolean;

  // UI JOIN
  lang_name?: string;
  lessons?: { lessonid: number; lesson: string }[];
}

// ---- Teacher ----
export interface Teacher {
  teacherid?: number;
  userid: number;
  langid: number[];
  examid: number;
  subjectid: number;
  euserid: number;
  edate?: Date;
  del?: boolean;

  // UI join
  lang_names?: string[];
  exam_name?: string;
  subject_name?: string;
}

// ---- Learner ----
export interface Learner {
  learnerid?: number;
  userid: number;
  langid: number;
  examid: number;
  subjectid: number;
  euserid: number;
  edate?: Date;
  del?: boolean;

  // UI JOIN
  lang_name?: string;
  exam_name?: string;
  subject_name?: string;
}

// ---- Test Result (eresult) ----
export interface Result {
  resultid?: number;
  learnerid: number;
  equestestid?: number;
  marks_total?: number;
  marks_pass?: number;
  marks_scored?: number;
  time_total?: number;
  time_taken?: number;
  completed?: boolean;
  euserid: number;
  edate?: Date;

  // UI JOIN
  learner_name?: string;
  exam_name?: string;
  subject_name?: string;
  score_percentage?: number;
}

// ---- Question Test Session (equestest) ----
export interface QuesTest {
  equestestid?: number;
  learnerid: number;
  mcqid: number[];
  time_spent?: number;
  euserid: number;
  edate?: Date;
}

// ---- Individual MCQ Answer (etest) ----
export interface Test {
  testid?: number;
  resultid: number;
  learnerid: number;
  mcqid: number;
  opted?: '1' | '2' | '3' | '4';
  euserid: number;
  edate?: Date;
}

// Table Names (optional utils)
export type TableName =
  | 'elanguage'
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

// Generic API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}