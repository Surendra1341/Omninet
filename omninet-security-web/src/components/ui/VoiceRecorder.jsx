import { useState, useRef, useEffect } from "react";

function VoiceRecorder({ onRecordingComplete, disabled = false }) {
 const [isRecording, setIsRecording] = useState(false);
 const [recordingTime, setRecordingTime] = useState(0);

 const mediaRecorderRef = useRef(null);
 const streamRef = useRef(null);
 const chunksRef = useRef([]);
 const timerRef = useRef(null);

 // Cleanup on unmount
 useEffect(() => {
   return () => {
     cleanup();
   };
 }, []);

 function cleanup() {
   if (timerRef.current) {
     clearInterval(timerRef.current);
     timerRef.current = null;
   }

   if (streamRef.current) {
     streamRef.current.getTracks().forEach((track) => track.stop());
     streamRef.current = null;
   }

   if (
     mediaRecorderRef.current &&
     mediaRecorderRef.current.state !== "inactive"
   ) {
     mediaRecorderRef.current.stop();
   }
 }

 function startRecording() {
   navigator.mediaDevices
     .getUserMedia({ audio: true })
     .then((stream) => {
       streamRef.current = stream;
       const mediaRecorder = new MediaRecorder(stream);
       mediaRecorderRef.current = mediaRecorder;
       chunksRef.current = [];

       mediaRecorder.ondataavailable = (event) => {
         if (event.data.size > 0) {
           chunksRef.current.push(event.data);
         }
       };

       mediaRecorder.onstop = () => {
         const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
         const audioFile = new File([audioBlob], "recording.webm", {
           type: "audio/webm",
         });

         if (onRecordingComplete) {
           onRecordingComplete(audioFile);
         }

         cleanup();
       };

       mediaRecorder.start();
       setIsRecording(true);
       setRecordingTime(0);

       // Start timer
       timerRef.current = setInterval(() => {
         setRecordingTime((prev) => prev + 1);
       }, 1000);
     })
     .catch((error) => {
       console.error("Failed to start recording:", error);
       cleanup();
     });
 }

 function stopRecording() {
   if (
     mediaRecorderRef.current &&
     mediaRecorderRef.current.state === "recording"
   ) {
     mediaRecorderRef.current.stop();
   }

   setIsRecording(false);
   setRecordingTime(0);

   if (timerRef.current) {
     clearInterval(timerRef.current);
     timerRef.current = null;
   }
 }

 function handleClick() {
   if (disabled) return;

   if (isRecording) {
     stopRecording();
   } else {
     startRecording();
   }
 }

 function formatTime(seconds) {
   const mins = Math.floor(seconds / 60);
   const secs = seconds % 60;
   return `${mins}:${secs.toString().padStart(2, "0")}`;
 }

 return (
   <div className="flex items-center">
     <button
       onClick={handleClick}
       disabled={disabled}
       className={`p-2 rounded-lg transition-all duration-200 ${
         isRecording
           ? "bg-red-500 hover:bg-red-600 animate-pulse text-white"
           : disabled
           ? "bg-gray-300 cursor-not-allowed text-gray-500"
           : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
       }`}
       title={isRecording ? "Stop recording" : "Start recording"}
     >
       {isRecording ? (
         <span className="material-icons text-lg">stop</span>
       ) : (
         <span className="material-icons text-lg">mic</span>
       )}
     </button>

     {isRecording && (
       <div className="ml-2 text-xs text-red-600 font-mono">
         {formatTime(recordingTime)}
       </div>
     )}
   </div>
 );
}

export default VoiceRecorder;

