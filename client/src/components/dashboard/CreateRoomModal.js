import React, { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { HiX, HiChat, HiLockClosed, HiGlobe } from 'react-icons/hi';
import toast from 'react-hot-toast';

const CreateRoomModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'public',
    maxMembers: 100
  });
  const [loading, setLoading] = useState(false);
  const { createRoom, isCreatingRoom } = useChat();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Room name is required');
      return;
    }

    setLoading(true);
    try {
      await createRoom(formData);
      onSuccess();
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-secondary-900">
                Create New Room
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-secondary-100 transition-colors"
              >
                <HiX className="h-5 w-5 text-secondary-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-secondary-700 mb-2">
                  Room Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input"
                  placeholder="Enter room name"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-secondary-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input resize-none"
                  rows={3}
                  placeholder="Enter room description (optional)"
                  maxLength={500}
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-secondary-700 mb-2">
                  Room Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="relative">
                    <input
                      type="radio"
                      name="type"
                      value="public"
                      checked={formData.type === 'public'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.type === 'public'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-secondary-300 hover:border-secondary-400'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <HiGlobe className={`h-5 w-5 ${
                          formData.type === 'public' ? 'text-primary-600' : 'text-secondary-400'
                        }`} />
                        <div>
                          <div className={`font-medium ${
                            formData.type === 'public' ? 'text-primary-900' : 'text-secondary-900'
                          }`}>
                            Public
                          </div>
                          <div className={`text-xs ${
                            formData.type === 'public' ? 'text-primary-700' : 'text-secondary-500'
                          }`}>
                            Anyone can join
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>

                  <label className="relative">
                    <input
                      type="radio"
                      name="type"
                      value="private"
                      checked={formData.type === 'private'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.type === 'private'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-secondary-300 hover:border-secondary-400'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <HiLockClosed className={`h-5 w-5 ${
                          formData.type === 'private' ? 'text-primary-600' : 'text-secondary-400'
                        }`} />
                        <div>
                          <div className={`font-medium ${
                            formData.type === 'private' ? 'text-primary-900' : 'text-secondary-900'
                          }`}>
                            Private
                          </div>
                          <div className={`text-xs ${
                            formData.type === 'private' ? 'text-primary-700' : 'text-secondary-500'
                          }`}>
                            Invite only
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="maxMembers" className="block text-sm font-medium text-secondary-700 mb-2">
                  Maximum Members
                </label>
                <select
                  id="maxMembers"
                  name="maxMembers"
                  value={formData.maxMembers}
                  onChange={handleChange}
                  className="input"
                >
                  <option value={50}>50 members</option>
                  <option value={100}>100 members</option>
                  <option value={200}>200 members</option>
                  <option value={500}>500 members</option>
                  <option value={1000}>1000 members</option>
                </select>
              </div>
            </form>
          </div>

          <div className="bg-secondary-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || isCreatingRoom}
              className="btn-primary w-full sm:w-auto sm:ml-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || isCreatingRoom ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <HiChat className="h-4 w-4" />
                  <span>Create Room</span>
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary w-full sm:w-auto mt-3 sm:mt-0"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal;