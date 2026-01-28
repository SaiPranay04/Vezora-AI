import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Maximize2, Minimize2, Scan, Video, VideoOff } from 'lucide-react';
import { cn } from '../lib/utils';

interface CameraInputProps {
    onCapture?: (imageData: string) => void;
    onClose?: () => void;
    mode?: 'photo' | 'video' | 'scan';
}

export const CameraInput = ({ onCapture, onClose, mode = 'photo' }: CameraInputProps) => {
    const [isActive, setIsActive] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string>('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Get available camera devices
    useEffect(() => {
        const getDevices = async () => {
            try {
                const deviceList = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
                setDevices(videoDevices);
                if (videoDevices.length > 0 && !selectedDevice) {
                    setSelectedDevice(videoDevices[0].deviceId);
                }
            } catch (err) {
                console.error('Error getting devices:', err);
            }
        };

        getDevices();
    }, []);

    // Start camera stream
    const startCamera = async () => {
        try {
            setError(null);
            const constraints = {
                video: {
                    deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: mode === 'video'
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setIsActive(true);
            }
        } catch (err: any) {
            console.error('Error accessing camera:', err);
            setError(err.message || 'Failed to access camera');
            setIsActive(false);
        }
    };

    // Stop camera stream
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsActive(false);
        setIsRecording(false);
    };

    // Capture photo
    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                const imageData = canvas.toDataURL('image/png');
                
                if (onCapture) {
                    onCapture(imageData);
                }
                
                // Show flash effect
                const flashDiv = document.createElement('div');
                flashDiv.className = 'fixed inset-0 bg-white z-[1000] pointer-events-none';
                flashDiv.style.animation = 'flash 0.3s ease-out';
                document.body.appendChild(flashDiv);
                setTimeout(() => flashDiv.remove(), 300);
            }
        }
    };

    // Toggle recording (placeholder for video mode)
    const toggleRecording = () => {
        setIsRecording(!isRecording);
        // In a real implementation, you'd use MediaRecorder API here
        // For Tauri, you might invoke a Rust command to record
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
                "relative bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl",
                isFullscreen ? "fixed inset-4 z-50" : "w-full max-w-2xl h-[400px]"
            )}
        >
            {/* Video Preview */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
            />

            {/* Hidden canvas for captures */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlay Controls */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center gap-3">
                        {/* Camera Selector */}
                        {devices.length > 1 && (
                            <select
                                value={selectedDevice}
                                onChange={(e) => {
                                    setSelectedDevice(e.target.value);
                                    if (isActive) {
                                        stopCamera();
                                        setTimeout(startCamera, 100);
                                    }
                                }}
                                className="bg-black/50 backdrop-blur-lg border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none"
                            >
                                {devices.map((device, i) => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label || `Camera ${i + 1}`}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Recording Indicator */}
                        {isRecording && (
                            <motion.div
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded-lg"
                            >
                                <div className="w-2 h-2 bg-red-500 rounded-full" />
                                <span className="text-xs text-red-400 font-mono">REC</span>
                            </motion.div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Fullscreen Toggle */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-2 bg-black/50 backdrop-blur-lg border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </motion.button>

                        {/* Close Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                stopCamera();
                                onClose?.();
                            }}
                            className="p-2 bg-black/50 backdrop-blur-lg border border-white/10 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                            <X size={18} />
                        </motion.button>
                    </div>
                </div>

                {/* Scan Mode Overlay */}
                {mode === 'scan' && isActive && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <motion.div
                            animate={{
                                y: [-100, 100, -100]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className="w-3/4 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"
                        />
                        <div className="absolute inset-0 border-2 border-primary/30 m-16 rounded-xl" />
                    </div>
                )}

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center gap-4 pointer-events-auto">
                    {!isActive ? (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={startCamera}
                            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 rounded-full font-medium shadow-lg shadow-primary/30"
                        >
                            <Camera size={20} />
                            Start Camera
                        </motion.button>
                    ) : (
                        <>
                            {mode === 'photo' || mode === 'scan' ? (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={capturePhoto}
                                    className="w-16 h-16 rounded-full bg-white border-4 border-white/20 hover:border-primary/50 shadow-lg"
                                >
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-secondary" />
                                </motion.button>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={toggleRecording}
                                    className={cn(
                                        "w-16 h-16 rounded-full border-4 border-white/20 shadow-lg transition-all",
                                        isRecording ? "bg-red-500" : "bg-white"
                                    )}
                                >
                                    {isRecording ? (
                                        <div className="w-6 h-6 bg-white rounded-sm mx-auto" />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500 to-red-600" />
                                    )}
                                </motion.button>
                            )}

                            {/* Mode Indicators */}
                            <div className="absolute left-6 bottom-6 flex flex-col gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={cn(
                                        "p-2 rounded-lg border transition-colors",
                                        mode === 'scan' 
                                            ? "bg-primary/20 border-primary text-primary" 
                                            : "bg-black/50 border-white/10 hover:bg-white/10"
                                    )}
                                >
                                    <Scan size={20} />
                                </motion.button>
                            </div>
                        </>
                    )}
                </div>

                {/* Error Display */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-sm text-red-400"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* No Camera Message */}
            {!isActive && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-text/60">
                    <Camera size={48} className="opacity-30" />
                    <p className="text-sm">Click "Start Camera" to begin</p>
                </div>
            )}
        </motion.div>
    );
};
