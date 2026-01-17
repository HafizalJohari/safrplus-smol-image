import { useState, useCallback, useEffect } from 'react'
import ImageCard from './components/ImageCard'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Image as ImageIcon, Moon, Sun, Archive, GitCompareArrows } from 'lucide-react'
import axios from 'axios'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export default function App() {
  const [files, setFiles] = useState([])
  const [processing, setProcessing] = useState(false)
  const [zipping, setZipping] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  // Settings
  const [quality, setQuality] = useState(60)
  const [format, setFormat] = useState('WEBP')
  const [resize, setResize] = useState(100)

  const processQueue = useCallback(async (newFiles) => {
    setProcessing(true)
    for (const item of newFiles) {
      const formData = new FormData()
      formData.append('files', item.file)
      formData.append('quality', quality)
      formData.append('format', format)
      formData.append('resize_factor', resize)

      try {
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing' } : f))

        const response = await axios.post('http://127.0.0.1:8000/compress', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })

        if (response.data.results && response.data.results.length > 0) {
          const result = response.data.results[0]
          setFiles(prev => prev.map(f => f.id === item.id ? {
            ...f,
            status: 'done',
            result: result
          } : f))
        }
      } catch (error) {
        console.error("Upload failed", error)
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error' } : f))
      }
    }
    setProcessing(false)
  }, [quality, format, resize])

  const onDrop = useCallback((acceptedFiles) => {
    // Add pending files
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      status: 'pending', // pending, processing, done, error
      preview: URL.createObjectURL(file)
    }))
    setFiles(prev => [...prev, ...newFiles])

    // Auto process
    processQueue(newFiles)
  }, [processQueue])

  const downloadAll = async () => {
    setZipping(true)
    const zip = new JSZip()

    // Filter only done files
    const doneFiles = files.filter(f => f.status === 'done' && f.result)

    if (doneFiles.length === 0) {
      setZipping(false)
      return
    }

    doneFiles.forEach(f => {
      // Decode data URI to blob
      const dataUri = f.result.data_uri
      const base64Data = dataUri.split(',')[1]
      const ext = f.result.mime_type.split('/')[1]

      zip.file(`compressed_${f.file.name.split('.')[0]}.${ext}`, base64Data, { base64: true })
    })

    try {
      const content = await zip.generateAsync({ type: "blob" })
      saveAs(content, "compressed_images.zip")
    } catch (err) {
      console.error("Zip failed", err)
    }
    setZipping(false)
  }

  const completedCount = files.filter(f => f.status === 'done').length

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const getActiveLabel = (val) => {
    if (val <= 20) return 'Low'
    if (val <= 40) return 'Fair'
    if (val <= 60) return 'Okay'
    if (val <= 80) return 'Good'
    if (val <= 95) return 'High'
    return 'Max'
  }

  const activeLabel = getActiveLabel(quality)
  const isRecommended = quality === 60

  return (
    <div className={cn("min-h-screen transition-colors duration-200", darkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900")}>
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitCompareArrows className="w-6 h-6" />
            <h1 className="text-lg font-semibold">SAFR+ SMOL IMAGE</h1>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Compress Images Instantly - Free & Open Source</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Optimize your images with enterprise-grade compression technology. All processing occurs locally on your device, ensuring complete data privacy and security. No cloud uploads, no subscription limits, and no external API dependencies. Fully functional offline with complete control over your content.
          </p>
        </div>

        {/* Quality Control */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-sm">Image Quality: <strong>{quality}%</strong></span>
            {isRecommended && (
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">(Recommended)</span>
            )}
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
            Higher quality = larger file size
          </p>
          <div className="relative">
            <input
              type="range"
              min="1"
              max="100"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between mt-2 text-xs">
              <span className={cn(activeLabel === 'Low' ? "font-semibold" : "", "text-red-500")}>Low</span>
              <span className={cn(activeLabel === 'Fair' ? "font-semibold" : "", "text-orange-500")}>Fair</span>
              <span className={cn(activeLabel === 'Okay' ? "font-semibold" : "", "text-yellow-500")}>Okay</span>
              <span className={cn(activeLabel === 'Good' ? "font-semibold" : "", "text-green-500")}>Good</span>
              <span className={cn(activeLabel === 'High' ? "font-semibold" : "", "text-green-600")}>High</span>
              <span className={cn(activeLabel === 'Max' ? "font-semibold" : "", "text-red-500")}>Max</span>
            </div>
          </div>
        </div>

        {/* Resize Control */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-sm">Resize Factor: <strong>{resize}%</strong></span>
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
            Adjust image dimensions (10% - 100%)
          </p>
          <div className="relative">
            <input
              type="range"
              min="10"
              max="100"
              value={resize}
              onChange={(e) => setResize(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>10%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Dropzone */}
        <Dropzone onDrop={onDrop} darkMode={darkMode} />

        {/* Compressed Images Section */}
        <div className="mt-12">
          {files.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <Upload className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Compressed Images</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Upload images and compress them to see your results here. Your compressed images will appear in this section.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedCount > 1 && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={downloadAll}
                    disabled={zipping}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {zipping ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Archive className="w-4 h-4" />
                    )}
                    Download All
                  </button>
                </div>
              )}
              <AnimatePresence>
                {files.map((file) => (
                  <ImageCard key={file.id} data={file} darkMode={darkMode} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            By{' '}
            <a href="https://github.com/HafizalJohari/" className="text-blue-600 dark:text-blue-400 hover:underline">
              HafizalJohari
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}

function Dropzone({ onDrop, darkMode }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic']
    }
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative group h-64 rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden",
        isDragActive
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          : darkMode
          ? "border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-600"
          : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-gray-400"
      )}
    >
      <input {...getInputProps()} />
      <div className="z-10 flex flex-col items-center gap-4">
        <div className={cn(
          "w-16 h-16 flex items-center justify-center transition-all duration-300",
          isDragActive
            ? "text-blue-600 dark:text-blue-400"
            : "text-gray-400 dark:text-gray-500"
        )}>
          <ImageIcon className="w-12 h-12" />
        </div>
        <div className="text-center">
          <p className={cn(
            "text-base font-medium mb-1",
            isDragActive
              ? "text-blue-600 dark:text-blue-400"
              : darkMode
              ? "text-gray-300"
              : "text-gray-700"
          )}>
            Drag & drop images here
          </p>
          <p className={cn("text-sm", darkMode ? "text-gray-500" : "text-gray-500")}>
            JPG, HEIC, PNG AND WEBP
          </p>
        </div>
      </div>
    </div>
  )
}


