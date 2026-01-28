import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Sparkles, Mic, Brain, Zap, Check } from 'lucide-react';

interface TutorialStep {
    id: number;
    title: string;
    description: string;
    icon: any;
    color: string;
}

export const OnboardingTutorial = ({ onComplete }: { onComplete?: () => void }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    const steps: TutorialStep[] = [
        {
            id: 1,
            title: 'Welcome to Vezora!',
            description: 'Your hybrid AI personal assistant. I can help you with tasks, remember important information, and control your computer with voice commands.',
            icon: Sparkles,
            color: 'text-primary'
        },
        {
            id: 2,
            title: 'Voice Interaction',
            description: 'Click the microphone button to talk to me, or enable "Wake Word" in settings to activate hands-free with "Hey Vezora".',
            icon: Mic,
            color: 'text-secondary'
        },
        {
            id: 3,
            title: 'Smart Memory',
            description: 'I remember our conversations and learn your preferences over time. Visit the Memory page to see what I\'ve learned about you.',
            icon: Brain,
            color: 'text-purple-400'
        },
        {
            id: 4,
            title: 'Powerful Workflows',
            description: 'Create custom workflows to automate repetitive tasks. Launch apps, send emails, or execute complex sequences with a single command.',
            icon: Zap,
            color: 'text-yellow-400'
        },
        {
            id: 5,
            title: 'You\'re All Set!',
            description: 'Start chatting below or try saying "Hey Vezora, what can you do?" to explore my capabilities. Have fun!',
            icon: Check,
            color: 'text-green-400'
        }
    ];

    const currentStepData = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            handleComplete();
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = () => {
        setIsVisible(false);
        onComplete?.();
        // Save to localStorage that tutorial was completed
        localStorage.setItem('vezoraOnboardingComplete', 'true');
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 backdrop-blur-lg z-[200] flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-2xl"
                >
                    {/* Close Button */}
                    <button
                        onClick={handleSkip}
                        className="absolute -top-12 right-0 p-2 text-text/60 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    {/* Main Card */}
                    <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                        {/* Progress Bar */}
                        <div className="h-1 bg-white/5">
                            <motion.div
                                className="h-full bg-gradient-to-r from-primary to-secondary"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        {/* Content */}
                        <div className="p-12 text-center">
                            {/* Icon */}
                            <motion.div
                                key={currentStep}
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", duration: 0.6 }}
                                className="mb-8 flex justify-center"
                            >
                                <div className="p-6 bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 rounded-2xl">
                                    <currentStepData.icon size={48} className={currentStepData.color} />
                                </div>
                            </motion.div>

                            {/* Title & Description */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                                        {currentStepData.title}
                                    </h2>
                                    <p className="text-text/70 text-lg leading-relaxed max-w-lg mx-auto">
                                        {currentStepData.description}
                                    </p>
                                </motion.div>
                            </AnimatePresence>

                            {/* Step Indicators */}
                            <div className="flex justify-center gap-2 mt-12 mb-8">
                                {steps.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentStep(index)}
                                        className={`h-2 rounded-full transition-all ${
                                            index === currentStep 
                                                ? 'w-8 bg-gradient-to-r from-primary to-secondary' 
                                                : index < currentStep
                                                ? 'w-2 bg-primary/50'
                                                : 'w-2 bg-white/20'
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex items-center justify-between gap-4">
                                <button
                                    onClick={handlePrev}
                                    disabled={currentStep === 0}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                                        currentStep === 0
                                            ? 'opacity-0 pointer-events-none'
                                            : 'bg-white/5 hover:bg-white/10 border border-white/10'
                                    }`}
                                >
                                    <ChevronLeft size={20} />
                                    Previous
                                </button>

                                <button
                                    onClick={handleSkip}
                                    className="px-4 py-2 text-text/50 hover:text-text transition-colors text-sm"
                                >
                                    Skip Tutorial
                                </button>

                                <motion.button
                                    onClick={handleNext}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary hover:opacity-90 rounded-xl font-medium shadow-lg shadow-primary/30 transition-all"
                                >
                                    {isLastStep ? (
                                        <>
                                            Get Started
                                            <Check size={20} />
                                        </>
                                    ) : (
                                        <>
                                            Next
                                            <ChevronRight size={20} />
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </div>

                    {/* Background Decoration */}
                    <div className="absolute -z-10 inset-0">
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.5, 0.3]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute top-0 left-0 w-64 h-64 bg-primary/30 rounded-full blur-[100px]"
                        />
                        <motion.div
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.2, 0.4, 0.2]
                            }}
                            transition={{
                                duration: 5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 1
                            }}
                            className="absolute bottom-0 right-0 w-72 h-72 bg-secondary/20 rounded-full blur-[100px]"
                        />
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
