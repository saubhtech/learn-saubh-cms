'use client';

import { useEffect, useState } from 'react';
import { Subject, Exam } from '@/types/database';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<Partial<Subject>>({
    langid: 1,
    examid: 0,
    subject: '',
    syllabus: '',
    subj_doc: '',
    marks_total: 100,
    marks_theory: 80,
    marks_activity: 10,
    marks_practicum: 10,
    pass_total: 35,
    pass_practicum: 5,
    euserid: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subjectsRes, examsRes] = await Promise.all([
        fetch('/api/subjects'),
        fetch('/api/exams')
      ]);
      
      const subjectsData = await subjectsRes.json();
      const examsData = await examsRes.json();
      
      if (subjectsData.success) setSubjects(subjectsData.data);
      if (examsData.success) setExams(examsData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = '/api/subjects';
      const method = editingSubject ? 'PUT' : 'POST';
      const body = editingSubject
        ? { ...formData, subjectid: editingSubject.subjectid }
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
        setEditingSubject(null);
        resetForm();
        fetchData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving subject:', error);
      alert('Failed to save subject');
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      langid: subject.langid,
      examid: subject.examid,
      subject: subject.subject,
      syllabus: subject.syllabus || '',
      subj_doc: subject.subj_doc || '',
      marks_total: subject.marks_total || 100,
      marks_theory: subject.marks_theory || 0,
      marks_activity: subject.marks_activity || 0,
      marks_practicum: subject.marks_practicum || 0,
      pass_total: subject.pass_total || 0,
      pass_practicum: subject.pass_practicum || 0,
      euserid: 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (subjectid: number) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;

    try {
      const response = await fetch(`/api/subjects?subjectid=${subjectid}&euserid=1`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        fetchData();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Failed to delete subject');
    }
  };

  const resetForm = () => {
    setFormData({
      langid: 1,
      examid: 0,
      subject: '',
      syllabus: '',
      subj_doc: '',
      marks_total: 100,
      marks_theory: 80,
      marks_activity: 10,
      marks_practicum: 10,
      pass_total: 35,
      pass_practicum: 5,
      euserid: 1,
    });
  };

  const openAddModal = () => {
    setEditingSubject(null);
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Subjects Management</h1>
          <p className="text-gray-600 mt-1">Manage subjects for each examination</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          Add New Subject
        </button>
      </div>

      {/* Subjects Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Subject Name</th>
                <th>Exam</th>
                <th>Total Marks</th>
                <th>Theory</th>
                <th>Practicum</th>
                <th>Pass Marks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No subjects found. Click "Add New Subject" to create one.
                  </td>
                </tr>
              ) : (
                subjects.map((subject: any) => (
                  <tr key={subject.subjectid}>
                    <td className="font-medium">{subject.subjectid}</td>
                    <td className="font-semibold text-primary-600">{subject.subject}</td>
                    <td>{subject.exam_name || 'N/A'}</td>
                    <td>{subject.marks_total || 0}</td>
                    <td>{subject.marks_theory || 0}</td>
                    <td>{subject.marks_practicum || 0}</td>
                    <td>{subject.pass_total || 0}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(subject)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(subject.subjectid!)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Subject Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Exam *</label>
                      <select
                        className="form-select"
                        value={formData.examid}
                        onChange={(e) => setFormData({ ...formData, examid: parseInt(e.target.value) })}
                        required
                      >
                        <option value="">Select Exam</option>
                        {exams.map((exam) => (
                          <option key={exam.examid} value={exam.examid}>
                            {exam.exam}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="form-label">Language ID *</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.langid}
                        onChange={(e) => setFormData({ ...formData, langid: parseInt(e.target.value) })}
                        required
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="form-label">Total Marks</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.marks_total}
                        onChange={(e) => setFormData({ ...formData, marks_total: parseInt(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="form-label">Pass Marks</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.pass_total}
                        onChange={(e) => setFormData({ ...formData, pass_total: parseInt(e.target.value) })}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="form-label">Theory Marks</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.marks_theory}
                        onChange={(e) => setFormData({ ...formData, marks_theory: parseInt(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="form-label">Activity Marks</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.marks_activity}
                        onChange={(e) => setFormData({ ...formData, marks_activity: parseInt(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="form-label">Practicum Marks</label>
                      <input
                        type="number"
                        className="form-input"
                        value={formData.marks_practicum}
                        onChange={(e) => setFormData({ ...formData, marks_practicum: parseInt(e.target.value) })}
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Pass Practicum</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.pass_practicum}
                      onChange={(e) => setFormData({ ...formData, pass_practicum: parseInt(e.target.value) })}
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="form-label">Syllabus</label>
                    <textarea
                      className="form-textarea"
                      rows={4}
                      value={formData.syllabus}
                      onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Subject Document URL</label>
                    <input
                      type="url"
                      className="form-input"
                      value={formData.subj_doc}
                      onChange={(e) => setFormData({ ...formData, subj_doc: e.target.value })}
                      placeholder="https://example.com/document.pdf"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="submit" className="btn btn-primary flex-1">
                    {editingSubject ? 'Update Subject' : 'Create Subject'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingSubject(null);
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
