'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, FileText, Plus, Menu, LogOut, Settings, 
  User, ChevronRight, Calendar, Filter, RefreshCw,
  FileCheck, Send, Eye, Trash2, Search, X,
  Building2, Phone, AlertCircle, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Tab = 'home' | 'documents' | 'create' | 'menu'
type DocumentTab = 'drafts' | 'sent'
type InvoiceTab = 'general' | 'recipient' | 'items' | 'notes'

interface Invoice {
  id: string
  invoiceNo: string
  date: string
  customer: string
  amount: number
  status: 'draft' | 'sent' | 'approved'
}

export default function EBelgeApp() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [documentTab, setDocumentTab] = useState<DocumentTab>('sent')
  const [invoiceTab, setInvoiceTab] = useState<InvoiceTab>('general')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Invoice[]>([])
  
  const [newInvoice, setNewInvoice] = useState({
    faturaTarihi: new Date().toISOString().slice(0, 16),
    aliciVkn: '', aliciAdi: '', aliciSoyadi: '',
    vergiDairesi: '', email: '', telefon: '', adres: '',
    malHizmet: '', miktar: 1, birimFiyat: 0, kdvOrani: 20, notlar: ''
  })

  useEffect(() => { checkSession() }, [])

  const checkSession = async () => {
    try {
      const res = await fetch('/api/gib/session')
      const data = await res.json()
      if (data.isLoggedIn) {
        setIsLoggedIn(true)
        setUsername(data.username || '')
        fetchData()
      }
    } catch (e) { /* no session */ }
  }

  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
      setError('Kullanici kodu ve sifre gerekli')
      return
    }
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/gib/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginForm.username, password: loginForm.password, environment: 'production' })
      })
      const data = await res.json()
      
      if (data.success) {
        setIsLoggedIn(true)
        setUsername(loginForm.username)
        setActiveTab('home')
        fetchData()
      } else {
        setError(data.error || 'Giris basarisiz')
      }
    } catch (e) {
      setError('Baglanti hatasi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try { await fetch('/api/gib/logout', { method: 'POST' }) } catch (e) {}
    setIsLoggedIn(false)
    setUsername('')
    setInvoices([])
    setExpenses([])
    setActiveTab('home')
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [invoicesRes, expensesRes] = await Promise.all([
        fetch('/api/gib/invoices'),
        fetch('/api/gib/expenses')
      ])
      const [invoicesData, expensesData] = await Promise.all([invoicesRes.json(), expensesRes.json()])
      if (invoicesData.success && invoicesData.data) setInvoices(invoicesData.data)
      if (expensesData.success && expensesData.data) setExpenses(expensesData.data)
    } catch (e) { console.error('Fetch error:', e) }
    finally { setIsLoading(false) }
  }

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const totalKdv = totalAmount * 0.20

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-primary text-primary-foreground p-4 flex items-center justify-center">
          <FileText className="w-6 h-6 mr-2" />
          <span className="text-xl font-semibold">e-Fatura</span>
        </header>

        <div className="flex-1 p-4 flex flex-col justify-center max-w-md mx-auto w-full">
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-2">
              <div className="bg-primary/10 text-primary p-3 rounded-lg text-sm mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p>GIB e-Arsiv Fatura olusturmak ve faturalarinizi goruntulayebilmek icin Interaktif Vergi Dairesi Uygulamasi kullanici kodunuzu ve sifrenizi doldurmaniz gerekmektedir.</p>
                </div>
              </div>
              <CardTitle className="text-primary text-lg">Interaktif Vergi Dairesi Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Kullanici Kodu</label>
                <div className="relative">
                  <Input
                    placeholder="Kullanici kodunuz"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="pr-10 border-border"
                  />
                  {loginForm.username && (
                    <button onClick={() => setLoginForm({ ...loginForm, username: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Sifre</label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="Sifreniz"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="pr-10 border-border"
                  />
                  {loginForm.password && (
                    <button onClick={() => setLoginForm({ ...loginForm, password: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">{error}</div>
              )}

              <Button onClick={handleLogin} disabled={isLoading} className="w-full">
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <FileCheck className="w-4 h-4 mr-2" />}
                Kaydet
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <header className="bg-primary text-primary-foreground p-4 flex items-center justify-center sticky top-0 z-50">
        <FileText className="w-6 h-6 mr-2" />
        <span className="text-xl font-semibold">e-Fatura</span>
      </header>

      <main className="flex-1 p-4">
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 flex items-center gap-2 border rounded-lg p-2.5 bg-card">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="flex-1 bg-transparent text-sm outline-none" />
                    <X className="w-4 h-4 text-muted-foreground cursor-pointer" onClick={() => setDateRange({ ...dateRange, start: '' })} />
                  </div>
                  <div className="flex-1 flex items-center gap-2 border rounded-lg p-2.5 bg-card">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="flex-1 bg-transparent text-sm outline-none" />
                    <X className="w-4 h-4 text-muted-foreground cursor-pointer" onClick={() => setDateRange({ ...dateRange, end: '' })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs bg-transparent"><Calendar className="w-3 h-3 mr-1" />Bu Hafta</Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs bg-transparent"><Calendar className="w-3 h-3 mr-1" />Son 7 Gun</Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs bg-transparent"><Calendar className="w-3 h-3 mr-1" />Bu Ay</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 border rounded-lg p-2.5 bg-muted/50 mb-4">
                  <span className="text-sm flex-1">Turk Lirasi</span>
                  <ChevronDown className="w-4 h-4" />
                </div>

                <div className="flex">
                  <div className="flex flex-col items-center pr-6 border-r">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                      <Send className="w-8 h-8 text-primary" />
                    </div>
                    <span className="text-primary font-semibold text-sm">Giden Faturalar</span>
                    <span className="text-2xl font-bold">{invoices.length} Adet</span>
                  </div>
                  <div className="flex-1 pl-6 space-y-2">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Giden Faturalarin Toplam Tutari</p>
                      <p className="text-lg font-bold">{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Giden Faturalarin KDV Tutari</p>
                      <p className="text-lg font-bold">{totalKdv.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY</p>
                    </div>
                  </div>
                </div>

                <Button onClick={() => { setActiveTab('documents'); setDocumentTab('sent'); }} className="w-full mt-4">
                  Tum Giden Faturalari Goruntule <ChevronRight className="w-4 h-4 ml-2" />
                </Button>

                <div className="mt-4 bg-destructive/10 text-destructive p-3 rounded-lg text-xs flex gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>Gosterilen KDV tutari, tum giden faturalariniza aittir.</p>
                </div>
              </CardContent>
            </Card>

            <Button onClick={fetchData} disabled={isLoading} variant="outline" className="w-full bg-transparent">
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Verileri Guncelle
            </Button>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="flex rounded-lg border overflow-hidden">
              <button onClick={() => setDocumentTab('drafts')} className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${documentTab === 'drafts' ? 'bg-card text-foreground' : 'bg-primary text-primary-foreground'}`}>
                <FileText className="w-4 h-4" />Taslaklar
              </button>
              <button onClick={() => setDocumentTab('sent')} className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 ${documentTab === 'sent' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'}`}>
                <Send className="w-4 h-4" />Giden Kutusu
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{invoices.length} kayittan {invoices.length} adet gosteriliyor.</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Sirala</Button>
                <Button size="sm"><Filter className="w-4 h-4 mr-1" />Filtrele</Button>
              </div>
            </div>

            {invoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Henuz fatura bulunmuyor</p>
              </div>
            ) : (
              <div className="space-y-2">
                {invoices.map((invoice) => (
                  <Card key={invoice.id} className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{invoice.customer}</p>
                          <p className="text-sm text-muted-foreground">{invoice.invoiceNo}</p>
                          <p className="text-sm text-muted-foreground">{invoice.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{invoice.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${invoice.status === 'approved' ? 'bg-green-100 text-green-700' : invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {invoice.status === 'approved' ? 'Onaylandi' : invoice.status === 'sent' ? 'Gonderildi' : 'Taslak'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATE TAB */}
        {activeTab === 'create' && (
          <div className="space-y-4">
            <div className="flex gap-1 overflow-x-auto pb-2">
              {[{ key: 'general', label: 'Genel Bilgiler' }, { key: 'recipient', label: 'Alici Bilgileri' }, { key: 'items', label: 'Kalem Bilgi...' }, { key: 'notes', label: 'Notlar' }].map((tab) => (
                <button key={tab.key} onClick={() => setInvoiceTab(tab.key as InvoiceTab)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${invoiceTab === tab.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-primary font-semibold">{invoiceTab === 'general' ? 'Genel Bilgiler' : invoiceTab === 'recipient' ? 'Alici Bilgileri' : invoiceTab === 'items' ? 'Mal/Hizmet Bilgileri' : 'Notlar'}</h3>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="w-4 h-4 mr-1" />Temizle</Button>
                    <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                  </div>
                </div>

                {invoiceTab === 'general' && (
                  <div className="space-y-4">
                    <div><label className="text-sm text-muted-foreground mb-1.5 block">Fatura Numarasi</label><Input value="Otomatik Atanacaktir" disabled className="bg-muted/50" /></div>
                    <div><label className="text-sm text-muted-foreground mb-1.5 block">Fatura Tipi*</label><div className="flex items-center border rounded-lg p-2.5"><span className="flex-1">Satis</span><ChevronDown className="w-4 h-4" /></div></div>
                    <div><label className="text-sm text-muted-foreground mb-1.5 block">Fatura Tarihi</label><div className="flex items-center gap-2 border rounded-lg p-2.5"><Calendar className="w-4 h-4 text-muted-foreground" /><input type="datetime-local" value={newInvoice.faturaTarihi} onChange={(e) => setNewInvoice({ ...newInvoice, faturaTarihi: e.target.value })} className="flex-1 bg-transparent text-sm outline-none" /></div></div>
                    <div><label className="text-sm text-muted-foreground mb-1.5 block">Para Birimi</label><div className="flex items-center border rounded-lg p-2.5"><span className="flex-1">Turk Lirasi</span><ChevronDown className="w-4 h-4" /></div></div>
                  </div>
                )}

                {invoiceTab === 'recipient' && (
                  <div className="space-y-4">
                    <div><label className="text-sm text-muted-foreground mb-1.5 block">Alici VKN/TCKN*</label><div className="relative"><Input placeholder="Alici VKN/TCKN" value={newInvoice.aliciVkn} onChange={(e) => setNewInvoice({ ...newInvoice, aliciVkn: e.target.value })} className="pr-10" /><button className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"><Search className="w-4 h-4" /></button></div></div>
                    <div><label className="text-sm text-muted-foreground mb-1.5 block">Adi/Unvani*</label><Input placeholder="Adi/Unvani" value={newInvoice.aliciAdi} onChange={(e) => setNewInvoice({ ...newInvoice, aliciAdi: e.target.value })} /></div>
                    <div><label className="text-sm text-muted-foreground mb-1.5 block">Soyadi</label><Input placeholder="Soyadi" value={newInvoice.aliciSoyadi} onChange={(e) => setNewInvoice({ ...newInvoice, aliciSoyadi: e.target.value })} /></div>
                    <div><label className="text-sm text-muted-foreground mb-1.5 block">Ulke*</label><div className="flex items-center border rounded-lg p-2.5"><span className="flex-1">Turkiye</span><ChevronDown className="w-4 h-4" /></div></div>
                    <div><label className="text-sm text-muted-foreground mb-1.5 block">Vergi Dairesi</label><Input placeholder="Vergi Dairesi" value={newInvoice.vergiDairesi} onChange={(e) => setNewInvoice({ ...newInvoice, vergiDairesi: e.target.value })} /></div>
                    <div><label className="text-sm text-muted-foreground mb-1.5 block">e-Posta</label><Input type="email" placeholder="ornek@ebelge.com" value={newInvoice.email} onChange={(e) => setNewInvoice({ ...newInvoice, email: e.target.value })} /></div>
                    <div><label className="text-sm text-muted-foreground mb-1.5 block">Telefon</label><Input placeholder="(5xx)xxx xx xx" value={newInvoice.telefon} onChange={(e) => setNewInvoice({ ...newInvoice, telefon: e.target.value })} /></div>
                  </div>
                )}

                {invoiceTab === 'items' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center"><h4 className="text-primary font-medium">Mal/Hizmet Bilgileri</h4><Button variant="outline" size="sm" className="text-primary border-primary bg-transparent">+ Toplu Vergi Ekle</Button></div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex justify-between"><span className="text-primary font-medium">{newInvoice.malHizmet || 'Mal/Hizmet'}</span><span>{newInvoice.miktar} Adet x {newInvoice.birimFiyat} TRY</span></div>
                      <div className="text-right mt-2"><p className="text-sm text-muted-foreground">KDV Dahil Tutar</p><p className="text-xl font-bold">{(newInvoice.miktar * newInvoice.birimFiyat * (1 + newInvoice.kdvOrani / 100)).toFixed(2)} TRY</p></div>
                    </div>
                    <div className="flex gap-2"><Button variant="outline" className="flex-1 bg-transparent" disabled><Eye className="w-4 h-4 mr-2" />PDF Goruntule</Button><Button className="flex-1"><Plus className="w-4 h-4 mr-2" />Mal/Hizmet Ekle</Button></div>
                    <div className="mt-6"><h4 className="text-primary font-medium mb-4">Toplam Bilgileri</h4><div className="bg-muted/50 p-4 rounded-lg space-y-2"><div className="flex justify-between"><span>Toplam Ana Tutar</span><span className="font-bold">{(newInvoice.miktar * newInvoice.birimFiyat).toFixed(2)} TRY</span></div><div className="flex justify-between"><span>Hesaplanan KDV</span><span className="font-bold">{(newInvoice.miktar * newInvoice.birimFiyat * newInvoice.kdvOrani / 100).toFixed(2)} TRY</span></div><div className="flex justify-between border-t pt-2"><span>Odenecek Tutar</span><span className="font-bold">{(newInvoice.miktar * newInvoice.birimFiyat * (1 + newInvoice.kdvOrani / 100)).toFixed(2)} TRY</span></div></div></div>
                  </div>
                )}

                {invoiceTab === 'notes' && (
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full bg-transparent" disabled><Eye className="w-4 h-4 mr-2" />PDF Goruntule</Button>
                    <div><label className="text-sm text-muted-foreground mb-1.5 block">Not</label><textarea placeholder="Not" value={newInvoice.notlar} onChange={(e) => setNewInvoice({ ...newInvoice, notlar: e.target.value })} className="w-full h-32 p-3 border rounded-lg bg-card resize-none outline-none focus:ring-2 focus:ring-primary" /></div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 bg-transparent" disabled><Send className="w-4 h-4 mr-2" />Faturayi Gonder</Button>
              <Button className="flex-1"><FileCheck className="w-4 h-4 mr-2" />Faturayi Kaydet</Button>
            </div>
          </div>
        )}

        {/* MENU TAB */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-card rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center"><User className="w-6 h-6 text-primary" /></div>
              <span className="text-primary font-medium">{username || 'Kullanici'}</span>
            </div>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                {[{ icon: Building2, label: 'Mal/Hizmet Bilgileri' }, { icon: User, label: 'Alici Adres Bilgileri' }, { icon: Phone, label: 'Canli Destek', accent: true }, { icon: Settings, label: 'Sifremi Degistir' }, { icon: FileText, label: 'Yenilikler' }, { icon: Settings, label: 'Ayarlar' }].map((item, i) => (
                  <button key={i} className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0">
                    <item.icon className={`w-5 h-5 ${item.accent ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <span className="text-foreground">{item.label}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Button onClick={handleLogout} variant="destructive" className="w-full"><LogOut className="w-4 h-4 mr-2" />Cikis Yap</Button>
            <p className="text-center text-sm text-muted-foreground">v.1.0.0</p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border safe-area-pb">
        <div className="flex">
          {[{ key: 'home', icon: BarChart3, label: 'Anasayfa' }, { key: 'documents', icon: FileText, label: 'Belgelerim' }, { key: 'create', icon: Plus, label: 'Fatura Olustur', accent: true }, { key: 'menu', icon: Menu, label: 'Menu' }].map((item) => (
            <button key={item.key} onClick={() => setActiveTab(item.key as Tab)} className={`flex-1 flex flex-col items-center py-3 ${activeTab === item.key ? 'text-sidebar-primary' : 'text-sidebar-foreground/70'}`}>
              {item.accent ? (
                <div className="w-10 h-10 bg-sidebar-primary rounded-full flex items-center justify-center -mt-5 mb-1"><item.icon className="w-5 h-5 text-sidebar-primary-foreground" /></div>
              ) : (
                <item.icon className="w-5 h-5 mb-1" />
              )}
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
