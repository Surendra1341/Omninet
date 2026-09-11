import React from 'react';
import { PhoneIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { useCallStore } from '../../store/callStore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

const CallButtons = ({ contactEmail, className = "" }) => {
  const { user } = useAuthStore();
  const { callStatus, initiateCall } = useCallStore();

  const isCallDisabled = callStatus !== 'IDLE';

  const handleAudioCall = async () => {
    if (!contactEmail || !user?.email) {
      toast.error('Unable to initiate call');
      return;
    }

    if (isCallDisabled) {
      toast.error('Another call is already in progress');
      return;
    }

    try {
      await initiateCall(contactEmail, 'AUDIO');
    } catch (error) {
      toast.error('Failed to start audio call');
      console.error('Audio call failed:', error);
    }
  };

  const handleVideoCall = async () => {
    if (!contactEmail || !user?.email) {
      toast.error('Unable to initiate call');
      return;
    }

    if (isCallDisabled) {
      toast.error('Another call is already in progress');
      return;
    }

    try {
      await initiateCall(contactEmail, 'VIDEO');
    } catch (error) {
      toast.error('Failed to start video call');
      console.error('Video call failed:', error);
    }
  };

  return (
    <div className={`flex space-x-2 ${className}`}>
      {/* Audio Call Button */}
      <button
        onClick={handleAudioCall}
        disabled={isCallDisabled}
        className={`p-2 rounded-full transition-colors ${
          isCallDisabled 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
        title="Start Audio Call"
      >
        <PhoneIcon className="w-5 h-5" />
      </button>

      {/* Video Call Button */}
      <button
        onClick={handleVideoCall}
        disabled={isCallDisabled}
        className={`p-2 rounded-full transition-colors ${
          isCallDisabled 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
        title="Start Video Call"
      >
        <VideoCameraIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default CallButtons;
