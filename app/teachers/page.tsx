'use client';

import { useEffect, useState, FormEvent } from 'react';
import { Exam, Subject } from '@/types/database';

interface Language {
  langid: number;
  lang_name: string;
}

interface Teacher {
  teacherid: number;
  userid: number;
  langid: number[];
  examid: number;
  subjectid: number;
  lang_names?: string[];
  exam_name?: string;
  subject_name?: string;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);

  const [form, setForm] = useState({
    userid: 1,
    langid: [] as number[],
    examid: undefined as number | undefined,
    subjectid: undefined as number | undefined,
    euserid: 1,
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [t, e, s, l] = await Promise.all([
        fetch('/api/teachers').then(r => r.json()),
        fetch('/api/exams').then(r => r.json()),
        fetch('/api/subjects').then(r => r.json()),
        fetch('/api/language').then(r => r.json()),
      ]);

      if (t.success) setTeachers(t.data);
      if (e.success) setExams(e.data);
      if (s.success) setSubjects(s.data);
      if (l.success) setLanguages(l.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const reset = () =>
    setForm({ 
      userid: 1, 
      langid: [], 
      examid: undefined, 
      subjectid: undefined, 
      euserid: 1 
    });

  const openAdd = () => {
    setEditing(null);
    reset();
    setShowModal(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.langid?.length) {
      alert('Please select at least one language');
      return;
    }

    if (!form.examid) {
      alert('Please select an exam');
      return;
    }

    if (!form.subjectid) {
      alert('Please select a subject');
      return;
    }

    const method = editing ? 'PUT' : 'POST';
    const body = editing ? { ...form, teacherid: editing.teacherid } : form;

    try {
      const res = await fetch('/api/teachers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => r.json());

      if (res.success) {
        alert(res.message || 'Teacher assignment saved successfully');
        setShowModal(false);
        setEditing(null);
        reset();
        load();
      } else {
        alert(res.error || 'Error saving teacher');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to save teacher');
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditing(teacher);
    setForm({
      userid: teacher.userid,
      langid: Array.isArray(teacher.langid) ? teacher.langid : [],
      examid: teacher.examid,
      subjectid: teacher.subjectid,
      euserid: 1,
    });
    setShowModal(true);
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this teacher assignment?')) return;

    try {
      const res = await fetch(`/api/teachers?teacherid=${id}&euserid=1`, {
        method: 'DELETE',
      }).then(r => r.json());

      if (res.success) {
        alert(res.message || 'Teacher assignment deleted');
        load();
      } else {
        alert(res.error);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete teacher');
    }
  };

  const handleLanguageChange = (langid: number) => {
    const current = form.langid || [];
    const updated = current.includes(langid)
      ? current.filter((id: number) => id !== langid)
      : [...current, langid];
    setForm({ ...form, langid: updated });
  };

  // Filter exams by selected languages
  const filteredExams = form.langid.length > 0
    ? exams.filter(e => form.langid.some(langId => e.langid === langId))
    : [];

  // Filter subjects by selected languages and exam
  const filteredSubjects = form.langid.length > 0 && form.examid
    ? subjects.filter(s => 
        form.langid.some(langId => s.langid === langId) && 
        s.examid === form.examid
      )
    : [];

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-12 w-12 rounded-full border-b-2 border-primary-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Teachers Management</h1>
          <p className="text-gray-600">Assign teachers to exams and subjects</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary">
          + Add Teacher
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="whitespace-nowrap">ID</th>
                <th className="whitespace-nowrap">User ID</th>
                <th className="whitespace-nowrap">Languages</th>
                <th className="whitespace-nowrap">Exam</th>
                <th className="whitespace-nowrap">Subject</th>
                <th className="whitespace-nowrap sticky right-0 bg-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No teacher assignments available
                  </td>
                </tr>
              ) : (
                teachers.map((t) => (
                  <tr key={t.teacherid}>
                    <td className="whitespace-nowrap">{t.teacherid}</td>
                    <td className="whitespace-nowrap font-medium">{t.userid}</td>
                    <td className="whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {t.lang_names && t.lang_names.length > 0 ? (
                          t.lang_names.map((lang, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                              {lang}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap">{t.exam_name || '—'}</td>
                    <td className="whitespace-nowrap">{t.subject_name || '—'}</td>
                    <td className="whitespace-nowrap sticky right-0 bg-white">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(t)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(t.teacherid)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-lg">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowModal(false);
                setEditing(null);
                reset();
              }}
              className="absolute top-3 right-3 text-xl text-gray-600 hover:text-black z-10"
            >
              ✕
            </button>

            {/* Header */}
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {editing ? 'Edit Teacher Assignment' : 'Assign Teacher'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {editing ? 'Update teacher assignment details below' : 'Enter details to assign a teacher'}
              </p>
            </div>

            {/* Body */}
            <div className="p-6">
              <form onSubmit={submit} className="space-y-4">
                {/* User ID */}
                <div>
                  <label className="form-label">User ID *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.userid}
                    onChange={(e) => setForm({ ...form, userid: Number(e.target.value) })}
                    required
                    min="1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Reference to the user in your authentication system
                  </p>
                </div>

                {/* Languages (Multi-select with Checkboxes) */}
                <div>
                  <label className="form-label">Languages * (Select multiple)</label>
                  {languages.length === 0 ? (
                    <p className="text-sm text-red-600">No languages available. Please add languages first.</p>
                  ) : (
                    <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto bg-white">
                      {languages.map((lang) => (
                        <label 
                          key={lang.langid} 
                          className="flex items-center gap-3 py-2 px-2 cursor-pointer hover:bg-gray-50 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={form.langid?.includes(lang.langid) || false}
                            onChange={() => handleLanguageChange(lang.langid)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {lang.lang_name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {form.langid?.length || 0} language(s)
                  </p>
                </div>

                {/* Exam (Dropdown - filtered by languages) */}
                <div>
                  <label className="form-label">Exam *</label>
                  <select
                    className="form-select bg-white text-black"
                    value={form.examid || ''}
                    required
                    disabled={form.langid.length === 0}
                    onChange={e => setForm({ ...form, examid: Number(e.target.value), subjectid: undefined })}
                  >
                    <option value="">Select Exam</option>
                    {filteredExams.map(ex => (
                      <option key={ex.examid} value={ex.examid}>{ex.exam}</option>
                    ))}
                  </select>
                  {form.langid.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">Please select at least one language first</p>
                  )}
                </div>

                {/* Subject (Dropdown - filtered by languages and exam) */}
                <div>
                  <label className="form-label">Subject *</label>
                  <select
                    className="form-select bg-white text-black"
                    value={form.subjectid || ''}
                    required
                    disabled={!form.examid}
                    onChange={e => setForm({ ...form, subjectid: Number(e.target.value) })}
                  >
                    <option value="">Select Subject</option>
                    {filteredSubjects.map(s => (
                      <option key={s.subjectid} value={s.subjectid}>{s.subject}</option>
                    ))}
                  </select>
                  {!form.examid && (
                    <p className="text-xs text-gray-500 mt-1">Please select an exam first</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                >
                  {editing ? 'Update Assignment' : 'Create Assignment'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}