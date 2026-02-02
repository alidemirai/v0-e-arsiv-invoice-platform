'use client'

import React from "react"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'


interface GIBLoginModalProps {
  onSuccess: () => void
  onCancel?: () => void
}

export function GIBLoginModal({ onSuccess, onCancel }: GIBLoginModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    vkn: '',
    environment: 'test' as 'test' | 'production'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Call backend API instead of server action
      const response = await fetch('/api/gib/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        // Store token in localStorage for API calls
        localStorage.setItem('gib-token', result.token)
        localStorage.setItem('gib-vkn', formData.vkn)
        localStorage.setItem('gib-username', formData.username)
        
        setSuccess(true)
        setTimeout(() => {
          onSuccess()
        }, 1000)
      } else {
        setError(result.error || 'Giriş başarısız oldu')
      }
    } catch (err) {
      setError('Beklenmeyen bir hata oluştu')
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
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">GİB e-Arşiv Giriş</CardTitle>
              <CardDescription>
                Gelir İdaresi Başkanlığı hesabınıza giriş yapın
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-900">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>Giriş başarılı! Yönlendiriliyorsunuz...</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="environment">Ortam</Label>
              <Select 
                value={formData.environment}
                onValueChange={(value) => handleInputChange('environment', value)}
                disabled={loading || success}
              >
                <SelectTrigger id="environment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">Test Ortamı</SelectItem>
                  <SelectItem value="production">Canlı Ortam (Production)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Test ortamında deneme yapabilirsiniz
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vkn">Vergi Kimlik Numarası (VKN)</Label>
              <Input
                id="vkn"
                type="text"
                placeholder="10 haneli VKN"
                maxLength={10}
                value={formData.vkn}
                onChange={(e) => handleInputChange('vkn', e.target.value.replace(/\D/g, ''))}
                disabled={loading || success}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input
                id="username"
                type="text"
                placeholder="GİB kullanıcı adınız"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                disabled={loading || success}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={loading || success}
                required
              />
            </div>

            <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
              <p className="text-xs text-blue-900 leading-relaxed">
                <strong>Bilgi:</strong> Giriş bilgileriniz güvenli bir şekilde şifrelenir ve sadece GİB ile iletişim için kullanılır. 
                Oturum 2 saat süreyle geçerlidir.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex gap-2">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 bg-transparent"
                onClick={onCancel}
                disabled={loading || success}
              >
                İptal
              </Button>
            )}
            <Button 
              type="submit" 
              className="flex-1"
              disabled={loading || success || !formData.username || !formData.password || !formData.vkn || formData.vkn.length !== 10}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {success ? 'Giriş Yapıldı' : 'Giriş Yap'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
