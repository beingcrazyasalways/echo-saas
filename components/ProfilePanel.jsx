'use client';

import { useState, useEffect } from 'react';
import { User, X, Edit2, LogOut, ChevronRight, Mail, Briefcase, Calendar, FileText } from 'lucide-react';
import { upsertUserProfile } from '@/lib/userProfile';

export default function ProfilePanel({ isOpen, onClose, userProfile, user, onProfileUpdate, onLogout }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    designation: '',
    work_role: '',
    bio: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name || userProfile.name || '',
        age: userProfile.age || '',
        designation: userProfile.designation || '',
        work_role: userProfile.work_role || '',
        bio: userProfile.bio || '',
      });
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const updatedProfile = {
        full_name: formData.full_name,
        age: formData.age ? parseInt(formData.age) : null,
        designation: formData.designation,
        work_role: formData.work_role,
        bio: formData.bio,
      };

      const result = await upsertUserProfile(user.id, updatedProfile);
      
      if (result) {
        setIsEditing(false);
        if (onProfileUpdate) {
          onProfileUpdate(result);
        }
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSwitchAccount = () => {
    onLogout();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-teal-500 to-indigo-500 flex items-center justify-center shadow-lg">
              {userProfile?.avatar_url ? (
                <img
                  src={userProfile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User size={24} className="text-white" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {userProfile?.full_name || userProfile?.name || 'User'}
              </h3>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
          </div>

          {/* Edit Toggle */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <span className="text-sm text-gray-300">Edit Profile</span>
            <Edit2 size={16} className="text-gray-400" />
          </button>

          {/* Edit Form */}
          {isEditing && (
            <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-teal-400/50"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-teal-400/50"
                  placeholder="Enter your age"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Designation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-teal-400/50"
                  placeholder="e.g., Senior Developer"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Work Role</label>
                <input
                  type="text"
                  value={formData.work_role}
                  onChange={(e) => setFormData({ ...formData, work_role: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-teal-400/50"
                  placeholder="e.g., UI Developer"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-teal-400/50 resize-none"
                  placeholder="Tell us about yourself"
                  rows={3}
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full px-4 py-2 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-xl text-white font-semibold hover:from-teal-600 hover:to-indigo-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Profile Info (Read-only when not editing) */}
          {!isEditing && (
            <div className="space-y-3">
              {userProfile?.designation && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <Briefcase size={16} className="text-teal-400" />
                  <div>
                    <p className="text-xs text-gray-400">Designation</p>
                    <p className="text-sm text-white">{userProfile.designation}</p>
                  </div>
                </div>
              )}
              {userProfile?.work_role && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <FileText size={16} className="text-indigo-400" />
                  <div>
                    <p className="text-xs text-gray-400">Work Role</p>
                    <p className="text-sm text-white">{userProfile.work_role}</p>
                  </div>
                </div>
              )}
              {userProfile?.age && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <Calendar size={16} className="text-violet-400" />
                  <div>
                    <p className="text-xs text-gray-400">Age</p>
                    <p className="text-sm text-white">{userProfile.age} years</p>
                  </div>
                </div>
              )}
              {userProfile?.bio && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-gray-400 mb-1">Bio</p>
                  <p className="text-sm text-gray-300">{userProfile.bio}</p>
                </div>
              )}
            </div>
          )}

          {/* Account Switching */}
          <div className="pt-4 border-t border-white/10">
            <button
              onClick={handleSwitchAccount}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <LogOut size={16} className="text-red-400" />
                <span className="text-sm text-red-400">Switch Account</span>
              </div>
              <ChevronRight size={16} className="text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
