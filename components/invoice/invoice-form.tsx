'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Eye, FileCheck, Zap, Save, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatCurrency, getCustomers, getTemplates, generateId } from '@/lib/store'
import { KDV_RATES, EXEMPTION_REASONS } from '@/lib/types'
import type { Customer, InvoiceTemplate, InvoiceItem } from '@/lib/types'

interface InvoiceFormProps {
  onSubmit: (data: any) => void
  onPreview?: (data: any) => void
  isSubmitting?: boolean
}

export function InvoiceForm({ onSubmit, onPreview, isSubmitting }: InvoiceFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [showCustomerSelect, setShowCustomerSelect] = useState(false)
  const [showTemplateSelect, setShowTemplateSelect] = useState(false)

  const [formData, setFormData] = useState({
    customerVkn: '',
    customerName: '',
    customerTaxOffice: '',
    customerAddress: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    kdvRate: 20,
    isExempt: false,
    exemptionCode: '',
    notes: ''
  })

  const [items, setItems] = useState<Partial<InvoiceItem>[]>([
    { id: generateId(), description: '', quantity: 1, unitPrice: 0, kdvRate: 20 }
  ])

  useEffect(() => {
    setCustomers(getCustomers())
    setTemplates(getTemplates())
  }, [])

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerVkn: customer.vkn,
        customerName: customer.name,
        customerTaxOffice: customer.taxOffice || '',
        customerAddress: customer.address || ''
      }))
      setSelectedCustomer(customerId)
    }
    setShowCustomerSelect(false)
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setFormData(prev => ({
        ...prev,
        kdvRate: template.defaultKdvRate,
        isExempt: template.isExempt,
        exemptionCode: template.exemptionReason || ''
      }))
      if (template.defaultItems.length > 0) {
        setItems(template.defaultItems.map(item => ({
          ...item,
          id: generateId(),
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          kdvRate: template.defaultKdvRate
        })))
      }
    }
    setShowTemplateSelect(false)
  }

  const addItem = () => {
    setItems(prev => [...prev, {
      id: generateId(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      kdvRate: formData.kdvRate
    }])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: string, value: any) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      return sum + ((item.quantity || 0) * (item.unitPrice || 0))
    }, 0)
    
    const kdvRate = formData.isExempt ? 0 : formData.kdvRate
    const kdvAmount = subtotal * (kdvRate / 100)
    const total = subtotal + kdvAmount

    return { subtotal, kdvAmount, total, kdvRate }
  }

  const { subtotal, kdvAmount, total, kdvRate } = calculateTotals()

  const handleSubmit = () => {
    const invoiceData = {
      ...formData,
      items: items.map(item => ({
        ...item,
        total: (item.quantity || 0) * (item.unitPrice || 0)
      })),
      subtotal,
      kdvAmount,
      total,
      kdvRate
    }
    onSubmit(invoiceData)
  }

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowCustomerSelect(!showCustomerSelect)}
          className="bg-transparent"
        >
          <Users className="w-4 h-4 mr-2" />
          Kayitli Musteri
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowTemplateSelect(!showTemplateSelect)}
          className="bg-transparent"
        >
          <Zap className="w-4 h-4 mr-2" />
          Hizli Sablon
        </Button>
      </div>

      {/* Customer Select Dropdown */}
      {showCustomerSelect && (
        <Card className="border-accent/50">
          <CardContent className="p-3">
            {customers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Henuz kayitli musteri yok. Musteriler sekmesinden ekleyebilirsiniz.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {customers.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => handleCustomerSelect(customer.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div>
                      <p className="font-medium text-sm">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">VKN: {customer.vkn}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {customer.totalInvoices} fatura
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Template Select Dropdown */}
      {showTemplateSelect && (
        <Card className="border-accent/50">
          <CardContent className="p-3">
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Henuz sablon olusturmadiniz. Ayarlar sekmesinden yeni sablon ekleyebilirsiniz.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div>
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      template.isExempt ? 'bg-blue-100 text-blue-700' : 'bg-accent/20 text-accent-foreground'
                    }`}>
                      %{template.defaultKdvRate} KDV
                    </span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Form */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Musteri Bilgileri</CardTitle>
          <CardDescription>Fatura kesilecek kisinin bilgileri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>VKN / TCKN *</Label>
              <Input
                placeholder="Vergi No veya TC Kimlik No"
                value={formData.customerVkn}
                onChange={e => setFormData(prev => ({ ...prev, customerVkn: e.target.value }))}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Alici Adi / Unvani *</Label>
              <Input
                placeholder="Firma veya kisi adi"
                value={formData.customerName}
                onChange={e => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Vergi Dairesi</Label>
              <Input
                placeholder="Vergi dairesi adi"
                value={formData.customerTaxOffice}
                onChange={e => setFormData(prev => ({ ...prev, customerTaxOffice: e.target.value }))}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Fatura Tarihi</Label>
              <Input
                type="date"
                value={formData.invoiceDate}
                onChange={e => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                className="h-11"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Adres</Label>
              <Input
                placeholder="Fatura adresi"
                value={formData.customerAddress}
                onChange={e => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                className="h-11"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Items */}
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Mal / Hizmet Detaylari</CardTitle>
            <CardDescription>Faturadaki kalemler</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={addItem} className="bg-transparent">
            <Plus className="w-4 h-4 mr-2" />
            Kalem Ekle
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="p-4 rounded-xl bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Kalem {index + 1}</span>
                {items.length > 1 && (
                  <button 
                    onClick={() => removeItem(item.id!)}
                    className="p-1 hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                )}
              </div>
              <div className="grid md:grid-cols-4 gap-3">
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs">Aciklama *</Label>
                  <Input
                    placeholder="Urun veya hizmet adi"
                    value={item.description || ''}
                    onChange={e => updateItem(item.id!, 'description', e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Miktar</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity || 1}
                    onChange={e => updateItem(item.id!, 'quantity', parseInt(e.target.value) || 1)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Birim Fiyat (TRY)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={item.unitPrice || ''}
                    onChange={e => updateItem(item.id!, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* KDV Settings */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>KDV Ayarlari</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>KDV Orani</Label>
              <Select
                value={String(formData.kdvRate)}
                onValueChange={v => {
                  const rate = parseInt(v)
                  setFormData(prev => ({ 
                    ...prev, 
                    kdvRate: rate,
                    isExempt: rate === 0
                  }))
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KDV_RATES.map(rate => (
                    <SelectItem key={rate.value} value={String(rate.value)}>
                      {rate.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.isExempt && (
              <div className="space-y-2">
                <Label>Istisna Nedeni</Label>
                <Select
                  value={formData.exemptionCode}
                  onValueChange={v => setFormData(prev => ({ ...prev, exemptionCode: v }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Istisna sebebi secin" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXEMPTION_REASONS.map(reason => (
                      <SelectItem key={reason.code} value={reason.code}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Notlar (Opsiyonel)</Label>
            <Textarea
              placeholder="Faturaya eklemek istediginiz notlar..."
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card className="border-0 shadow-md bg-primary/5">
        <CardContent className="p-5">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ara Toplam</span>
              <span className="font-medium">{formatCurrency(subtotal)} TRY</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">KDV (%{kdvRate})</span>
              <span className="font-medium">{formatCurrency(kdvAmount)} TRY</span>
            </div>
            <div className="flex justify-between text-lg pt-2 border-t">
              <span className="font-semibold">Genel Toplam</span>
              <span className="font-bold text-accent">{formatCurrency(total)} TRY</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-3">
        {onPreview && (
          <Button 
            variant="outline" 
            className="flex-1 h-12 bg-transparent"
            onClick={() => onPreview({ ...formData, items, subtotal, kdvAmount, total })}
          >
            <Eye className="w-4 h-4 mr-2" />
            Onizle
          </Button>
        )}
        <Button 
          className="flex-1 h-12 bg-accent text-accent-foreground hover:bg-accent/90"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          <FileCheck className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Kaydediliyor...' : 'Faturayi Kaydet'}
        </Button>
      </div>
    </div>
  )
}
