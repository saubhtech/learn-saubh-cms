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
  mcqid: number;
  question: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  option4: string | null;
  correct: string;
  opted: string | null;
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

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await fetch('/api/tests');
      const data = await res.json();
      if (data.success) {
        setTests(data.data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (resultid: number) => {
    setDetailLoading(true);
    setShowModal(true);
    setActiveResultId(resultid);

    try {
      const [detailsRes, scoreRes] = await Promise.all([
        fetch(`/api/tests/details?resultid=${resultid}`),
        fetch(`/api/tests/score?resultid=${resultid}`)
      ]);

      const detailsData = await detailsRes.json();
      const scoreData = await scoreRes.json();

      if (detailsData.success) setDetailQuestions(detailsData.data);
      if (scoreData.success) setDetailScore(scoreData.data);

    } catch (err) {
      console.error(err);
      alert('Failed to load test details');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Tests & Results Management</h1>
          <p className="text-gray-600 mt-1">
            View test history, learner performance, and scoring
          </p>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Learner</th>
                <th>Exam</th>
                <th>Subject</th>
                <th>Total Tests</th>
                <th>Completed</th>
                <th>Avg %</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    Loading...
                  </td>
                </tr>
              ) : tests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No Tests Found
                  </td>
                </tr>
              ) : (
                tests.map((t, index) => (
                  <tr key={index}>
                    <td>{t.userid}</td>
                    <td>{t.exam_name}</td>
                    <td>{t.subject_name}</td>
                    <td>{t.total_tests}</td>
                    <td>{t.completed_tests}</td>
                    <td>
                      {t.avg_score_percentage !== null
                        ? `${t.avg_score_percentage.toFixed(2)}%`
                        : 'N/A'}
                    </td>
                    <td>
                      <button
                        onClick={() => openDetails(t.learnerid)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">Test Details</h2>

            {detailLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <>
                {detailScore && (
                  <div className="mb-4 border rounded p-3">
                    <p>Total Questions: {detailScore.total_questions}</p>
                    <p>Correct: {detailScore.correct_answers}</p>
                    <p>Score: {detailScore.score_percentage}%</p>
                  </div>
                )}

                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {detailQuestions.map((q) => (
                    <div key={q.mcqid} className="border rounded p-3">
                      <p className="font-semibold mb-2">{q.question}</p>
                      <div className="text-sm space-y-1">
                        <p>1. {q.option1}</p>
                        <p>2. {q.option2}</p>
                        <p>3. {q.option3}</p>
                        <p>4. {q.option4}</p>
                      </div>
                      <p className="mt-2 text-sm">
                        Correct: <span className="font-medium">{q.correct}</span>
                        {' | '}
                        Opted:{' '}
                        <span className="font-medium">{q.opted ?? 'Not Attempted'}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full btn btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
