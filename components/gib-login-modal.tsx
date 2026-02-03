'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, AlertCircle, CheckCircle2, Info, ExternalLink, Wifi } from 'lucide-react'

interface GIBLoginModalProps {
  onSuccess: () => void
  onCancel?: () => void
}

export function GIBLoginModal({ onSuccess, onCancel }: GIBLoginModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    proxyUrl: typeof window !== 'undefined' ? localStorage.getItem('gib-proxy-url') || '' : ''
  })

  const [proxyStatus, setProxyStatus] = useState<'checking' | 'connected' | 'disconnected' | null>(null)

  useEffect(() => {
    if (formData.proxyUrl) {
      checkProxyStatus()
    }
  }, [formData.proxyUrl])

  const checkProxyStatus = async () => {
    if (!formData.proxyUrl) {
      setProxyStatus('disconnected')
      return
    }

    setProxyStatus('checking')
    try {
      const response = await fetch(`${formData.proxyUrl}/health`, {
        signal: AbortSignal.timeout(3000)
      })
      if (response.ok) {
        setProxyStatus('connected')
      } else {
        setProxyStatus('disconnected')
      }
    } catch {
      setProxyStatus('disconnected')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Save proxy URL if provided
      if (formData.proxyUrl) {
        localStorage.setItem('gib-proxy-url', formData.proxyUrl)
      }

      const response = await fetch('/api/gib/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          proxyUrl: formData.proxyUrl || undefined
        })
      })

      const result = await response.json()

      if (result.success) {
        localStorage.setItem('gib-token', result.token)
        localStorage.setItem('gib-username', formData.username)
        
        setSuccess(true)
        setTimeout(() => {
          onSuccess()
        }, 1000)
      } else {
        setError(result.error || 'Giris basarisiz oldu')
      }
    } catch (err) {
      console.log('[v0] Login error:', err)
      setError('Beklenmeyen bir hata olustu. Lutfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
    if (field === 'proxyUrl') {
      checkProxyStatus()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-border/50">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Hos Geldiniz</CardTitle>
              <CardDescription>
                GIB hesabinizla giris yapin
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50 text-blue-900">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs">
                Yerel proxy sunucusu kullaniyor musunuz? Asagida ayarlayin.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-900">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>Giris basarili! Yonlendiriliyorsunuz...</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm">Kullanici Kodu (VKN)</Label>
              <Input
                id="username"
                type="text"
                placeholder="Ornek: 27421877"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                disabled={loading || success}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">Sifre</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={loading || success}
                required
                className="h-11"
              />
            </div>

            <div className="pt-2 border-t">
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm text-muted-foreground justify-between"
                onClick={() => setShowAdvanced(!showAdvanced)}
                disabled={loading || success}
              >
                <span className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  Ileri Seçenekler
                </span>
                <span>{showAdvanced ? '▼' : '▶'}</span>
              </Button>
            </div>

            {showAdvanced && (
              <div className="space-y-3 bg-muted/50 p-3 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="proxyUrl" className="text-sm">Proxy Sunucusu URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="proxyUrl"
                      type="url"
                      placeholder="http://192.168.1.100:3001"
                      value={formData.proxyUrl}
                      onChange={(e) => handleInputChange('proxyUrl', e.target.value)}
                      disabled={loading || success}
                      className="h-10 text-sm"
                    />
                    {proxyStatus && (
                      <div className={`flex items-center px-3 rounded text-sm ${
                        proxyStatus === 'connected' ? 'bg-green-100 text-green-700' :
                        proxyStatus === 'checking' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {proxyStatus === 'checking' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : proxyStatus === 'connected' ? (
                          '✓'
                        ) : (
                          '✗'
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Yerel proxy sunucunuzun adresi (PC'nin IP:3001)
                  </p>
                </div>

                {formData.proxyUrl && proxyStatus !== 'connected' && (
                  <Alert className="border-yellow-200 bg-yellow-50 text-yellow-900">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-xs">
                      Proxy sunucusuna erisilemedi. Direkt baglanti denecek.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2">
            <Button 
              type="submit" 
              className="w-full h-11"
              disabled={loading || success || !formData.username || !formData.password}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {success ? 'Giris Yapildi' : 'Giris Yap'}
            </Button>
            
            {onCancel && (
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full text-muted-foreground"
                onClick={onCancel}
                disabled={loading || success}
              >
                Iptal
              </Button>
            )}

            <p className="text-xs text-center text-muted-foreground">
              Sifrenizi mi unuttunuz?{' '}
              <a 
                href="https://ivd.gib.gov.tr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                ivd.gib.gov.tr
                <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
