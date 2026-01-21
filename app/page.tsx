'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  exams: number;
  subjects: number;
  lessons: number;
  questions: number;
  learners: number;
  teachers: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const modules = [
    { name: 'Exams', icon: '📚', path: '/exams', color: 'bg-blue-500', count: stats?.exams },
    { name: 'Subjects', icon: '📖', path: '/subjects', color: 'bg-green-500', count: stats?.subjects },
    { name: 'Units', icon: '📝', path: '/units', color: 'bg-purple-500' },
    { name: 'Lessons', icon: '📄', path: '/lessons', color: 'bg-yellow-500', count: stats?.lessons },
    { name: 'Topics', icon: '💡', path: '/topics', color: 'bg-pink-500' },
    { name: 'Questions', icon: '❓', path: '/questions', color: 'bg-indigo-500', count: stats?.questions },
    { name: 'MCQs', icon: '✅', path: '/mcqs', color: 'bg-red-500' },
    { name: 'Teachers', icon: '👨‍🏫', path: '/teachers', color: 'bg-teal-500', count: stats?.teachers },
    { name: 'Learners', icon: '👨‍🎓', path: '/learners', color: 'bg-cyan-500', count: stats?.learners },
    { name: 'Tests', icon: '📊', path: '/tests', color: 'bg-orange-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Learn Saubh CMS
        </h1>
        <p className="text-gray-600">
          Educational Content Management System - Admin Dashboard
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Statistics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Exams</p>
                  <p className="text-3xl font-bold">{stats?.exams || 0}</p>
                </div>
                <div className="text-5xl opacity-20">📚</div>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Subjects</p>
                  <p className="text-3xl font-bold">{stats?.subjects || 0}</p>
                </div>
                <div className="text-5xl opacity-20">📖</div>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Learners</p>
                  <p className="text-3xl font-bold">{stats?.learners || 0}</p>
                </div>
                <div className="text-5xl opacity-20">👨‍🎓</div>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Total Questions</p>
                  <p className="text-3xl font-bold">{stats?.questions || 0}</p>
                </div>
                <div className="text-5xl opacity-20">❓</div>
              </div>
            </div>
          </div>

          {/* Module Grid */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Manage Content
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {modules.map((module) => (
                <Link
                  key={module.name}
                  href={module.path}
                  className="group relative overflow-hidden rounded-lg bg-white border-2 border-gray-200 p-6 hover:border-primary-500 transition-all duration-200 hover:shadow-lg"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`${module.color} w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform duration-200`}>
                      {module.icon}
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {module.name}
                    </h3>
                    {module.count !== undefined && (
                      <p className="text-sm text-gray-500">
                        {module.count} items
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card border-l-4 border-blue-500">
              <h3 className="font-bold text-lg mb-2">🚀 Quick Start</h3>
              <p className="text-gray-600 text-sm mb-4">
                Begin by creating an exam, then add subjects, units, and lessons.
              </p>
              <Link href="/exams" className="btn btn-primary text-sm">
                Create Exam
              </Link>
            </div>
            <div className="card border-l-4 border-green-500">
              <h3 className="font-bold text-lg mb-2">📊 View Reports</h3>
              <p className="text-gray-600 text-sm mb-4">
                Track learner progress and test results across all subjects.
              </p>
              <Link href="/tests" className="btn btn-secondary text-sm">
                View Tests
              </Link>
            </div>
            <div className="card border-l-4 border-purple-500">
              <h3 className="font-bold text-lg mb-2">👥 Manage Users</h3>
              <p className="text-gray-600 text-sm mb-4">
                Add and manage teachers and learners in the system.
              </p>
              <Link href="/teachers" className="btn btn-secondary text-sm">
                Manage Users
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
