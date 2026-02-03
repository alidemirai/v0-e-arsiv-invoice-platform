'use client'

import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, AlertCircle, CheckCircle2, Info, ExternalLink } from 'lucide-react'


interface GIBLoginModalProps {
  onSuccess: () => void
  onCancel?: () => void
}

export function GIBLoginModal({ onSuccess, onCancel }: GIBLoginModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [environment, setEnvironment] = useState<'test' | 'production'>('production')
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/gib/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          environment
        })
      })

      const result = await response.json()

      if (result.success) {
        localStorage.setItem('gib-token', result.token)
        localStorage.setItem('gib-username', formData.username)
        localStorage.setItem('gib-environment', environment)
        
        setSuccess(true)
        setTimeout(() => {
          onSuccess()
        }, 1000)
      } else {
        setError(result.error || 'Giris basarisiz oldu')
      }
    } catch (err) {
      console.error('[v0] Login error:', err)
      setError('Beklenmeyen bir hata olustu. Lutfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
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
            <Alert className="border-amber-200 bg-amber-50 text-amber-900">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs">
                GIB e-Arsiv islemleri icin Interaktif Vergi Dairesi kullanici kodunuzu ve sifrenizi girin.
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
              <Label className="text-sm font-medium">Giris Bilgileri</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm">Kullanici Kodu</Label>
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

            <div className="space-y-2">
              <Label className="text-sm">Sunucu Ortami</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={environment === 'test' ? 'default' : 'outline'}
                  className={`flex-1 ${environment === 'test' ? '' : 'bg-transparent'}`}
                  onClick={() => setEnvironment('test')}
                  disabled={loading || success}
                >
                  Test Ortami
                </Button>
                <Button
                  type="button"
                  variant={environment === 'production' ? 'default' : 'outline'}
                  className={`flex-1 ${environment === 'production' ? '' : 'bg-transparent'}`}
                  onClick={() => setEnvironment('production')}
                  disabled={loading || success}
                >
                  Gercek Ortam
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Gercek: earsivportal.efatura.gov.tr
              </p>
            </div>
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
