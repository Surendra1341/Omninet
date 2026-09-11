import { create } from 'zustand';
import { useChatStore } from './chatStore';

// WebRTC configuration
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

export const useCallStore = create((set, get) => ({
  // Call state
  callId: null,
  callStatus: 'IDLE', // IDLE, INITIATING, RINGING, CONNECTING, CONNECTED, ENDED, FAILED
  callType: null, // VOICE, VIDEO
  isIncomingCall: false,
  callerEmail: null,
  receiverEmail: null,
  callStartTime: null,
  callDuration: 0,

  // UI state
  isCallModalOpen: false,
  isVideoEnabled: true,
  isAudioEnabled: true,

  // WebRTC
  peerConnection: null,
  localStream: null,
  remoteStream: null,
  pendingOffer: null,
  pendingIceCandidates: [],

  // Initialize peer connection
  initializePeerConnection: () => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        get().sendIceCandidate(event.candidate);
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track:', event);
      const [remoteStream] = event.streams;
      set({ remoteStream });
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state changed:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        get().handleCallConnected();
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        get().endCall('CONNECTION_LOST');
      }
    };

    set({ peerConnection: pc });
    return pc;
  },

  // Start outgoing call
  initiateCall: async (receiverEmail, callType) => {
    try {
      set({
        callStatus: 'INITIATING',
        receiverEmail,
        callType,
        isCallModalOpen: true,
        callStartTime: new Date().toISOString()
      });

      // Get user media
      const constraints = {
        audio: true,
        video: callType === 'VIDEO'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      set({ localStream: stream });

      // Initialize peer connection
      const pc = get().initializePeerConnection();

      // Add local stream tracks to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer via WebSocket
      const chatStore = useChatStore.getState();
      if (chatStore.connected && chatStore.stompClient) {
        chatStore.stompClient.publish({
          destination: '/app/call.offer',
          body: JSON.stringify({
            receiverEmail,
            callType,
            sdpOffer: offer.sdp
          })
        });
      }

      set({ callStatus: 'RINGING' });

    } catch (error) {
      console.error('Failed to initiate call:', error);
      get().endCall('ERROR');
    }
  },

  // Answer incoming call
  answerCall: async () => {
    try {
      const state = get();
      if (!state.pendingOffer || !state.callId) return;

      set({ callStatus: 'CONNECTING' });

      // Get user media
      const constraints = {
        audio: true,
        video: state.callType === 'VIDEO'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      set({ localStream: stream });

      // Initialize peer connection
      const pc = get().initializePeerConnection();

      // Add local stream tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Set remote description from pending offer
      await pc.setRemoteDescription({
        type: 'offer',
        sdp: state.pendingOffer
      });

      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send answer via WebSocket
      const chatStore = useChatStore.getState();
      if (chatStore.connected && chatStore.stompClient) {
        chatStore.stompClient.publish({
          destination: '/app/call.response',
          body: JSON.stringify({
            callId: state.callId,
            responseType: 'ACCEPT',
            sdpAnswer: answer.sdp
          })
        });
      }

      // Process any queued ICE candidates
      await get().processQueuedIceCandidates();

      set({ pendingOffer: null });

    } catch (error) {
      console.error('Failed to answer call:', error);
      get().rejectCall();
    }
  },

  // Reject incoming call
  rejectCall: () => {
    const state = get();
    if (!state.callId) return;

    const chatStore = useChatStore.getState();
    if (chatStore.connected && chatStore.stompClient) {
      chatStore.stompClient.publish({
        destination: '/app/call.response',
        body: JSON.stringify({
          callId: state.callId,
          responseType: 'REJECT'
        })
      });
    }

    get().endCall('CALL_REJECTED');
  },

  // End call
  endCall: (reason = 'USER_ENDED') => {
    const state = get();

    // Send end call message if call is active
    if (state.callId && state.callStatus !== 'IDLE') {
      const chatStore = useChatStore.getState();
      if (chatStore.connected && chatStore.stompClient) {
        chatStore.stompClient.publish({
          destination: '/app/call.end',
          body: JSON.stringify({
            callId: state.callId,
            reason
          })
        });
      }
    }

    // Cleanup local resources
    get().cleanup();

    set({
      callId: null,
      callStatus: 'IDLE',
      isIncomingCall: false,
      callType: null,
      callerEmail: null,
      receiverEmail: null,
      isCallModalOpen: false,
      callStartTime: null,
      callDuration: 0,
      pendingOffer: null
    });
  },

  // Cleanup resources
  cleanup: () => {
    const state = get();

    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }

    if (state.peerConnection) {
      try {
        state.peerConnection.ontrack = null;
        state.peerConnection.onicecandidate = null;
        state.peerConnection.onconnectionstatechange = null;
        state.peerConnection.close();
      } catch (error) {
        console.warn('Error during peer connection cleanup:', error);
      }
    }

    set({
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      pendingIceCandidates: []
    });
  },

  // Toggle video
  toggleVideo: () => {
    const state = get();
    if (state.localStream) {
      const videoTrack = state.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        set({ isVideoEnabled: videoTrack.enabled });
      }
    }
  },

  // Toggle audio
  toggleAudio: () => {
    const state = get();
    if (state.localStream) {
      const audioTrack = state.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        set({ isAudioEnabled: audioTrack.enabled });
      }
    }
  },

  // Handle incoming call offer
  handleCallOffer: async (offerData) => {
    try {
      set({
        isIncomingCall: true,
        callerEmail: offerData.callerEmail || offerData.senderEmail,
        callType: offerData.callType,
        callId: offerData.callId,
        isCallModalOpen: true,
        callStatus: 'RINGING',
        pendingOffer: offerData.sdpOffer
      });

    } catch (error) {
      console.error('Failed to handle call offer:', error);
    }
  },

  // Handle call response
  handleCallResponse: async (responseData) => {
    const state = get();

    if (responseData.responseType === 'ACCEPT') {
      set({ callStatus: 'CONNECTING' });

      if (!state.callId && responseData.callId) {
        set({ callId: responseData.callId });
      }

      if (responseData.sdpAnswer && state.peerConnection) {
        try {
          await state.peerConnection.setRemoteDescription({
            type: 'answer',
            sdp: responseData.sdpAnswer
          });

          await get().processQueuedIceCandidates();
        } catch (error) {
          console.error('Failed to set remote description:', error);
        }
      }
    } else {
      get().endCall('CALL_REJECTED');
    }
  },

  // Handle ICE candidate
  handleIceCandidate: async (candidateData) => {
    const state = get();

    if (!state.callId && candidateData.callId) {
      set({ callId: candidateData.callId });
    }

    if (state.peerConnection && candidateData.candidate) {
      try {
        if (state.peerConnection.remoteDescription) {
          await state.peerConnection.addIceCandidate({
            candidate: candidateData.candidate,
            sdpMid: candidateData.sdpMid,
            sdpMLineIndex: candidateData.sdpMLineIndex
          });
        } else {
          console.log('Remote description not set, queueing ICE candidate');
          set({
            pendingIceCandidates: [
              ...state.pendingIceCandidates,
              {
                candidate: candidateData.candidate,
                sdpMid: candidateData.sdpMid,
                sdpMLineIndex: candidateData.sdpMLineIndex
              }
            ]
          });
        }
      } catch (error) {
        console.error('Failed to add ICE candidate:', error);
      }
    }
  },

  // Handle call status updates
  handleCallStatus: (statusData) => {
    console.log('Call status update:', statusData);

    if (statusData.state) {
      set({ callStatus: statusData.state });
    }

    if (statusData.state === 'CONNECTED') {
      get().handleCallConnected();
    } else if (statusData.state === 'ENDED' || statusData.state === 'FAILED') {
      get().endCall(statusData.errorMessage || 'CALL_ENDED');
    }
  },

  // Handle call connected
  handleCallConnected: () => {
    set({
      callStatus: 'CONNECTED',
      callStartTime: new Date().toISOString()
    });

    // Notify server that call is connected
    const state = get();
    const chatStore = useChatStore.getState();
    if (chatStore.connected && chatStore.stompClient && state.callId) {
      chatStore.stompClient.publish({
        destination: '/app/call.connected',
        body: state.callId
      });
    }

    // Start call duration timer
    get().startCallTimer();
  },

  // Send ICE candidate
  sendIceCandidate: (candidate) => {
    const state = get();
    if (!state.callId) {
      console.warn('Cannot send ICE candidate: no callId');
      return;
    }

    const chatStore = useChatStore.getState();
    if (chatStore.connected && chatStore.stompClient) {
      chatStore.stompClient.publish({
        destination: '/app/call.ice-candidate',
        body: JSON.stringify({
          callId: state.callId,
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex
        })
      });
    }
  },

  // Process queued ICE candidates
  processQueuedIceCandidates: async () => {
    const state = get();
    if (!state.peerConnection || state.pendingIceCandidates.length === 0) {
      return;
    }

    console.log(`Processing ${state.pendingIceCandidates.length} queued ICE candidates`);

    for (const candidate of state.pendingIceCandidates) {
      try {
        await state.peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Failed to add queued ICE candidate:', error);
      }
    }

    set({ pendingIceCandidates: [] });
  },

  // Start call timer
  startCallTimer: () => {
    const timer = setInterval(() => {
      const state = get();
      if (state.callStatus !== 'CONNECTED') {
        clearInterval(timer);
        return;
      }

      if (state.callStartTime) {
        const duration = Math.floor((Date.now() - new Date(state.callStartTime).getTime()) / 1000);
        set({ callDuration: duration });
      }
    }, 1000);
  },

  // Format call duration
  getFormattedDuration: () => {
    const state = get();
    const minutes = Math.floor(state.callDuration / 60);
    const seconds = state.callDuration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  },

  // Get contact name for display
  getContactName: () => {
    const state = get();
    const contactEmail = state.isIncomingCall ? state.callerEmail : state.receiverEmail;

    // Try to get name from contacts in chat store
    const chatStore = useChatStore.getState();
    const contact = chatStore.contacts.find(c => c.email === contactEmail);

    return contact?.name || contactEmail || 'Unknown';
  },

  // Get call status text for display
  getStatusText: () => {
    const state = get();
    switch (state.callStatus) {
      case 'INITIATING':
        return 'Initiating call...';
      case 'RINGING':
        return state.isIncomingCall ? 'Incoming call...' : 'Ringing...';
      case 'CONNECTING':
        return 'Connecting...';
      case 'CONNECTED':
        return get().getFormattedDuration();
      case 'ENDED':
        return 'Call ended';
      case 'FAILED':
        return 'Call failed';
      default:
        return '';
    }
  },

  // Reset store
  reset: () => {
    get().cleanup();
    set({
      callId: null,
      callStatus: 'IDLE',
      isIncomingCall: false,
      callType: null,
      callerEmail: null,
      receiverEmail: null,
      isCallModalOpen: false,
      callStartTime: null,
      callDuration: 0,
      isVideoEnabled: true,
      isAudioEnabled: true,
      pendingOffer: null,
      pendingIceCandidates: []
    });
  }
}));
