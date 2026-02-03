'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Zap, Save, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { getTemplates, saveTemplate, deleteTemplate, generateId } from '@/lib/store'
import { KDV_RATES, EXEMPTION_REASONS } from '@/lib/types'
import type { InvoiceTemplate } from '@/lib/types'

export function TemplateManager() {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultKdvRate: 20,
    isExempt: false,
    exemptionReason: '',
    defaultItemDescription: ''
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = () => {
    setTemplates(getTemplates())
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      defaultKdvRate: 20,
      isExempt: false,
      exemptionReason: '',
      defaultItemDescription: ''
    })
    setIsCreating(false)
    setEditingId(null)
  }

  const handleSave = () => {
    const template: InvoiceTemplate = {
      id: editingId || generateId(),
      name: formData.name,
      description: formData.description,
      defaultKdvRate: formData.isExempt ? 0 : formData.defaultKdvRate,
      isExempt: formData.isExempt,
      exemptionReason: formData.exemptionReason,
      defaultItems: formData.defaultItemDescription ? [{
        description: formData.defaultItemDescription,
        quantity: 1,
        unitPrice: 0
      }] : []
    }
    saveTemplate(template)
    loadTemplates()
    resetForm()
  }

  const handleEdit = (template: InvoiceTemplate) => {
    setFormData({
      name: template.name,
      description: template.description,
      defaultKdvRate: template.defaultKdvRate,
      isExempt: template.isExempt,
      exemptionReason: template.exemptionReason || '',
      defaultItemDescription: template.defaultItems[0]?.description || ''
    })
    setEditingId(template.id)
    setIsCreating(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Bu sablonu silmek istediginizden emin misiniz?')) {
      deleteTemplate(id)
      loadTemplates()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Hizli Fatura Sablonlari</h3>
          <p className="text-sm text-muted-foreground">
            Sik kullandiginiz fatura tiplerini sablon olarak kaydedin
          </p>
        </div>
        {!isCreating && (
          <Button size="sm" onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Sablon
          </Button>
        )}
      </div>

      {isCreating && (
        <Card className="border-accent/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {editingId ? 'Sablonu Duzenle' : 'Yeni Sablon Olustur'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sablon Adi *</Label>
                <Input
                  placeholder="Ornek: Yurt disi yazilim hizmeti"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Aciklama</Label>
                <Input
                  placeholder="Kisa aciklama"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
              <div>
                <p className="font-medium text-sm">KDV Istisnasi</p>
                <p className="text-xs text-muted-foreground">Ihracat vb. istisnali faturalar icin</p>
              </div>
              <Switch
                checked={formData.isExempt}
                onCheckedChange={checked => setFormData(prev => ({ 
                  ...prev, 
                  isExempt: checked,
                  defaultKdvRate: checked ? 0 : 20
                }))}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {!formData.isExempt ? (
                <div className="space-y-2">
                  <Label>Varsayilan KDV Orani</Label>
                  <Select
                    value={String(formData.defaultKdvRate)}
                    onValueChange={v => setFormData(prev => ({ ...prev, defaultKdvRate: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KDV_RATES.filter(r => r.value > 0).map(rate => (
                        <SelectItem key={rate.value} value={String(rate.value)}>
                          {rate.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Istisna Nedeni</Label>
                  <Select
                    value={formData.exemptionReason}
                    onValueChange={v => setFormData(prev => ({ ...prev, exemptionReason: v }))}
                  >
                    <SelectTrigger>
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
              <div className="space-y-2">
                <Label>Varsayilan Hizmet Adi</Label>
                <Input
                  placeholder="Ornek: Yazilim gelistirme hizmeti"
                  value={formData.defaultItemDescription}
                  onChange={e => setFormData(prev => ({ ...prev, defaultItemDescription: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={resetForm}>
                <X className="w-4 h-4 mr-2" />
                Iptal
              </Button>
              <Button 
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={handleSave}
                disabled={!formData.name}
              >
                <Save className="w-4 h-4 mr-2" />
                Kaydet
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template List */}
      {templates.length === 0 && !isCreating ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Henuz sablon olusturmadiniz</p>
            <p className="text-sm text-muted-foreground mt-1">
              Sik kullandiginiz fatura tiplerini hizla kesmek icin sablon ekleyin
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map(template => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      template.isExempt 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-accent/20 text-accent-foreground'
                    }`}>
                      {template.isExempt ? 'Istisna' : `%${template.defaultKdvRate} KDV`}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
