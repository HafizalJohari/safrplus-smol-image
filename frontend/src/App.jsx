import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileImage, Download, Settings, X, Wand2, Image as ImageIcon, Archive } from 'lucide-react'
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

  // Settings
  const [quality, setQuality] = useState(80)
  const [format, setFormat] = useState('WEBP')
  const [resize, setResize] = useState(100)

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
  }, [quality, format, resize])

  const processQueue = async (newFiles) => {
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
  }

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

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">

      {/* Navbar / Header */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              SAFR+ <span className="font-light text-white/40">Smol Image</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {completedCount > 1 && (
              <button
                onClick={downloadAll}
                disabled={zipping}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {zipping ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Archive className="w-4 h-4" />
                )}
                Download All
              </button>
            )}
            <div className="text-xs font-medium px-3 py-1 rounded-full bg-white/5 border border-white/5 text-white/40">
              Local V2.0
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Sidebar Controls */}
        <div className="lg:col-span-3 space-y-6">
          <div className="sticky top-24 space-y-6">
            <div className="p-6 rounded-2xl bg-surface border border-white/5 shadow-xl">
              <div className="flex items-center gap-2 mb-6 text-sm font-medium text-white/60">
                <Settings className="w-4 h-4" /> Global Settings
              </div>

              {/* Format */}
              <div className="space-y-3 mb-6">
                <label className="text-xs uppercase tracking-wider text-white/30 font-bold">Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {['WEBP', 'JPEG', 'PNG'].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                        format === fmt
                          ? "bg-primary/20 text-primary border border-primary/30 shadow-sm"
                          : "bg-white/5 text-white/40 hover:bg-white/10"
                      )}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <label className="text-xs uppercase tracking-wider text-white/30 font-bold">Quality</label>
                  <span className="text-xs text-primary font-mono">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                />
              </div>

              {/* Resize */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-xs uppercase tracking-wider text-white/30 font-bold">Resize</label>
                  <span className="text-xs text-secondary font-mono">{resize}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={resize}
                  onChange={(e) => setResize(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-secondary"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10">
              <p className="text-xs text-primary/80 leading-relaxed">
                <Wand2 className="w-3 h-3 inline mr-1" />
                Images are processed locally using your CPU. No data leaves this device.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">

          {/* Dropzone */}
          <Dropzone onDrop={onDrop} />

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {files.map((file) => (
                <ImageCard key={file.id} data={file} />
              ))}
            </AnimatePresence>
          </div>
        </div>

      </main>
    </div>
  )
}

function Dropzone({ onDrop }) {
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
        "relative group h-48 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-white/10 bg-surface/50 hover:bg-surface hover:border-white/20"
      )}
    >
      <input {...getInputProps()} />
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="z-10 flex flex-col items-center gap-3">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
          isDragActive ? "bg-primary text-white scale-110" : "bg-white/5 text-white/40 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary"
        )}>
          <Upload className="w-5 h-5" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
            {isDragActive ? "Drop files now!" : "Click or drag images here"}
          </p>
          <p className="text-xs text-white/30 mt-1">Supports JPG, PNG, WEBP, HEIC</p>
        </div>
      </div>
    </div>
  )
}

function ImageCard({ data }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className="group relative bg-surface border border-white/5 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
    >
      <div className="flex h-32">
        {/* Preview Image */}
        <div className="w-1/3 relative overflow-hidden bg-black/20">
          <img
            src={data.preview}
            alt="Preview"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {data.status === 'processing' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="w-2/3 p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium text-white/90 truncate" title={data.file.name}>{data.file.name}</h3>
            <p className="text-xs text-white/40 mt-1">{(data.file.size / 1024).toFixed(1)} KB</p>
          </div>

          {data.status === 'done' && data.result && (
            <div className="mt-2">
              <div className="flex items-end gap-2">
                <div className="text-lg font-bold text-primary">
                  -{data.result.savings_pct}%
                </div>
                <div className="text-xs text-white/40 mb-1">
                  {(data.result.compressed_size / 1024).toFixed(1)} KB
                </div>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-secondary h-full rounded-full"
                  style={{ width: `${100 - data.result.savings_pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {data.status === 'done' && data.result && (
        <a
          href={data.result.data_uri}
          download={`compressed_${data.file.name.split('.')[0]}.${data.result.mime_type.split('/')[1]}`}
          className="absolute bottom-3 right-3 p-2 rounded-lg bg-white/5 hover:bg-primary text-white/60 hover:text-white transition-colors"
        >
          <Download className="w-4 h-4" />
        </a>
      )}
    </motion.div>
  )
}
