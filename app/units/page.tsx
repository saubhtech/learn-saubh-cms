
'use client';

import { useEffect, useState } from 'react';
import { Unit, Subject } from '@/types/database';

export default function UnitsPage() {
  const [units, setUnits] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  const [formData, setFormData] = useState<any>({
    language: '',
    subjectid: 0,
    unit: '',
    chapter: '',
    unit_doc: '',
    marks_total: 100,
    euserid: 1,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [unitsRes, subjectsRes] = await Promise.all([
        fetch('/api/units'),
        fetch('/api/subjects'),
      ]);

      const unitsData = await unitsRes.json();
      const subjectsData = await subjectsRes.json();

      if (unitsData.success) setUnits(unitsData.data);
      if (subjectsData.success) setSubjects(subjectsData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const body = editingUnit
      ? { ...formData, unitid: editingUnit.unitid }
      : formData;

    const response = await fetch('/api/units', {
      method: editingUnit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (data.success) {
      alert(data.message);
      closeModal();
      fetchData();
    } else {
      alert(data.error);
    }
  };

  const handleEdit = (u: any) => {
    setEditingUnit(u);
    setFormData({
      language: u.language || '',
      subjectid: u.subjectid,
      unit: u.unit,
      chapter: u.chapter || '',
      unit_doc: u.unit_doc || '',
      marks_total: u.marks_total || 100,
      euserid: 1,
    });
    setShowModal(true);
  };

  const handleDelete = async (unitid: number) => {
    if (!confirm('Delete unit?')) return;

    const res = await fetch(`/api/units?unitid=${unitid}&euserid=1`, {
      method: 'DELETE',
    });

    const data = await res.json();
    if (data.success) fetchData();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUnit(null);
    setFormData({
      language: '',
      subjectid: 0,
      unit: '',
      chapter: '',
      unit_doc: '',
      marks_total: 100,
      euserid: 1,
    });
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Units Management</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + Add Unit
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Unit</th>
              <th>Subject</th>
              <th>Exam</th>
              <th>Marks</th>
              <th>Language</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {units.map((u: any) => (
              <tr key={u.unitid}>
                <td>{u.unitid}</td>
                <td>{u.unit}</td>
                <td>{u.subject_name}</td>
                <td>{u.exam_name}</td>
                <td>{u.marks_total}</td>
                <td>{u.language || '-'}</td>
                <td className="flex gap-2">
                  <button onClick={() => handleEdit(u)} className="btn btn-secondary">Edit</button>
                  <button onClick={() => handleDelete(u.unitid)} className="btn btn-danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-xl w-full p-6 relative">
            
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute right-3 top-3 text-gray-500 text-xl font-bold hover:text-black"
            >
              ×
            </button>

            <h2 className="text-2xl font-bold mb-4">
              {editingUnit ? 'Edit Unit' : 'Add Unit'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Language */}
              <div>
                <label className="form-label">Language *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Hindi / English / Marathi"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  required
                />
              </div>

              {/* Subject */}
              <div>
                <label className="form-label">Subject *</label>
                <select
                  className="form-select"
                  value={formData.subjectid}
                  required
                  onChange={(e) => setFormData({ ...formData, subjectid: Number(e.target.value) })}
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.subjectid} value={s.subjectid}>{s.subject}</option>
                  ))}
                </select>
              </div>

              {/* Unit Name */}
              <div>
                <label className="form-label">Unit Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  required
                />
              </div>

              {/* Marks */}
              <div>
                <label className="form-label">Marks *</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.marks_total}
                  onChange={(e) => setFormData({ ...formData, marks_total: Number(e.target.value) })}
                />
              </div>

              <button className="btn btn-primary w-full">
                {editingUnit ? 'Update Unit' : 'Create Unit'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

