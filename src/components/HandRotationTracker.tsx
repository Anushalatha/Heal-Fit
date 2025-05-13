import React, { useRef, useEffect, useState } from 'react';
import { Camera, RotateCcw, Download, CheckCircle, Clock, Hand } from 'lucide-react';

declare global {
  interface Window {
    HandLandmarker: any;
  }
}

interface RotationSession {
  rotationCount: number;
  startTime: number;
  rotationTimes: number[];
  handLabel: string;
  lastRotationTime: number;
  rotationStarted: boolean;
}

const HandRotationTracker: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [goal, setGoal] = useState(5);
  const [session, setSession] = useState<RotationSession>({
    rotationCount: 0,
    startTime: Date.now(),
    rotationTimes: [],
    handLabel: "Unknown",
    lastRotationTime: Date.now(),
    rotationStarted: false
  });
  const [summary, setSummary] = useState<string>("");
  const [rotationAngle, setRotationAngle] = useState(0);
  const [rotationDirection, setRotationDirection] = useState('');

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrame: number;
    let handLandmarker: any;

    const initCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 640,
            height: 480,
            facingMode: "user"
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Initialize MediaPipe HandLandmarker
        const vision = await import('@mediapipe/tasks-vision');
        handLandmarker = await vision.HandLandmarker.createFromOptions({
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        // Start tracking
        const trackHands = async () => {
          if (videoRef.current && canvasRef.current && handLandmarker) {
            const ctx = canvasRef.current.getContext('2d');
            if (!ctx) return;

            // Draw video frame
            ctx.drawImage(videoRef.current, 0, 0, 640, 480);

            // Detect hands
            const results = await handLandmarker.detect(videoRef.current);

            if (results.landmarks) {
              for (const landmarks of results.landmarks) {
                // Draw hand landmarks
                for (let i = 0; i < landmarks.length; i++) {
                  const point = landmarks[i];
                  ctx.beginPath();
                  ctx.arc(point.x * 640, point.y * 480, 5, 0, 2 * Math.PI);
                  ctx.fillStyle = '#00ff00';
                  ctx.fill();
                }

                // Track rotation
                const angle = getHandAngle(landmarks);
                setRotationAngle(angle);
                if (Math.abs(rotationAngle) >= 360) {
                  setSession(prev => ({
                    ...prev,
                    rotationCount: prev.rotationCount + 1
                  }));
                  setRotationAngle(0);
                }

                // Update direction
                let delta = angle - rotationAngle;
                if (delta > 180) delta -= 360;
                if (delta < -180) delta += 360;
                let lastDirection = delta > 0 ? 'Clockwise' : 'Counter-Clockwise';
                setRotationDirection(lastDirection);
              }
            }

            // Draw feedback
            ctx.font = '24px Arial';
            ctx.fillStyle = 'white';
            
            // Rotation count
            ctx.fillText(`Reps: ${session.rotationCount}/${goal}`, 50, 50);
            
            // Time elapsed
            const elapsed = Math.floor((Date.now() - session.startTime) / 1000);
            ctx.fillText(`Time: ${elapsed}s`, 50, 90);

            // Speed feedback
            if (session.rotationTimes.length > 0) {
              const lastSpeed = session.rotationTimes[session.rotationTimes.length - 1];
              const pace = lastSpeed >= 0.7 && lastSpeed <= 2 
                ? "Perfect!" 
                : lastSpeed < 0.7 ? "Too Fast" : "Too Slow";
              ctx.fillText(`Speed: ${lastSpeed.toFixed(2)}s (${pace})`, 50, 130);
            }

            // Angle
            ctx.fillText(`Angle: ${rotationAngle.toFixed(1)}°`, 50, 170);

            // Direction
            ctx.fillText(`Direction: ${rotationDirection}`, 50, 210);

            if (session.rotationCount >= goal) {
              ctx.fillStyle = '#00ff00';
              ctx.fillText("Task Complete! ✅", 50, 250);
              setIsTracking(false);
            }

            animationFrame = requestAnimationFrame(trackHands);
          }
        };

        if (isTracking) {
          trackHands();
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    if (isTracking) {
      initCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isTracking, goal, session]);

  const handleEndSession = () => {
    setIsTracking(false);
    
    const totalTime = Math.floor((Date.now() - session.startTime) / 1000);
    const avgSpeed = session.rotationTimes.length > 0
      ? session.rotationTimes.reduce((a, b) => a + b, 0) / session.rotationTimes.length
      : 0;

    const summary = `
--- Session Report ---
Date: ${new Date().toLocaleString()}
Repetitions: ${session.rotationCount}/${goal}
Total Time: ${totalTime}s
Avg Speed per Rotation: ${avgSpeed.toFixed(2)}s
-----------------------
    `;

    setSummary(summary);
  };

  const downloadSummary = () => {
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hand_rotation_summary.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getHandAngle = (landmarks) => {
    // Use wrist (0), index_mcp (5), pinky_mcp (17)
    const wrist = landmarks[0];
    const index = landmarks[5];
    const pinky = landmarks[17];
    // Vector from wrist to index and wrist to pinky
    const v1 = [index.x - wrist.x, index.y - wrist.y];
    const v2 = [pinky.x - wrist.x, pinky.y - wrist.y];
    // Angle between vectors
    const angle = Math.atan2(v2[1], v2[0]) - Math.atan2(v1[1], v1[0]);
    let deg = angle * (180 / Math.PI);
    if (deg < 0) deg += 360;
    return deg;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <Hand className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Hand Rotation Tracker</h1>
        <p className="text-gray-600">Track and analyze hand rotation exercises with AI assistance</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-gray-700">Rotation Goal:</label>
            <input
              type="number"
              min="3"
              max="20"
              value={goal}
              onChange={(e) => setGoal(parseInt(e.target.value))}
              className="w-20 px-3 py-2 border rounded-lg"
            />
          </div>
          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`px-4 py-2 rounded-lg flex items-center ${
              isTracking 
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <Camera className="w-5 h-5 mr-2" />
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </button>
        </div>

        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </div>

      {isTracking && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Live Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Rotations</span>
                <RotateCcw className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold mt-2">{session.rotationCount}/{goal}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Time</span>
                <Clock className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold mt-2">
                {Math.floor((Date.now() - session.startTime) / 1000)}s
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last Speed</span>
                <CheckCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold mt-2">
                {session.rotationTimes.length > 0
                  ? `${session.rotationTimes[session.rotationTimes.length - 1].toFixed(2)}s`
                  : '-'}
              </p>
            </div>
          </div>
        </div>
      )}

      {summary && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Session Summary</h2>
          <pre className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm">
            {summary}
          </pre>
          <button
            onClick={downloadSummary}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Summary
          </button>
        </div>
      )}

      <button
        onClick={() => {
          setSession({
            rotationCount: 0,
            startTime: Date.now(),
            rotationTimes: [],
            handLabel: 'Unknown',
            lastRotationTime: Date.now(),
            rotationStarted: false
          });
          setRotationAngle(0);
          setRotationDirection('');
        }}
        className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 ml-4"
      >
        Reset
      </button>
    </div>
  );
};

export default HandRotationTracker;