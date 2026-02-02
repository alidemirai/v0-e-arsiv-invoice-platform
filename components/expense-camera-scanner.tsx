'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Camera, X, Upload, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CameraScannerProps {
  onScan: (data: {
    amount: number
    description: string
    category: string
    date: string
    imageUrl: string
  }) => void
  onClose: () => void
}

export function ExpenseCameraScanner({ onScan, onClose }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  useEffect(() => {
    if (!isCameraActive) return

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        setError('Kameraya erişilemiyor. Lütfen kamera izni verin.')
        setIsCameraActive(false)
      }
    }

    startCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(track => track.stop())
      }
    }
  }, [isCameraActive])

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const context = canvasRef.current.getContext('2d')
    if (!context) return

    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight
    context.drawImage(videoRef.current, 0, 0)

    const imageUrl = canvasRef.current.toDataURL('image/jpeg')
    setCapturedImage(imageUrl)
    setIsCameraActive(false)
    processReceiptImage(imageUrl)
  }

  const processReceiptImage = async (imageUrl: string) => {
    setIsProcessing(true)
    try {
      // Simulate OCR processing with mock data
      // In production, this would call a real OCR API
      const mockData = {
        amount: Math.random() * 5000 + 100,
        description: 'Ofis malzemeleri',
        category: 'Yazılım',
        date: new Date().toISOString().split('T')[0],
        imageUrl: imageUrl
      }

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      onScan(mockData)
      setCapturedImage(null)
    } catch (err) {
      setError('Fatura işlenirken hata oluştu')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      setCapturedImage(imageUrl)
      processReceiptImage(imageUrl)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur z-50 flex items-end lg:items-center justify-center lg:p-4">
      <Card className="w-full lg:w-full lg:max-w-md rounded-t-2xl lg:rounded-2xl border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Gider Belgesi Tara</CardTitle>
            <CardDescription>Kamera veya dosya yükle</CardDescription>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="flex gap-3 p-3 rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!capturedImage && !isCameraActive && (
            <div className="space-y-3">
              <Button
                onClick={() => setIsCameraActive(true)}
                className="w-full h-12"
              >
                <Camera className="h-5 w-5 mr-2" />
                Kameradan Çek
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full h-12"
              >
                <Upload className="h-5 w-5 mr-2" />
                Dosya Seç
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {isCameraActive && (
            <div className="space-y-3">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-4 border-primary/30" />
                <div className="absolute top-4 left-4 text-white text-sm font-medium bg-black/50 px-3 py-1 rounded">
                  Faturayı çercevede tutun
                </div>
              </div>
              <Button onClick={capturePhoto} className="w-full h-12">
                <Camera className="h-5 w-5 mr-2" />
                Fotoğraf Çek
              </Button>
              <Button
                onClick={() => setIsCameraActive(false)}
                variant="outline"
                className="w-full"
              >
                İptal
              </Button>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-3 text-center py-6">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full border-4 border-muted border-t-primary animate-spin" />
              </div>
              <p className="text-sm text-muted-foreground">Fatura taranıyor...</p>
            </div>
          )}

          {capturedImage && !isProcessing && (
            <div className="space-y-3">
              <img src={capturedImage || "/placeholder.svg"} alt="Captured receipt" className="w-full rounded-lg" />
              <p className="text-sm text-muted-foreground text-center">Gider otomatik olarak kaydedildi</p>
              <Button onClick={onClose} className="w-full">
                Tamam
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
