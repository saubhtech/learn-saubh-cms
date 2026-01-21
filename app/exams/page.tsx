'use client';

import { useEffect, useState } from 'react';
import { Exam } from '@/types/database';

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [formData, setFormData] = useState<Partial<Exam>>({
    langid: 1,
    exam: '',
    syllabus: '',
    exam_doc: '',
    marks_total: 100,
    euserid: 1,
  });

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/exams');
      const data = await response.json();
      if (data.success) {
        setExams(data.data);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      alert('Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = '/api/exams';
      const method = editingExam ? 'PUT' : 'POST';
      const body = editingExam
        ? { ...formData, examid: editingExam.examid }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        setShowModal(false);
        setEditingExam(null);
        resetForm();
        fetchExams();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving exam:', error);
      alert('Failed to save exam');
    }
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      langid: exam.langid,
      exam: exam.exam,
      syllabus: exam.syllabus || '',
      exam_doc: exam.exam_doc || '',
      marks_total: exam.marks_total || 100,
      euserid: 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (examid: number) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;

    try {
      const response = await fetch(`/api/exams?examid=${examid}&euserid=1`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        fetchExams();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert('Failed to delete exam');
    }
  };

  const resetForm = () => {
    setFormData({
      langid: 1,
      exam: '',
      syllabus: '',
      exam_doc: '',
      marks_total: 100,
      euserid: 1,
    });
  };

  const openAddModal = () => {
    setEditingExam(null);
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Exams Management</h1>
          <p className="text-gray-600 mt-1">Create and manage examination records</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          Add New Exam
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Exam Name</th>
                <th>Language ID</th>
                <th>Total Marks</th>
                <th>Syllabus</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No exams found. Click "Add New Exam" to create one.
                  </td>
                </tr>
              ) : (
                exams.map((exam) => (
                  <tr key={exam.examid}>
                    <td className="font-medium">{exam.examid}</td>
                    <td className="font-semibold text-primary-600">{exam.exam}</td>
                    <td>{exam.langid}</td>
                    <td>{exam.marks_total || 'N/A'}</td>
                    <td className="max-w-xs truncate">
                      {exam.syllabus || 'No syllabus'}
                    </td>
                    <td>{exam.edate ? new Date(exam.edate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(exam)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(exam.examid!)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingExam ? 'Edit Exam' : 'Add New Exam'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Exam Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter exam name"
                      value={formData.exam ?? ""}
                      onChange={(e) => setFormData({ ...formData, exam: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Language ID *</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.langid ?? 1}
                        onChange={(e) => setFormData({ ...formData, langid: Number(e.target.value) })}
                        required
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="form-label">Total Marks</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.marks_total ?? 100}
                        onChange={(e) => setFormData({ ...formData, marks_total: Number(e.target.value) })}
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Syllabus</label>
                    <textarea
                      className="form-textarea"
                      rows={4}
                      placeholder="Enter syllabus details"
                      value={formData.syllabus ?? ""}
                      onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Exam Document URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://example.com/document.pdf"
                      value={formData.exam_doc ?? ""}
                      onChange={(e) => setFormData({ ...formData, exam_doc: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="submit" className="btn btn-primary flex-1">
                    {editingExam ? 'Update Exam' : 'Create Exam'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingExam(null);
                      resetForm();
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
