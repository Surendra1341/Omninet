import React, { useEffect, useRef, useState } from 'react';
import { useCallStore } from '../../store/callStore';
import {
  PhoneIcon,
  PhoneXMarkIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon,
  MicrophoneIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline';

const CallModal = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [callTimer, setCallTimer] = useState('00:00');

  const {
    isCallModalOpen,
    callStatus,
    isIncomingCall,
    callerEmail,
    receiverEmail,
    callType,
    localStream,
    remoteStream,
    callDuration,
    isVideoEnabled,
    isAudioEnabled,
    answerCall,
    rejectCall,
    endCall,
    toggleVideo,
    toggleAudio
  } = useCallStore();

  // Format call duration
  useEffect(() => {
    if (callDuration > 0) {
      const minutes = Math.floor(callDuration / 60);
      const seconds = callDuration % 60;
      setCallTimer(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    } else {
      setCallTimer('00:00');
    }
  }, [callDuration]);

  // Setup local video
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.muted = true;
      localVideoRef.current.play?.().catch(() => {});
    }
  }, [localStream]);

  // Setup remote video
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      // Don't mute remote by default; browser may block autoplay with sound
      // Autoplay will typically work because it's a user gesture (accept/answer)
      remoteVideoRef.current.play?.().catch((e) => {
        console.debug('Remote video autoplay blocked, will require user interaction', e);
      });
    }
  }, [remoteStream]);

  // Handle call answer
  const handleAnswer = async () => {
    await answerCall();
    // processPendingOffer is invoked inside answerCall(); avoid double-call
  };

  if (!isCallModalOpen) return null;

  const getStatusText = () => {
    switch (callStatus) {
      case 'INITIATING':
        return 'Initiating call...';
      case 'RINGING':
        return isIncomingCall ? 'Incoming call' : 'Calling...';
      case 'CONNECTING':
        return 'Connecting...';
      case 'CONNECTED':
        return callTimer;
      default:
        return '';
    }
  };

  const getContactName = () => {
    return isIncomingCall ? callerEmail : receiverEmail;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 text-center">
          <h2 className="text-lg font-semibold">{getContactName()}</h2>
          <p className="text-sm text-gray-300">{getStatusText()}</p>
        </div>

        {/* Video Area */}
        <div className="relative bg-gray-900 min-h-96">
          {callType === 'VIDEO' ? (
            <>
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-96 object-cover"
              />

              {/* Local Video (Picture-in-Picture) */}
              <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </>
          ) : (
            /* Audio Call Display */
            <div className="flex items-center justify-center h-96">
              <div className="text-center text-white">
                <div className="w-24 h-24 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {getContactName()?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{getContactName()}</h3>
                <p className="text-gray-300">{getStatusText()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Call Controls */}
        <div className="bg-gray-100 p-6">
          <div className="flex justify-center space-x-4">
            {/* Incoming Call Controls */}
            {isIncomingCall && callStatus === 'RINGING' && (
              <>
                <button
                  onClick={handleAnswer}
                  className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition-colors"
                  title="Answer Call"
                >
                  <PhoneIcon className="w-6 h-6" />
                </button>
                <button
                  onClick={rejectCall}
                  className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-colors"
                  title="Reject Call"
                >
                  <PhoneXMarkIcon className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Active Call Controls */}
            {callStatus === 'CONNECTED' && (
              <>
                {/* Audio Toggle */}
                <button
                  onClick={toggleAudio}
                  className={`p-4 rounded-full transition-colors ${
                    isAudioEnabled 
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                  title={isAudioEnabled ? 'Mute' : 'Unmute'}
                >
                  {isAudioEnabled ? (
                    <MicrophoneIcon className="w-6 h-6" />
                  ) : (
                    <SpeakerXMarkIcon className="w-6 h-6" />
                  )}
                </button>

                {/* Video Toggle (only for video calls) */}
                {callType === 'VIDEO' && (
                  <button
                    onClick={toggleVideo}
                    className={`p-4 rounded-full transition-colors ${
                      isVideoEnabled 
                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                    title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                  >
                    {isVideoEnabled ? (
                      <VideoCameraIcon className="w-6 h-6" />
                    ) : (
                      <VideoCameraSlashIcon className="w-6 h-6" />
                    )}
                  </button>
                )}

                {/* End Call */}
                <button
                  onClick={() => endCall('USER_ENDED')}
                  className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-colors"
                  title="End Call"
                >
                  <PhoneXMarkIcon className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Outgoing Call Controls */}
            {!isIncomingCall && (callStatus === 'INITIATING' || callStatus === 'RINGING' || callStatus === 'CONNECTING') && (
              <button
                onClick={() => endCall('USER_ENDED')}
                className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-colors"
                title="Cancel Call"
              >
                <PhoneXMarkIcon className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
