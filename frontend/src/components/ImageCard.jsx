import { motion } from 'framer-motion'
import { Download, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs) {
    return twMerge(clsx(inputs))
}

export default function ImageCard({ data, darkMode }) {
    const isDone = data.status === 'done'
    const isProcessing = data.status === 'processing'
    const isError = data.status === 'error'

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className={cn(
                "group relative w-full rounded-lg overflow-hidden border transition-all duration-300",
                darkMode
                    ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                    : "bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md"
            )}
        >
            {/* Card Body */}
            <div className="flex flex-col sm:flex-row">

                {/* Image Preview Area */}
                <div className="relative w-full sm:w-48 h-48 sm:h-auto overflow-hidden bg-gray-100 dark:bg-gray-900">
                    <img
                        src={data.preview}
                        alt={data.file.name}
                        className="w-full h-full object-cover"
                    />

                    {/* Status Overlay */}
                    {isProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                <span className="text-xs font-semibold text-white">Processing</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                    <div className="space-y-2">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <h3 className={cn(
                                    "font-semibold truncate text-sm",
                                    darkMode ? "text-gray-100" : "text-gray-900"
                                )} title={data.file.name}>
                                    {data.file.name}
                                </h3>
                                <p className={cn(
                                    "text-xs font-mono mt-1",
                                    darkMode ? "text-gray-400" : "text-gray-500"
                                )}>
                                    Original: {(data.file.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                            {/* Status Indicator Icon */}
                            {isDone && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                            {isError && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
                        </div>

                        {/* Result Section */}
                        {isDone && data.result && (
                            <div className="space-y-2 mt-3">
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "text-xs",
                                        darkMode ? "text-gray-400" : "text-gray-600"
                                    )}>
                                        Compressed: {(data.result.compressed_size / 1024).toFixed(1)} KB
                                    </span>
                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                        Saved {data.result.savings_pct}%
                                    </span>
                                </div>

                                {/* Progress Bar Visual */}
                                <div className={cn(
                                    "relative h-2 w-full rounded-full overflow-hidden",
                                    darkMode ? "bg-gray-700" : "bg-gray-200"
                                )}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${data.result.savings_pct}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                                    />
                                </div>
                            </div>
                        )}

                        {isError && (
                            <div className={cn(
                                "mt-2 text-xs flex items-center gap-2 p-2 rounded",
                                darkMode
                                    ? "bg-red-900/20 text-red-400 border border-red-800"
                                    : "bg-red-50 text-red-600 border border-red-200"
                            )}>
                                <AlertCircle className="w-3 h-3" />
                                <span>Compression failed</span>
                            </div>
                        )}
                    </div>

                    {/* Download Button */}
                    {isDone && data.result && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4"
                        >
                            <a
                                href={data.result.data_uri}
                                download={`compressed_${data.file.name.split('.')[0]}.${data.result.mime_type.split('/')[1]}`}
                                className={cn(
                                    "flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                    darkMode
                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                        : "bg-blue-600 hover:bg-blue-700 text-white"
                                )}
                                title="Download Compressed Image"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </a>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
