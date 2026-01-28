import { useState, useRef, DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, File, FileText, Image as ImageIcon, Video, Music, Archive, Code } from 'lucide-react';
import { cn } from '../lib/utils';

interface FileUploadProps {
    onFileSelect?: (files: File[]) => void;
    onFileRemove?: (index: number) => void;
    maxFiles?: number;
    maxSize?: number; // in MB
    acceptedTypes?: string[];
    compact?: boolean;
}

interface FilePreview {
    file: File;
    preview?: string;
    type: 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive' | 'other';
}

export const FileUpload = ({
    onFileSelect,
    onFileRemove,
    maxFiles = 10,
    maxSize = 50, // 50MB default
    acceptedTypes = ['*/*'],
    compact = false
}: FileUploadProps) => {
    const [files, setFiles] = useState<FilePreview[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const getFileType = (file: File): FilePreview['type'] => {
        const type = file.type;
        if (type.startsWith('image/')) return 'image';
        if (type.startsWith('video/')) return 'video';
        if (type.startsWith('audio/')) return 'audio';
        if (type.includes('pdf') || type.includes('document') || type.includes('text')) return 'document';
        if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return 'archive';
        if (file.name.match(/\.(js|ts|tsx|jsx|py|java|cpp|c|html|css|json|xml)$/)) return 'code';
        return 'other';
    };

    const getFileIcon = (type: FilePreview['type']) => {
        switch (type) {
            case 'image': return <ImageIcon size={20} />;
            case 'video': return <Video size={20} />;
            case 'audio': return <Music size={20} />;
            case 'document': return <FileText size={20} />;
            case 'code': return <Code size={20} />;
            case 'archive': return <Archive size={20} />;
            default: return <File size={20} />;
        }
    };

    const handleFiles = async (fileList: FileList) => {
        setError(null);
        const newFiles: FilePreview[] = [];

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];

            // Check file count limit
            if (files.length + newFiles.length >= maxFiles) {
                setError(`Maximum ${maxFiles} files allowed`);
                break;
            }

            // Check file size
            if (file.size > maxSize * 1024 * 1024) {
                setError(`File "${file.name}" exceeds ${maxSize}MB limit`);
                continue;
            }

            const fileType = getFileType(file);
            const filePreview: FilePreview = {
                file,
                type: fileType
            };

            // Generate preview for images
            if (fileType === 'image') {
                const reader = new FileReader();
                reader.onload = (e) => {
                    filePreview.preview = e.target?.result as string;
                    setFiles(prev => [...prev]);
                };
                reader.readAsDataURL(file);
            }

            newFiles.push(filePreview);
        }

        const updatedFiles = [...files, ...newFiles];
        setFiles(updatedFiles);
        onFileSelect?.(updatedFiles.map(f => f.file));
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        
        if (e.dataTransfer.files) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(e.target.files);
        }
    };

    const removeFile = (index: number) => {
        const updatedFiles = files.filter((_, i) => i !== index);
        setFiles(updatedFiles);
        onFileRemove?.(index);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    if (compact) {
        return (
            <div className="relative">
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={acceptedTypes.join(',')}
                    onChange={handleInputChange}
                    className="hidden"
                />
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => inputRef.current?.click()}
                    className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all"
                    title="Attach files"
                >
                    <Upload size={18} className="text-text/60" />
                </motion.button>

                {/* File Counter Badge */}
                {files.length > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] font-bold flex items-center justify-center"
                    >
                        {files.length}
                    </motion.div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <motion.div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer",
                    isDragging
                        ? "border-primary bg-primary/10 scale-[1.02]"
                        : "border-white/10 hover:border-white/20 hover:bg-white/5"
                )}
                onClick={() => inputRef.current?.click()}
                whileHover={{ scale: 1.01 }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={acceptedTypes.join(',')}
                    onChange={handleInputChange}
                    className="hidden"
                />

                <div className="flex flex-col items-center gap-3 text-center">
                    <motion.div
                        animate={isDragging ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.3 }}
                    >
                        <Upload size={40} className={cn(
                            "transition-colors",
                            isDragging ? "text-primary" : "text-text/40"
                        )} />
                    </motion.div>
                    
                    <div>
                        <p className="text-sm font-medium">
                            {isDragging ? "Drop files here" : "Click or drag files to upload"}
                        </p>
                        <p className="text-xs text-text/50 mt-1">
                            Max {maxFiles} files, {maxSize}MB each
                        </p>
                    </div>
                </div>

                {isDragging && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-primary/5 rounded-xl backdrop-blur-sm"
                    />
                )}
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-text/60 uppercase tracking-wider">
                        Attached Files ({files.length})
                    </h4>
                    <div className="space-y-2">
                        <AnimatePresence>
                            {files.map((filePreview, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group"
                                >
                                    {/* Preview/Icon */}
                                    <div className="shrink-0">
                                        {filePreview.preview ? (
                                            <img
                                                src={filePreview.preview}
                                                alt={filePreview.file.name}
                                                className="w-12 h-12 object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-black/50 rounded-lg flex items-center justify-center text-primary">
                                                {getFileIcon(filePreview.type)}
                                            </div>
                                        )}
                                    </div>

                                    {/* File Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {filePreview.file.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-text/50">
                                                {formatFileSize(filePreview.file.size)}
                                            </span>
                                            <span className="text-xs text-text/30">•</span>
                                            <span className="text-xs text-primary capitalize">
                                                {filePreview.type}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile(index);
                                        }}
                                        className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <X size={16} />
                                    </motion.button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
};
