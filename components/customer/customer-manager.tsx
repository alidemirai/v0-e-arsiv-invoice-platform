'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Users, Building2, Phone, Mail, FileText, Trash2, Edit2, ChevronRight, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getCustomers, saveCustomer, deleteCustomer, generateId, formatCurrency } from '@/lib/store'
import type { Customer } from '@/lib/types'

interface CustomerManagerProps {
  onSelectCustomer?: (customer: Customer) => void
}

export function CustomerManager({ onSelectCustomer }: CustomerManagerProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    vkn: '',
    taxOffice: '',
    address: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = () => {
    setCustomers(getCustomers())
  }

  const resetForm = () => {
    setFormData({
      name: '',
      vkn: '',
      taxOffice: '',
      address: '',
      phone: '',
      email: ''
    })
    setIsCreating(false)
    setEditingId(null)
  }

  const handleSave = () => {
    const existingCustomer = editingId ? customers.find(c => c.id === editingId) : null
    
    const customer: Customer = {
      id: editingId || generateId(),
      name: formData.name,
      vkn: formData.vkn,
      taxOffice: formData.taxOffice,
      address: formData.address,
      phone: formData.phone,
      email: formData.email,
      totalInvoices: existingCustomer?.totalInvoices || 0,
      totalRevenue: existingCustomer?.totalRevenue || 0,
      createdAt: existingCustomer?.createdAt || new Date().toISOString()
    }
    saveCustomer(customer)
    loadCustomers()
    resetForm()
  }

  const handleEdit = (customer: Customer) => {
    setFormData({
      name: customer.name,
      vkn: customer.vkn,
      taxOffice: customer.taxOffice || '',
      address: customer.address || '',
      phone: customer.phone || '',
      email: customer.email || ''
    })
    setEditingId(customer.id)
    setIsCreating(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Bu musteriyi silmek istediginizden emin misiniz?')) {
      deleteCustomer(id)
      loadCustomers()
      if (selectedCustomer?.id === id) {
        setSelectedCustomer(null)
      }
    }
  }

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.vkn.includes(searchQuery)
  )

  // Customer Detail View
  if (selectedCustomer) {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedCustomer(null)}
          className="mb-2"
        >
          <ChevronRight className="w-4 h-4 mr-2 rotate-180" />
          Geri
        </Button>

        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-8 h-8 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-foreground">{selectedCustomer.name}</h2>
                <p className="text-muted-foreground">VKN: {selectedCustomer.vkn}</p>
                {selectedCustomer.taxOffice && (
                  <p className="text-sm text-muted-foreground">{selectedCustomer.taxOffice}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => handleEdit(selectedCustomer)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleDelete(selectedCustomer.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{selectedCustomer.totalInvoices}</p>
                  <p className="text-sm text-muted-foreground">Toplam Fatura</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(selectedCustomer.totalRevenue)} TRY</p>
                  <p className="text-sm text-muted-foreground">Toplam Gelir</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Info */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Iletisim Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedCustomer.address && (
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                <p className="text-sm">{selectedCustomer.address}</p>
              </div>
            )}
            {selectedCustomer.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm">{selectedCustomer.phone}</p>
              </div>
            )}
            {selectedCustomer.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm">{selectedCustomer.email}</p>
              </div>
            )}
            {!selectedCustomer.address && !selectedCustomer.phone && !selectedCustomer.email && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Iletisim bilgisi eklenmemis
              </p>
            )}
          </CardContent>
        </Card>

        {onSelectCustomer && (
          <Button 
            className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90"
            onClick={() => onSelectCustomer(selectedCustomer)}
          >
            Bu Musteriye Fatura Kes
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Musterilerim</h2>
          <p className="text-sm text-muted-foreground">{customers.length} kayitli musteri</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Musteri
          </Button>
        )}
      </div>

      {/* Search */}
      {!isCreating && customers.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Musteri ara (isim veya VKN)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
      )}

      {/* Create/Edit Form */}
      {isCreating && (
        <Card className="border-accent/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {editingId ? 'Musteriyi Duzenle' : 'Yeni Musteri Ekle'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Musteri Adi / Unvani *</Label>
                <Input
                  placeholder="Firma veya kisi adi"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>VKN / TCKN *</Label>
                <Input
                  placeholder="Vergi No veya TC Kimlik No"
                  value={formData.vkn}
                  onChange={e => setFormData(prev => ({ ...prev, vkn: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Vergi Dairesi</Label>
                <Input
                  placeholder="Vergi dairesi adi"
                  value={formData.taxOffice}
                  onChange={e => setFormData(prev => ({ ...prev, taxOffice: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  placeholder="0555 555 5555"
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>E-posta</Label>
                <Input
                  type="email"
                  placeholder="ornek@firma.com"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Adres</Label>
                <Input
                  placeholder="Fatura adresi"
                  value={formData.address}
                  onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
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
                disabled={!formData.name || !formData.vkn}
              >
                Kaydet
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer List */}
      {!isCreating && (
        <>
          {filteredCustomers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  {searchQuery ? 'Aranan kriterlere uygun musteri bulunamadi' : 'Henuz musteri eklenmemis'}
                </p>
                {!searchQuery && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Fatura keserken hizlica secmek icin musterilerinizi ekleyin
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredCustomers.map(customer => (
                <Card 
                  key={customer.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">VKN: {customer.vkn}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-accent">{customer.totalInvoices} fatura</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(customer.totalRevenue)} TRY
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
