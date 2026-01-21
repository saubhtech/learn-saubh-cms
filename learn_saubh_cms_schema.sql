-- ============================================================================
-- LEARN.SAUBH.IN - Educational CMS Database Schema
-- Database: saubh | Host: 88.222.241.228 | Port: 5432
-- Created: 2025 | PostgreSQL 18.1
-- ============================================================================
-- This schema implements a multi-lingual educational content management system
-- with support for exams, subjects, units, lessons, topics, questions (MCQ & descriptive),
-- teacher assignments, learner enrollments, and test results tracking.
-- ============================================================================

-- ============================================================================
-- SECTION 1: CLEANUP (Drop existing tables in reverse dependency order)
-- ============================================================================
-- Uncomment the following lines if you need to recreate the schema

-- DROP TABLE IF EXISTS etest CASCADE;
-- DROP TABLE IF EXISTS equestest CASCADE;
-- DROP TABLE IF EXISTS eresult CASCADE;
-- DROP TABLE IF EXISTS elearner CASCADE;
-- DROP TABLE IF EXISTS eteacher CASCADE;
-- DROP TABLE IF EXISTS emcq CASCADE;
-- DROP TABLE IF EXISTS equest CASCADE;
-- DROP TABLE IF EXISTS etopic CASCADE;
-- DROP TABLE IF EXISTS elesson CASCADE;
-- DROP TABLE IF EXISTS eunit CASCADE;
-- DROP TABLE IF EXISTS esubject CASCADE;
-- DROP TABLE IF EXISTS exam CASCADE;

-- ============================================================================
-- SECTION 2: CREATE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table 1: exam
-- Purpose: Master table for examinations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam (
    examid          SERIAL PRIMARY KEY,
    langid          SMALLINT NOT NULL,
    exam            VARCHAR(255) NOT NULL,
    syllabus        TEXT,
    exam_doc        VARCHAR(512),                   -- Upload URL for exam document
    marks_total     INTEGER,
    euserid         BIGINT NOT NULL,                -- Created/Modified by user
    edate           DATE NOT NULL DEFAULT CURRENT_DATE,
    del             BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Constraints
    CONSTRAINT exam_langid_positive CHECK (langid > 0),
    CONSTRAINT exam_marks_positive CHECK (marks_total IS NULL OR marks_total >= 0)
);

COMMENT ON TABLE exam IS 'Master table for examinations in the educational CMS';
COMMENT ON COLUMN exam.examid IS 'Primary key - Auto-incrementing exam identifier';
COMMENT ON COLUMN exam.langid IS 'Language identifier for multi-lingual support';
COMMENT ON COLUMN exam.exam IS 'Name/title of the examination';
COMMENT ON COLUMN exam.syllabus IS 'Detailed syllabus content';
COMMENT ON COLUMN exam.exam_doc IS 'URL to uploaded exam document';
COMMENT ON COLUMN exam.marks_total IS 'Total marks for the examination';
COMMENT ON COLUMN exam.euserid IS 'User ID who created/last modified this record';
COMMENT ON COLUMN exam.edate IS 'Date of creation/modification';
COMMENT ON COLUMN exam.del IS 'Soft delete flag (FALSE=active, TRUE=deleted)';

-- ----------------------------------------------------------------------------
-- Table 2: esubject
-- Purpose: Subjects within an examination
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS esubject (
    subjectid       SERIAL PRIMARY KEY,
    langid          SMALLINT NOT NULL,
    examid          INTEGER NOT NULL,
    subject         VARCHAR(255) NOT NULL,
    syllabus        TEXT,
    subj_doc        VARCHAR(512),                   -- Upload URL for subject document
    marks_total     INTEGER,
    marks_theory    INTEGER,
    marks_activity  INTEGER,
    marks_practicum INTEGER,
    pass_total      INTEGER,
    pass_practicum  INTEGER,
    euserid         BIGINT NOT NULL,
    edate           DATE NOT NULL DEFAULT CURRENT_DATE,
    del             BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Foreign Keys
    CONSTRAINT fk_esubject_exam FOREIGN KEY (examid) 
        REFERENCES exam(examid) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Constraints
    CONSTRAINT esubject_langid_positive CHECK (langid > 0),
    CONSTRAINT esubject_marks_valid CHECK (
        (marks_total IS NULL OR marks_total >= 0) AND
        (marks_theory IS NULL OR marks_theory >= 0) AND
        (marks_activity IS NULL OR marks_activity >= 0) AND
        (marks_practicum IS NULL OR marks_practicum >= 0) AND
        (pass_total IS NULL OR pass_total >= 0) AND
        (pass_practicum IS NULL OR pass_practicum >= 0)
    )
);

COMMENT ON TABLE esubject IS 'Subjects within an examination';
COMMENT ON COLUMN esubject.subjectid IS 'Primary key - Auto-incrementing subject identifier';
COMMENT ON COLUMN esubject.examid IS 'Foreign key reference to exam table';
COMMENT ON COLUMN esubject.subject IS 'Name/title of the subject';
COMMENT ON COLUMN esubject.marks_theory IS 'Marks allocated for theory component';
COMMENT ON COLUMN esubject.marks_activity IS 'Marks allocated for activity component';
COMMENT ON COLUMN esubject.marks_practicum IS 'Marks allocated for practicum/practical component';
COMMENT ON COLUMN esubject.pass_total IS 'Minimum marks required to pass overall';
COMMENT ON COLUMN esubject.pass_practicum IS 'Minimum marks required to pass practicum';

-- ----------------------------------------------------------------------------
-- Table 3: eunit
-- Purpose: Units within a subject
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eunit (
    unitid          SERIAL PRIMARY KEY,
    langid          SMALLINT NOT NULL,
    subjectid       INTEGER NOT NULL,
    unit            VARCHAR(255) NOT NULL,
    chapter         TEXT,
    unit_doc        VARCHAR(512),                   -- Upload URL for unit document
    marks_total     INTEGER,
    euserid         BIGINT NOT NULL,
    edate           DATE NOT NULL DEFAULT CURRENT_DATE,
    del             BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Foreign Keys
    CONSTRAINT fk_eunit_subject FOREIGN KEY (subjectid) 
        REFERENCES esubject(subjectid) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Constraints
    CONSTRAINT eunit_langid_positive CHECK (langid > 0),
    CONSTRAINT eunit_marks_positive CHECK (marks_total IS NULL OR marks_total >= 0)
);

COMMENT ON TABLE eunit IS 'Units/chapters within a subject';
COMMENT ON COLUMN eunit.unitid IS 'Primary key - Auto-incrementing unit identifier';
COMMENT ON COLUMN eunit.subjectid IS 'Foreign key reference to esubject table';
COMMENT ON COLUMN eunit.unit IS 'Name/title of the unit';
COMMENT ON COLUMN eunit.chapter IS 'Chapter content or description';

-- ----------------------------------------------------------------------------
-- Table 4: elesson
-- Purpose: Lessons within a unit (supports multiple media uploads)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS elesson (
    lessonid        SERIAL PRIMARY KEY,
    langid          SMALLINT NOT NULL,
    subjectid       INTEGER NOT NULL,
    unitid          INTEGER,                        -- Optional - lesson can be directly under subject
    lesson          VARCHAR(255) NOT NULL,
    content         TEXT,
    topicid         INTEGER[],                      -- Array of related topic IDs
    lesson_doc      VARCHAR(512)[],                 -- Array of document URLs (multi-upload)
    lesson_audio    VARCHAR(512)[],                 -- Array of audio URLs (multi-upload)
    lesson_video    VARCHAR(512)[],                 -- Array of video URLs (multi-upload)
    marks_total     INTEGER,
    euserid         BIGINT NOT NULL,
    edate           DATE NOT NULL DEFAULT CURRENT_DATE,
    del             BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Foreign Keys
    CONSTRAINT fk_elesson_subject FOREIGN KEY (subjectid) 
        REFERENCES esubject(subjectid) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_elesson_unit FOREIGN KEY (unitid) 
        REFERENCES eunit(unitid) ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Constraints
    CONSTRAINT elesson_langid_positive CHECK (langid > 0),
    CONSTRAINT elesson_marks_positive CHECK (marks_total IS NULL OR marks_total >= 0)
);

COMMENT ON TABLE elesson IS 'Lessons within a unit with multi-media support';
COMMENT ON COLUMN elesson.lessonid IS 'Primary key - Auto-incrementing lesson identifier';
COMMENT ON COLUMN elesson.unitid IS 'Optional foreign key to eunit (NULL if directly under subject)';
COMMENT ON COLUMN elesson.topicid IS 'Array of related topic IDs for cross-referencing';
COMMENT ON COLUMN elesson.lesson_doc IS 'Array of document upload URLs';
COMMENT ON COLUMN elesson.lesson_audio IS 'Array of audio upload URLs';
COMMENT ON COLUMN elesson.lesson_video IS 'Array of video upload URLs';

-- ----------------------------------------------------------------------------
-- Table 5: etopic
-- Purpose: Topics within a lesson
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS etopic (
    topicid         SERIAL PRIMARY KEY,
    langid          SMALLINT NOT NULL,
    lessonid        INTEGER NOT NULL,
    topic           VARCHAR(255) NOT NULL,
    explain         TEXT,
    topic_doc       VARCHAR(512),                   -- Upload URL for topic document
    topic_audio     VARCHAR(512),                   -- Upload URL for topic audio
    topic_video     VARCHAR(512),                   -- Upload URL for topic video
    euserid         BIGINT NOT NULL,
    edate           DATE NOT NULL DEFAULT CURRENT_DATE,
    del             BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Foreign Keys
    CONSTRAINT fk_etopic_lesson FOREIGN KEY (lessonid) 
        REFERENCES elesson(lessonid) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Constraints
    CONSTRAINT etopic_langid_positive CHECK (langid > 0)
);

COMMENT ON TABLE etopic IS 'Topics within a lesson with media support';
COMMENT ON COLUMN etopic.topicid IS 'Primary key - Auto-incrementing topic identifier';
COMMENT ON COLUMN etopic.lessonid IS 'Foreign key reference to elesson table';
COMMENT ON COLUMN etopic.explain IS 'Detailed explanation of the topic';

-- ----------------------------------------------------------------------------
-- Table 6: equest
-- Purpose: Descriptive/Essay questions linked to lessons
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equest (
    questid         SERIAL PRIMARY KEY,
    langid          SMALLINT NOT NULL,
    lessonid        INTEGER[] NOT NULL,             -- Array of lesson IDs (question can span multiple lessons)
    question        TEXT NOT NULL,
    quest_doc       VARCHAR(512),                   -- Upload URL for question document/image
    answer          TEXT NOT NULL,
    answer_doc      VARCHAR(512),                   -- Upload URL for answer document/image
    explain         TEXT,
    euserid         BIGINT NOT NULL,
    edate           DATE NOT NULL DEFAULT CURRENT_DATE,
    del             BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Constraints
    CONSTRAINT equest_langid_positive CHECK (langid > 0),
    CONSTRAINT equest_lessonid_not_empty CHECK (array_length(lessonid, 1) > 0)
);

COMMENT ON TABLE equest IS 'Descriptive/Essay questions for examinations';
COMMENT ON COLUMN equest.questid IS 'Primary key - Auto-incrementing question identifier';
COMMENT ON COLUMN equest.lessonid IS 'Array of lesson IDs this question relates to';
COMMENT ON COLUMN equest.question IS 'Question text';
COMMENT ON COLUMN equest.quest_doc IS 'URL to question attachment (image/document)';
COMMENT ON COLUMN equest.answer IS 'Model answer text';
COMMENT ON COLUMN equest.answer_doc IS 'URL to answer attachment (image/document)';
COMMENT ON COLUMN equest.explain IS 'Additional explanation for the answer';

-- ----------------------------------------------------------------------------
-- Table 7: emcq
-- Purpose: Multiple Choice Questions linked to lessons
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emcq (
    mcqid           SERIAL PRIMARY KEY,
    langid          SMALLINT NOT NULL,
    lessonid        INTEGER[] NOT NULL,             -- Array of lesson IDs
    question        TEXT NOT NULL,
    quest_doc       VARCHAR(512),                   -- Upload URL for question document/image
    option1         TEXT,
    option2         TEXT,
    option3         TEXT,
    option4         TEXT,
    answer          CHAR(1) NOT NULL,               -- Correct answer: 1, 2, 3, or 4
    answer_doc      VARCHAR(512),                   -- Upload URL for answer explanation document
    explain         TEXT,
    euserid         BIGINT NOT NULL,
    edate           DATE NOT NULL DEFAULT CURRENT_DATE,
    del             BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Constraints
    CONSTRAINT emcq_langid_positive CHECK (langid > 0),
    CONSTRAINT emcq_lessonid_not_empty CHECK (array_length(lessonid, 1) > 0),
    CONSTRAINT emcq_answer_valid CHECK (answer IN ('1', '2', '3', '4'))
);

COMMENT ON TABLE emcq IS 'Multiple Choice Questions for examinations';
COMMENT ON COLUMN emcq.mcqid IS 'Primary key - Auto-incrementing MCQ identifier';
COMMENT ON COLUMN emcq.lessonid IS 'Array of lesson IDs this MCQ relates to';
COMMENT ON COLUMN emcq.option1 IS 'Option 1 text';
COMMENT ON COLUMN emcq.option2 IS 'Option 2 text';
COMMENT ON COLUMN emcq.option3 IS 'Option 3 text';
COMMENT ON COLUMN emcq.option4 IS 'Option 4 text';
COMMENT ON COLUMN emcq.answer IS 'Correct answer (1, 2, 3, or 4)';

-- ----------------------------------------------------------------------------
-- Table 8: eteacher
-- Purpose: Teacher assignments to subjects/exams
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eteacher (
    teacherid       SERIAL PRIMARY KEY,
    userid          INTEGER NOT NULL,               -- Reference to user system
    langid          SMALLINT[] NOT NULL,            -- Array of languages teacher can teach
    examid          INTEGER NOT NULL,
    subjectid       INTEGER NOT NULL,
    euserid         BIGINT NOT NULL,
    edate           DATE NOT NULL DEFAULT CURRENT_DATE,
    del             BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Foreign Keys
    CONSTRAINT fk_eteacher_exam FOREIGN KEY (examid) 
        REFERENCES exam(examid) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_eteacher_subject FOREIGN KEY (subjectid) 
        REFERENCES esubject(subjectid) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Constraints
    CONSTRAINT eteacher_langid_not_empty CHECK (array_length(langid, 1) > 0)
);

COMMENT ON TABLE eteacher IS 'Teacher assignments to exams and subjects';
COMMENT ON COLUMN eteacher.teacherid IS 'Primary key - Auto-incrementing teacher assignment identifier';
COMMENT ON COLUMN eteacher.userid IS 'Reference to user in authentication system';
COMMENT ON COLUMN eteacher.langid IS 'Array of language IDs the teacher can teach in';

-- Unique constraint to prevent duplicate assignments
CREATE UNIQUE INDEX IF NOT EXISTS idx_eteacher_unique_assignment 
    ON eteacher(userid, examid, subjectid) WHERE del = FALSE;

-- ----------------------------------------------------------------------------
-- Table 9: elearner
-- Purpose: Learner enrollments to subjects/exams
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS elearner (
    learnerid       SERIAL PRIMARY KEY,
    userid          INTEGER NOT NULL,               -- Reference to user system
    langid          SMALLINT NOT NULL,              -- Preferred language
    examid          INTEGER NOT NULL,
    subjectid       INTEGER NOT NULL,
    euserid         BIGINT NOT NULL,
    edate           DATE NOT NULL DEFAULT CURRENT_DATE,
    del             BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Foreign Keys
    CONSTRAINT fk_elearner_exam FOREIGN KEY (examid) 
        REFERENCES exam(examid) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_elearner_subject FOREIGN KEY (subjectid) 
        REFERENCES esubject(subjectid) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Constraints
    CONSTRAINT elearner_langid_positive CHECK (langid > 0)
);

COMMENT ON TABLE elearner IS 'Learner enrollments to exams and subjects';
COMMENT ON COLUMN elearner.learnerid IS 'Primary key - Auto-incrementing learner enrollment identifier';
COMMENT ON COLUMN elearner.userid IS 'Reference to user in authentication system';
COMMENT ON COLUMN elearner.langid IS 'Preferred language ID for the learner';

-- Unique constraint to prevent duplicate enrollments
CREATE UNIQUE INDEX IF NOT EXISTS idx_elearner_unique_enrollment 
    ON elearner(userid, examid, subjectid) WHERE del = FALSE;

-- ----------------------------------------------------------------------------
-- Table 10: eresult
-- Purpose: Test results for learners
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eresult (
    resultid        SERIAL PRIMARY KEY,
    learnerid       INTEGER NOT NULL,
    equestestid     INTEGER,                        -- Reference to question test session
    marks_total     SMALLINT,
    marks_pass      SMALLINT,
    marks_scored    SMALLINT,
    time_total      SMALLINT,                       -- Total time allowed (in minutes/seconds)
    time_taken      SMALLINT,                       -- Time actually taken
    completed       BOOLEAN NOT NULL DEFAULT FALSE,
    euserid         INTEGER NOT NULL,
    edate           TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_eresult_learner FOREIGN KEY (learnerid) 
        REFERENCES elearner(learnerid) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Constraints
    CONSTRAINT eresult_marks_valid CHECK (
        (marks_total IS NULL OR marks_total >= 0) AND
        (marks_pass IS NULL OR marks_pass >= 0) AND
        (marks_scored IS NULL OR marks_scored >= 0)
    ),
    CONSTRAINT eresult_time_valid CHECK (
        (time_total IS NULL OR time_total >= 0) AND
        (time_taken IS NULL OR time_taken >= 0)
    )
);

COMMENT ON TABLE eresult IS 'Test results and scores for learners';
COMMENT ON COLUMN eresult.resultid IS 'Primary key - Auto-incrementing result identifier';
COMMENT ON COLUMN eresult.learnerid IS 'Foreign key reference to elearner table';
COMMENT ON COLUMN eresult.equestestid IS 'Reference to the question test session';
COMMENT ON COLUMN eresult.marks_total IS 'Total marks possible';
COMMENT ON COLUMN eresult.marks_pass IS 'Marks required to pass';
COMMENT ON COLUMN eresult.marks_scored IS 'Actual marks scored by learner';
COMMENT ON COLUMN eresult.time_total IS 'Total time allowed for the test';
COMMENT ON COLUMN eresult.time_taken IS 'Actual time taken by learner';
COMMENT ON COLUMN eresult.completed IS 'Whether the test was completed';

-- ----------------------------------------------------------------------------
-- Table 11: equestest
-- Purpose: Question test sessions tracking MCQ attempts
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equestest (
    equestestid     SERIAL PRIMARY KEY,
    learnerid       INTEGER NOT NULL,
    mcqid           INTEGER[],                      -- Array of MCQ IDs in this test
    mcq_done        INTEGER[],                      -- Array of MCQ IDs completed
    time_spent      INTEGER,                        -- Time spent in seconds
    euserid         INTEGER NOT NULL,
    edate           TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_equestest_learner FOREIGN KEY (learnerid) 
        REFERENCES elearner(learnerid) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Constraints
    CONSTRAINT equestest_time_positive CHECK (time_spent IS NULL OR time_spent >= 0)
);

COMMENT ON TABLE equestest IS 'Question test sessions for tracking MCQ attempts';
COMMENT ON COLUMN equestest.equestestid IS 'Primary key - Auto-incrementing test session identifier';
COMMENT ON COLUMN equestest.learnerid IS 'Foreign key reference to elearner table';
COMMENT ON COLUMN equestest.mcqid IS 'Array of MCQ IDs included in this test';
COMMENT ON COLUMN equestest.mcq_done IS 'Array of MCQ IDs that have been answered';
COMMENT ON COLUMN equestest.time_spent IS 'Total time spent on this test session (in seconds)';

-- Now add the foreign key from eresult to equestest
ALTER TABLE eresult 
    ADD CONSTRAINT fk_eresult_equestest FOREIGN KEY (equestestid) 
    REFERENCES equestest(equestestid) ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------------------------------------------------------
-- Table 12: etest
-- Purpose: Individual test answers (each MCQ answer in a test)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS etest (
    testid          SERIAL PRIMARY KEY,
    resultid        INTEGER NOT NULL,
    learnerid       INTEGER NOT NULL,
    mcqid           INTEGER NOT NULL,
    opted           CHAR(1),                        -- Option selected: 1, 2, 3, 4 or NULL
    euserid         INTEGER NOT NULL,
    edate           TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_etest_result FOREIGN KEY (resultid) 
        REFERENCES eresult(resultid) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_etest_learner FOREIGN KEY (learnerid) 
        REFERENCES elearner(learnerid) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_etest_mcq FOREIGN KEY (mcqid) 
        REFERENCES emcq(mcqid) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Constraints
    CONSTRAINT etest_opted_valid CHECK (opted IS NULL OR opted IN ('1', '2', '3', '4'))
);

COMMENT ON TABLE etest IS 'Individual MCQ answers within a test';
COMMENT ON COLUMN etest.testid IS 'Primary key - Auto-incrementing test answer identifier';
COMMENT ON COLUMN etest.resultid IS 'Foreign key reference to eresult table';
COMMENT ON COLUMN etest.learnerid IS 'Foreign key reference to elearner table';
COMMENT ON COLUMN etest.mcqid IS 'Foreign key reference to emcq table';
COMMENT ON COLUMN etest.opted IS 'Option selected by learner (1, 2, 3, or 4)';

-- Unique constraint to prevent duplicate answers for same MCQ in same result
CREATE UNIQUE INDEX IF NOT EXISTS idx_etest_unique_answer 
    ON etest(resultid, mcqid);

-- ============================================================================
-- SECTION 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- exam indexes
CREATE INDEX IF NOT EXISTS idx_exam_langid ON exam(langid);
CREATE INDEX IF NOT EXISTS idx_exam_del ON exam(del) WHERE del = FALSE;
CREATE INDEX IF NOT EXISTS idx_exam_euserid ON exam(euserid);

-- esubject indexes
CREATE INDEX IF NOT EXISTS idx_esubject_examid ON esubject(examid);
CREATE INDEX IF NOT EXISTS idx_esubject_langid ON esubject(langid);
CREATE INDEX IF NOT EXISTS idx_esubject_del ON esubject(del) WHERE del = FALSE;

-- eunit indexes
CREATE INDEX IF NOT EXISTS idx_eunit_subjectid ON eunit(subjectid);
CREATE INDEX IF NOT EXISTS idx_eunit_langid ON eunit(langid);
CREATE INDEX IF NOT EXISTS idx_eunit_del ON eunit(del) WHERE del = FALSE;

-- elesson indexes
CREATE INDEX IF NOT EXISTS idx_elesson_subjectid ON elesson(subjectid);
CREATE INDEX IF NOT EXISTS idx_elesson_unitid ON elesson(unitid);
CREATE INDEX IF NOT EXISTS idx_elesson_langid ON elesson(langid);
CREATE INDEX IF NOT EXISTS idx_elesson_del ON elesson(del) WHERE del = FALSE;
CREATE INDEX IF NOT EXISTS idx_elesson_topicid ON elesson USING GIN(topicid);

-- etopic indexes
CREATE INDEX IF NOT EXISTS idx_etopic_lessonid ON etopic(lessonid);
CREATE INDEX IF NOT EXISTS idx_etopic_langid ON etopic(langid);
CREATE INDEX IF NOT EXISTS idx_etopic_del ON etopic(del) WHERE del = FALSE;

-- equest indexes
CREATE INDEX IF NOT EXISTS idx_equest_langid ON equest(langid);
CREATE INDEX IF NOT EXISTS idx_equest_del ON equest(del) WHERE del = FALSE;
CREATE INDEX IF NOT EXISTS idx_equest_lessonid ON equest USING GIN(lessonid);

-- emcq indexes
CREATE INDEX IF NOT EXISTS idx_emcq_langid ON emcq(langid);
CREATE INDEX IF NOT EXISTS idx_emcq_del ON emcq(del) WHERE del = FALSE;
CREATE INDEX IF NOT EXISTS idx_emcq_lessonid ON emcq USING GIN(lessonid);

-- eteacher indexes
CREATE INDEX IF NOT EXISTS idx_eteacher_userid ON eteacher(userid);
CREATE INDEX IF NOT EXISTS idx_eteacher_examid ON eteacher(examid);
CREATE INDEX IF NOT EXISTS idx_eteacher_subjectid ON eteacher(subjectid);
CREATE INDEX IF NOT EXISTS idx_eteacher_del ON eteacher(del) WHERE del = FALSE;
CREATE INDEX IF NOT EXISTS idx_eteacher_langid ON eteacher USING GIN(langid);

-- elearner indexes
CREATE INDEX IF NOT EXISTS idx_elearner_userid ON elearner(userid);
CREATE INDEX IF NOT EXISTS idx_elearner_examid ON elearner(examid);
CREATE INDEX IF NOT EXISTS idx_elearner_subjectid ON elearner(subjectid);
CREATE INDEX IF NOT EXISTS idx_elearner_del ON elearner(del) WHERE del = FALSE;

-- eresult indexes
CREATE INDEX IF NOT EXISTS idx_eresult_learnerid ON eresult(learnerid);
CREATE INDEX IF NOT EXISTS idx_eresult_equestestid ON eresult(equestestid);
CREATE INDEX IF NOT EXISTS idx_eresult_completed ON eresult(completed);
CREATE INDEX IF NOT EXISTS idx_eresult_edate ON eresult(edate);

-- equestest indexes
CREATE INDEX IF NOT EXISTS idx_equestest_learnerid ON equestest(learnerid);
CREATE INDEX IF NOT EXISTS idx_equestest_edate ON equestest(edate);
CREATE INDEX IF NOT EXISTS idx_equestest_mcqid ON equestest USING GIN(mcqid);

-- etest indexes
CREATE INDEX IF NOT EXISTS idx_etest_resultid ON etest(resultid);
CREATE INDEX IF NOT EXISTS idx_etest_learnerid ON etest(learnerid);
CREATE INDEX IF NOT EXISTS idx_etest_mcqid ON etest(mcqid);

-- ============================================================================
-- SECTION 4: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get active records only (excludes soft-deleted)
CREATE OR REPLACE FUNCTION get_active_exams(p_langid SMALLINT DEFAULT NULL)
RETURNS TABLE (
    examid INTEGER,
    langid SMALLINT,
    exam VARCHAR,
    syllabus TEXT,
    marks_total INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT e.examid, e.langid, e.exam, e.syllabus, e.marks_total
    FROM exam e
    WHERE e.del = FALSE
      AND (p_langid IS NULL OR e.langid = p_langid)
    ORDER BY e.exam;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate test score
CREATE OR REPLACE FUNCTION calculate_test_score(p_resultid INTEGER)
RETURNS TABLE (
    total_questions INTEGER,
    correct_answers INTEGER,
    score_percentage NUMERIC(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(t.testid)::INTEGER AS total_questions,
        COUNT(CASE WHEN t.opted = m.answer THEN 1 END)::INTEGER AS correct_answers,
        ROUND(
            (COUNT(CASE WHEN t.opted = m.answer THEN 1 END)::NUMERIC / 
             NULLIF(COUNT(t.testid), 0) * 100), 2
        ) AS score_percentage
    FROM etest t
    JOIN emcq m ON t.mcqid = m.mcqid
    WHERE t.resultid = p_resultid;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 5: CREATE VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Active exams with subject count
CREATE OR REPLACE VIEW v_exam_summary AS
SELECT 
    e.examid,
    e.langid,
    e.exam,
    e.syllabus,
    e.marks_total,
    COUNT(DISTINCT s.subjectid) AS subject_count,
    e.edate
FROM exam e
LEFT JOIN esubject s ON e.examid = s.examid AND s.del = FALSE
WHERE e.del = FALSE
GROUP BY e.examid, e.langid, e.exam, e.syllabus, e.marks_total, e.edate;

-- View: Subject hierarchy with unit and lesson counts
CREATE OR REPLACE VIEW v_subject_hierarchy AS
SELECT 
    s.subjectid,
    s.examid,
    e.exam AS exam_name,
    s.langid,
    s.subject,
    s.marks_total,
    COUNT(DISTINCT u.unitid) AS unit_count,
    COUNT(DISTINCT l.lessonid) AS lesson_count
FROM esubject s
JOIN exam e ON s.examid = e.examid AND e.del = FALSE
LEFT JOIN eunit u ON s.subjectid = u.subjectid AND u.del = FALSE
LEFT JOIN elesson l ON s.subjectid = l.subjectid AND l.del = FALSE
WHERE s.del = FALSE
GROUP BY s.subjectid, s.examid, e.exam, s.langid, s.subject, s.marks_total;

-- View: Learner progress summary
CREATE OR REPLACE VIEW v_learner_progress AS
SELECT 
    lr.learnerid,
    lr.userid,
    e.exam AS exam_name,
    s.subject AS subject_name,
    COUNT(DISTINCT r.resultid) AS total_tests,
    AVG(r.marks_scored::NUMERIC / NULLIF(r.marks_total, 0) * 100) AS avg_score_percentage,
    SUM(CASE WHEN r.completed THEN 1 ELSE 0 END) AS completed_tests
FROM elearner lr
JOIN exam e ON lr.examid = e.examid
JOIN esubject s ON lr.subjectid = s.subjectid
LEFT JOIN eresult r ON lr.learnerid = r.learnerid
WHERE lr.del = FALSE
GROUP BY lr.learnerid, lr.userid, e.exam, s.subject;

-- ============================================================================
-- SECTION 6: GRANT PERMISSIONS (Adjust as needed)
-- ============================================================================

-- Grant all privileges on all tables to saubhtech user
-- (Run these if connecting as superuser)

-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO saubhtech;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO saubhtech;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO saubhtech;

-- ============================================================================
-- SCHEMA CREATION COMPLETE
-- ============================================================================
-- Tables created: 12
-- Indexes created: 30+
-- Functions created: 2
-- Views created: 3
-- ============================================================================
