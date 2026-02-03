'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, X, Upload, AlertCircle, Check, Loader2, Sparkles, RotateCcw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EXPENSE_CATEGORIES } from '@/lib/types'
import type { ExpenseCategory } from '@/lib/types'

interface AIReceiptScannerProps {
  onScan: (data: {
    amount: number
    kdvAmount: number
    description: string
    supplier: string
    category: ExpenseCategory
    date: string
    imageUrl: string
  }) => void
  onClose: () => void
}

export function AIReceiptScanner({ onScan, onClose }: AIReceiptScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [step, setStep] = useState<'capture' | 'processing' | 'review'>('capture')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Extracted data
  const [extractedData, setExtractedData] = useState({
    amount: '',
    kdvAmount: '',
    description: '',
    supplier: '',
    category: 'diger' as ExpenseCategory,
    date: new Date().toISOString().split('T')[0]
  })
  
  const [confidence, setConfidence] = useState(0)

  useEffect(() => {
    if (!isCameraActive) return

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        setError('Kameraya erisilemedi. Lutfen kamera iznini kontrol edin.')
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

    const imageUrl = canvasRef.current.toDataURL('image/jpeg', 0.9)
    setCapturedImage(imageUrl)
    setIsCameraActive(false)
    processImage(imageUrl)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string
      setCapturedImage(imageUrl)
      processImage(imageUrl)
    }
    reader.readAsDataURL(file)
  }

  const processImage = async (imageUrl: string) => {
    setStep('processing')
    setError(null)
    
    // Simulate AI processing with realistic delays
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Simulate OCR confidence increase
    for (let i = 0; i <= 100; i += 20) {
      setConfidence(i)
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // Simulate extracted data - In production, this would call a real OCR API
    // like Google Cloud Vision, AWS Textract, or Azure Computer Vision
    const mockData = simulateOCRExtraction()
    
    setExtractedData({
      amount: String(mockData.amount),
      kdvAmount: String(mockData.kdvAmount),
      description: mockData.description,
      supplier: mockData.supplier,
      category: mockData.category,
      date: mockData.date
    })
    
    setStep('review')
  }

  // Simulate OCR extraction with realistic Turkish receipt data
  const simulateOCRExtraction = () => {
    const suppliers = [
      { name: 'Starbucks Coffee', category: 'yemek' as ExpenseCategory },
      { name: 'Migros Market', category: 'yemek' as ExpenseCategory },
      { name: 'Shell Benzin', category: 'ulasim' as ExpenseCategory },
      { name: 'Teknosa', category: 'ofis' as ExpenseCategory },
      { name: 'D&R', category: 'ofis' as ExpenseCategory },
      { name: 'Uber Turkiye', category: 'ulasim' as ExpenseCategory },
      { name: 'Trendyol', category: 'diger' as ExpenseCategory },
      { name: 'Amazon AWS', category: 'yazilim' as ExpenseCategory },
    ]
    
    const selected = suppliers[Math.floor(Math.random() * suppliers.length)]
    const baseAmount = Math.floor(Math.random() * 500) + 50
    const kdvRate = 0.20
    const kdvAmount = Math.round(baseAmount * kdvRate * 100) / 100
    
    return {
      amount: baseAmount,
      kdvAmount: kdvAmount,
      description: `${selected.name} - Alis`,
      supplier: selected.name,
      category: selected.category,
      date: new Date().toISOString().split('T')[0]
    }
  }

  const handleSave = () => {
    onScan({
      amount: parseFloat(extractedData.amount) || 0,
      kdvAmount: parseFloat(extractedData.kdvAmount) || 0,
      description: extractedData.description,
      supplier: extractedData.supplier,
      category: extractedData.category,
      date: extractedData.date,
      imageUrl: capturedImage || ''
    })
  }

  const resetScanner = () => {
    setCapturedImage(null)
    setStep('capture')
    setConfidence(0)
    setError(null)
    setExtractedData({
      amount: '',
      kdvAmount: '',
      description: '',
      supplier: '',
      category: 'diger',
      date: new Date().toISOString().split('T')[0]
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center lg:p-4">
      <Card className="w-full lg:max-w-lg rounded-t-3xl lg:rounded-2xl border-0 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Fis Tarama</CardTitle>
              <CardDescription>
                {step === 'capture' && 'Fis veya fatura fotograflayin'}
                {step === 'processing' && 'Yapay zeka analiz ediyor...'}
                {step === 'review' && 'Bilgileri kontrol edin'}
              </CardDescription>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="space-y-4 pt-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex gap-3 p-3 rounded-xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* CAPTURE STEP */}
          {step === 'capture' && !isCameraActive && !capturedImage && (
            <div className="space-y-3">
              <div className="aspect-video bg-muted rounded-2xl flex items-center justify-center border-2 border-dashed border-border">
                <div className="text-center p-6">
                  <Camera className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Fis veya fatura fotografi cekin veya yukleyin
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setIsCameraActive(true)}
                className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Camera className="h-5 w-5 mr-2" />
                Kamerayi Ac
              </Button>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full h-12"
              >
                <Upload className="h-5 w-5 mr-2" />
                Galeriden Sec
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="p-4 bg-muted/50 rounded-xl">
                <p className="text-sm font-medium text-foreground mb-2">Ipuclari:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>- Fisi duz bir yuzey uzerine koyun</li>
                  <li>- Iyi aydinlatilmis ortamda cekin</li>
                  <li>- Tum yazi okunur sekilde gorunmeli</li>
                  <li>- Fisi tam cerceve icine alin</li>
                </ul>
              </div>
            </div>
          )}

          {/* CAMERA ACTIVE */}
          {step === 'capture' && isCameraActive && (
            <div className="space-y-3">
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-[3/4]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {/* Guide overlay */}
                <div className="absolute inset-4 border-2 border-accent/50 rounded-xl pointer-events-none">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-accent rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-accent rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-accent rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-accent rounded-br-lg" />
                </div>
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full">
                  Fisi cerceve icine hizalayin
                </div>
              </div>
              
              <Button 
                onClick={capturePhoto} 
                className="w-full h-14 bg-accent text-accent-foreground hover:bg-accent/90 text-lg"
              >
                <Camera className="h-6 w-6 mr-2" />
                Fotograf Cek
              </Button>
              
              <Button
                onClick={() => setIsCameraActive(false)}
                variant="outline"
                className="w-full"
              >
                Iptal
              </Button>
            </div>
          )}

          {/* PROCESSING STEP */}
          {step === 'processing' && (
            <div className="space-y-6 py-8">
              {capturedImage && (
                <div className="relative">
                  <img 
                    src={capturedImage} 
                    alt="Captured receipt" 
                    className="w-full rounded-xl opacity-50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-background/90 backdrop-blur p-6 rounded-2xl text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />
                      <p className="font-medium text-foreground">Analiz ediliyor...</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Yapay zeka fisi okuyor
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">OCR Islemi</span>
                  <span className="font-medium text-accent">{confidence}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent transition-all duration-300 rounded-full"
                    style={{ width: `${confidence}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* REVIEW STEP */}
          {step === 'review' && (
            <div className="space-y-4">
              {/* Thumbnail */}
              {capturedImage && (
                <div className="flex gap-4 p-3 bg-muted/50 rounded-xl">
                  <img 
                    src={capturedImage} 
                    alt="Receipt" 
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-600">Basariyla okundu</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Asagidaki bilgileri kontrol edin
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={resetScanner}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Editable Fields */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Tutar (TRY)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={extractedData.amount}
                      onChange={e => setExtractedData(prev => ({ ...prev, amount: e.target.value }))}
                      className="h-10 font-medium"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">KDV (TRY)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={extractedData.kdvAmount}
                      onChange={e => setExtractedData(prev => ({ ...prev, kdvAmount: e.target.value }))}
                      className="h-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">Satici / Isletme</Label>
                  <Input
                    value={extractedData.supplier}
                    onChange={e => setExtractedData(prev => ({ ...prev, supplier: e.target.value }))}
                    className="h-10"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">Aciklama</Label>
                  <Input
                    value={extractedData.description}
                    onChange={e => setExtractedData(prev => ({ ...prev, description: e.target.value }))}
                    className="h-10"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Kategori</Label>
                    <Select 
                      value={extractedData.category}
                      onValueChange={v => setExtractedData(prev => ({ ...prev, category: v as ExpenseCategory }))}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EXPENSE_CATEGORIES).map(([key, val]) => (
                          <SelectItem key={key} value={key}>{val.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tarih</Label>
                    <Input
                      type="date"
                      value={extractedData.date}
                      onChange={e => setExtractedData(prev => ({ ...prev, date: e.target.value }))}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={resetScanner}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Tekrar Tara
                </Button>
                <Button 
                  className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={handleSave}
                  disabled={!extractedData.amount}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Kaydet
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
