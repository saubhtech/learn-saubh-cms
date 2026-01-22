'use client';

import { useEffect, useState } from 'react';

interface TestSummary {
  learnerid: number;
  userid: number;
  exam_name: string;
  subject_name: string;
  total_tests: number;
  avg_score_percentage: number | null;
  completed_tests: number;
}

interface TestDetailQuestion {
  testid: number;
  mcqid: number;
  question: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  option4: string | null;
  option5: string | null;
  correct: number;  // The correct answer number (1-5)
  opted: string | null;  // The option learner selected ('1', '2', '3', '4', '5')
}

interface TestScore {
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
}

export default function TestsPage() {
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailQuestions, setDetailQuestions] = useState<TestDetailQuestion[]>([]);
  const [detailScore, setDetailScore] = useState<TestScore | null>(null);
  const [activeResultId, setActiveResultId] = useState<number | null>(null);
  const [selectedLearner, setSelectedLearner] = useState<TestSummary | null>(null);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await fetch('/api/tests');
      const data = await res.json();
      if (data.success) {
        setTests(data.data);
      } else {
        alert('Failed to load tests: ' + data.error);
      }
    } catch (err) {
      console.error('Fetch tests error:', err);
      alert('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (learner: TestSummary, resultid: number) => {
    setDetailLoading(true);
    setShowModal(true);
    setActiveResultId(resultid);
    setSelectedLearner(learner);
    setDetailQuestions([]);
    setDetailScore(null);

    try {
      const [detailsRes, scoreRes] = await Promise.all([
        fetch(`/api/tests/details?resultid=${resultid}`),
        fetch(`/api/tests/score?resultid=${resultid}`)
      ]);

      const detailsData = await detailsRes.json();
      const scoreData = await scoreRes.json();

      if (detailsData.success) {
        setDetailQuestions(detailsData.data);
      } else {
        console.error('Details error:', detailsData.error);
      }

      if (scoreData.success) {
        setDetailScore(scoreData.data);
      } else {
        console.error('Score error:', scoreData.error);
      }

    } catch (err) {
      console.error('Load details error:', err);
      alert('Failed to load test details');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setActiveResultId(null);
    setSelectedLearner(null);
    setDetailQuestions([]);
    setDetailScore(null);
  };

  const getOptionText = (question: TestDetailQuestion, optionNum: number): string => {
    switch (optionNum) {
      case 1: return question.option1 || '';
      case 2: return question.option2 || '';
      case 3: return question.option3 || '';
      case 4: return question.option4 || '';
      case 5: return question.option5 || '';
      default: return '';
    }
  };

  const isCorrect = (question: TestDetailQuestion): boolean => {
    return question.opted !== null && parseInt(question.opted) === question.correct;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Tests & Results</h1>
          <p className="text-gray-600 mt-1">
            View test history, learner performance, and detailed results
          </p>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Learner ID</th>
                <th>User ID</th>
                <th>Exam</th>
                <th>Subject</th>
                <th>Total Tests</th>
                <th>Completed</th>
                <th>Avg Score</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : tests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No test results found
                  </td>
                </tr>
              ) : (
                tests.map((t) => (
                  <tr key={t.learnerid}>
                    <td className="font-medium">{t.learnerid}</td>
                    <td>{t.userid}</td>
                    <td>{t.exam_name}</td>
                    <td>{t.subject_name}</td>
                    <td>{t.total_tests}</td>
                    <td>{t.completed_tests}</td>
                    <td>
                      {t.avg_score_percentage !== null
                        ? `${t.avg_score_percentage.toFixed(1)}%`
                        : 'N/A'}
                    </td>
                    <td>
                      <button
                        onClick={() => openDetails(t, t.learnerid)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Test Details</h2>
                {selectedLearner && (
                  <p className="text-sm text-gray-600 mt-1">
                    Learner: {selectedLearner.userid} | {selectedLearner.exam_name} - {selectedLearner.subject_name}
                  </p>
                )}
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-3xl font-bold leading-none"
                type="button"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {detailLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <>
                  {/* Score Summary */}
                  {detailScore && (
                    <div className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-gray-600">Total Questions</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {detailScore.total_questions || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Correct Answers</p>
                          <p className="text-2xl font-bold text-green-600">
                            {detailScore.correct_answers || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Score</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {detailScore.score_percentage != null 
                              ? `${detailScore.score_percentage.toFixed(1)}%`
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Questions List */}
                  {detailQuestions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No questions found for this test</p>
                  ) : (
                    <div className="space-y-4">
                      {detailQuestions.map((q, index) => {
                        const correct = isCorrect(q);
                        return (
                          <div
                            key={q.testid}
                            className={`border rounded-lg p-4 ${
                              correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <p className="font-semibold text-gray-800">
                                Q{index + 1}. {q.question}
                              </p>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  correct ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                                }`}
                              >
                                {correct ? '✓ Correct' : '✗ Wrong'}
                              </span>
                            </div>

                            <div className="space-y-2 text-sm">
                              {[1, 2, 3, 4, 5].map((optNum) => {
                                const optText = getOptionText(q, optNum);
                                if (!optText) return null;

                                const isCorrectOption = optNum === q.correct;
                                const isSelectedOption = q.opted === optNum.toString();

                                return (
                                  <div
                                    key={optNum}
                                    className={`p-2 rounded ${
                                      isCorrectOption
                                        ? 'bg-green-100 border border-green-300 font-medium'
                                        : isSelectedOption
                                        ? 'bg-red-100 border border-red-300'
                                        : 'bg-white'
                                    }`}
                                  >
                                    <span className="font-medium">{optNum}.</span> {optText}
                                    {isCorrectOption && (
                                      <span className="ml-2 text-green-700 font-bold">✓ Correct</span>
                                    )}
                                    {isSelectedOption && !isCorrectOption && (
                                      <span className="ml-2 text-red-700 font-bold">✗ Your Answer</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                              <span className="font-medium">Your Answer:</span>{' '}
                              {q.opted ? `Option ${q.opted}` : 'Not Attempted'}
                              {' | '}
                              <span className="font-medium">Correct Answer:</span> Option {q.correct}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t">
              <button
                onClick={closeModal}
                className="w-full btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}