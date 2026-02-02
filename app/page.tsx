'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, FileText, Plus, Menu, LogOut, Settings, 
  User, ChevronRight, Calendar, Filter, RefreshCw,
  FileCheck, Send, Eye, Trash2, Search, X, TrendingUp,
  Building2, Phone, AlertCircle, ChevronDown, Receipt,
  CreditCard, PieChart, ArrowUpRight, ArrowDownRight, Bell, Home
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

type Tab = 'home' | 'documents' | 'create' | 'menu'
type DocumentTab = 'drafts' | 'sent'

interface Invoice {
  id: string
  invoiceNo: string
  date: string
  customer: string
  amount: number
  status: 'draft' | 'sent' | 'approved'
}

// Logo Component
function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`${className} relative flex items-center justify-center`}>
      <div className="absolute inset-0 bg-accent rounded-lg rotate-12" />
      <div className="relative z-10 font-bold text-primary text-lg">eF</div>
    </div>
  )
}

export default function EBelgeApp() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [documentTab, setDocumentTab] = useState<DocumentTab>('sent')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  
  const [loginForm, setLoginForm] = useState({ username: '', password: '', environment: 'test' as 'test' | 'production' })
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Invoice[]>([])

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
        body: JSON.stringify({ username: loginForm.username, password: loginForm.password, environment: loginForm.environment })
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

  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  const totalKdv = totalAmount * 0.20
  const totalExpense = expenses.reduce((sum, exp: any) => sum + (exp.amount || 0), 0)

  // Login Screen - Responsive
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-primary flex">
        {/* Desktop: Left Side Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-primary opacity-90" />
          <div className="relative z-10 text-center">
            <div className="w-24 h-24 bg-accent rounded-2xl rotate-12 mx-auto mb-8 flex items-center justify-center shadow-2xl">
              <span className="text-primary font-bold text-4xl -rotate-12">eF</span>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">e-Fatura Pro</h1>
            <p className="text-xl text-white/80 max-w-md">
              GIB e-Arsiv Fatura yonetim sisteminiz. Hizli, guvenli ve kolay.
            </p>
            <div className="mt-12 flex gap-8 justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-accent">10K+</div>
                <div className="text-white/60 text-sm">Aktif Kullanici</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-accent">1M+</div>
                <div className="text-white/60 text-sm">Fatura</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-accent">99.9%</div>
                <div className="text-white/60 text-sm">Uptime</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side / Mobile: Login Form */}
        <div className="flex-1 flex flex-col bg-background lg:rounded-l-3xl">
          {/* Mobile Header */}
          <header className="lg:hidden bg-primary text-primary-foreground p-4 flex items-center justify-center">
            <Logo className="w-8 h-8 mr-2" />
            <span className="text-xl font-bold">e-Fatura Pro</span>
          </header>

          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
              <div className="hidden lg:block mb-8">
                <h2 className="text-3xl font-bold text-foreground">Hos Geldiniz</h2>
                <p className="text-muted-foreground mt-2">GIB hesabinizla giris yapin</p>
              </div>

              <Card className="shadow-xl border-0 lg:shadow-2xl">
                <CardHeader className="pb-2">
                  <div className="bg-accent/20 text-primary p-4 rounded-xl text-sm mb-2">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-accent" />
                      <p>GIB e-Arsiv islemleri icin Interaktif Vergi Dairesi kullanici kodunuzu ve sifrenizi girin.</p>
                    </div>
                  </div>
                  <CardTitle className="text-primary text-lg">Giris Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Kullanici Kodu</label>
                    <div className="relative">
                      <Input
                        placeholder="Ornek: 12345678"
                        value={loginForm.username}
                        onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                        className="h-12 text-base border-2 focus:border-accent"
                      />
                      {loginForm.username && (
                        <button onClick={() => setLoginForm({ ...loginForm, username: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Sifre</label>
                    <div className="relative">
                      <Input
                        type="password"
                        placeholder="Sifrenizi girin"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="h-12 text-base border-2 focus:border-accent"
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      />
                      {loginForm.password && (
                        <button onClick={() => setLoginForm({ ...loginForm, password: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Environment Toggle */}
                  <div className="p-4 bg-muted rounded-xl space-y-3">
                    <p className="text-sm font-medium text-foreground">Sunucu Ortami</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLoginForm({ ...loginForm, environment: 'test' })}
                        className={`py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                          loginForm.environment === 'test' 
                            ? 'bg-accent text-accent-foreground border-accent' 
                            : 'bg-background text-muted-foreground border-border hover:border-accent/50'
                        }`}
                      >
                        Test Ortami
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginForm({ ...loginForm, environment: 'production' })}
                        className={`py-3 rounded-lg text-sm font-medium transition-all border-2 ${
                          loginForm.environment === 'production' 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                        }`}
                      >
                        Gercek Ortam
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {loginForm.environment === 'test' 
                        ? 'Test: earsivportaltest.efatura.gov.tr' 
                        : 'Gercek: earsivportal.efatura.gov.tr'}
                    </p>
                  </div>

                  {error && (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Giris Basarisiz</p>
                          <p className="mt-1 opacity-90">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button onClick={handleLogin} disabled={isLoading} className="w-full h-12 text-base bg-accent text-accent-foreground hover:bg-accent/90">
                    {isLoading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <FileCheck className="w-5 h-5 mr-2" />}
                    Giris Yap
                  </Button>
                </CardContent>
              </Card>

              <p className="text-center text-muted-foreground text-sm mt-6">
                Sifrenizi mi unuttunuz? <a href="https://ivd.gib.gov.tr" target="_blank" rel="noopener" className="text-accent hover:underline font-medium">ivd.gib.gov.tr</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main App - Responsive Layout
  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 bg-sidebar flex-col fixed h-full">
        <div className="p-6 flex items-center gap-3 border-b border-sidebar-border">
          <Logo className="w-10 h-10" />
          <div>
            <h1 className="font-bold text-sidebar-foreground text-lg">e-Fatura Pro</h1>
            <p className="text-sidebar-foreground/60 text-xs">GIB e-Arsiv</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'home', icon: Home, label: 'Ana Sayfa' },
            { id: 'documents', icon: FileText, label: 'Belgelerim' },
            { id: 'create', icon: Plus, label: 'Fatura Olustur' },
            { id: 'menu', icon: Settings, label: 'Ayarlar' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id 
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground' 
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-sidebar-accent">
            <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center">
              <User className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sidebar-foreground font-medium text-sm truncate">{username}</p>
              <p className="text-sidebar-foreground/60 text-xs">Aktif</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="ghost" className="w-full mt-2 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4 mr-2" />
            Cikis Yap
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pb-20 lg:pb-0">
        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between p-6 border-b bg-card sticky top-0 z-40">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {activeTab === 'home' ? 'Ana Sayfa' : activeTab === 'documents' ? 'Belgelerim' : activeTab === 'create' ? 'Fatura Olustur' : 'Ayarlar'}
            </h1>
            <p className="text-muted-foreground text-sm">Hos geldiniz, {username}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading} className="bg-transparent">
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="icon" className="relative bg-transparent">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center">3</span>
            </Button>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden bg-primary text-primary-foreground p-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="text-lg font-bold">e-Fatura Pro</span>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchData} disabled={isLoading} className="text-primary-foreground">
            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          </Button>
        </header>

        <div className="p-4 lg:p-6">
          {/* HOME TAB */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              {/* Stats Cards - Desktop Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Toplam Gelir</p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-sm font-normal">TRY</span>
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-accent" />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-sm">
                      <ArrowUpRight className="w-4 h-4 text-green-500" />
                      <span className="text-green-500 font-medium">+12%</span>
                      <span className="text-muted-foreground">gecen aya gore</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">KDV Tutari</p>
                        <p className="text-2xl font-bold text-foreground mt-1">
                          {totalKdv.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-sm font-normal">TRY</span>
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-secondary" />
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm mt-3">%20 KDV orani</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Giden Faturalar</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{invoices.length} <span className="text-sm font-normal">Adet</span></p>
                      </div>
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Send className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm mt-3">Bu ay</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Gelen Faturalar</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{expenses.length} <span className="text-sm font-normal">Adet</span></p>
                      </div>
                      <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                        <ArrowDownRight className="w-6 h-6 text-destructive" />
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm mt-3">{totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY toplam</p>
                  </CardContent>
                </Card>
              </div>

              {/* Date Filter */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Tarih Filtresi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 flex items-center gap-2 border-2 rounded-xl p-3 bg-input focus-within:border-accent transition-colors">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="flex-1 bg-transparent outline-none" />
                    </div>
                    <div className="flex-1 flex items-center gap-2 border-2 rounded-xl p-3 bg-input focus-within:border-accent transition-colors">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="flex-1 bg-transparent outline-none" />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent hover:bg-accent hover:text-accent-foreground">Bu Hafta</Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent hover:bg-accent hover:text-accent-foreground">Son 7 Gun</Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent hover:bg-accent hover:text-accent-foreground">Bu Ay</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Invoices */}
              <Card className="border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Son Faturalar</CardTitle>
                    <CardDescription>En son eklenen faturalariniz</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('documents')} className="text-accent">
                    Tumunu Gor <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {invoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Henuz fatura bulunmuyor</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {invoices.slice(0, 5).map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{invoice.customer}</p>
                              <p className="text-sm text-muted-foreground">{invoice.invoiceNo} - {invoice.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-accent">{invoice.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              invoice.status === 'approved' ? 'bg-green-100 text-green-700' : 
                              invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {invoice.status === 'approved' ? 'Onaylandi' : invoice.status === 'sent' ? 'Gonderildi' : 'Taslak'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex rounded-xl border-2 overflow-hidden">
                <button onClick={() => setDocumentTab('drafts')} className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${documentTab === 'drafts' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-muted'}`}>
                  <FileText className="w-4 h-4" />Taslaklar
                </button>
                <button onClick={() => setDocumentTab('sent')} className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${documentTab === 'sent' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-muted'}`}>
                  <Send className="w-4 h-4" />Giden Kutusu
                </button>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">{invoices.length} kayittan {invoices.length} adet gosteriliyor.</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="bg-transparent">
                    <Search className="w-4 h-4 mr-2" />Ara
                  </Button>
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Filter className="w-4 h-4 mr-2" />Filtrele
                  </Button>
                </div>
              </div>

              {invoices.length === 0 ? (
                <Card className="border-0 shadow-md">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Henuz fatura bulunmuyor</p>
                    <p className="text-sm mt-1">Yeni fatura olusturmak icin "Fatura Olustur" sekmesine gidin.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {invoices.map((invoice) => (
                    <Card key={invoice.id} className="cursor-pointer hover:shadow-lg transition-all border-0 shadow-md hover:border-accent/50 border-2 border-transparent">
                      <CardContent className="p-4 md:p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-center gap-4">
                            <div className="hidden md:flex w-12 h-12 rounded-xl bg-primary/10 items-center justify-center">
                              <FileText className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{invoice.customer}</p>
                              <p className="text-sm text-muted-foreground">{invoice.invoiceNo}</p>
                              <p className="text-sm text-muted-foreground">{invoice.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between md:flex-col md:items-end gap-2">
                            <p className="font-bold text-xl text-accent">{invoice.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY</p>
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                              invoice.status === 'approved' ? 'bg-green-100 text-green-700' : 
                              invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
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
            <div className="max-w-4xl mx-auto">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle>Yeni Fatura Olustur</CardTitle>
                  <CardDescription>Asagidaki formu doldurup faturanizi olusturun</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Alici VKN/TCKN *</label>
                      <Input placeholder="Vergi No veya TC Kimlik No" className="h-11" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Alici Adi/Unvani *</label>
                      <Input placeholder="Firma veya kisi adi" className="h-11" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Vergi Dairesi</label>
                      <Input placeholder="Vergi dairesi adi" className="h-11" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Fatura Tarihi</label>
                      <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="h-11" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-2 block">Adres</label>
                      <Input placeholder="Fatura adresi" className="h-11" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Mal/Hizmet Adi *</label>
                      <Input placeholder="Urun veya hizmet adi" className="h-11" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tutar (TRY) *</label>
                      <Input type="number" placeholder="0.00" className="h-11" />
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-3 pt-4">
                    <Button variant="outline" className="flex-1 h-11 bg-transparent">
                      <Eye className="w-4 h-4 mr-2" />Onizle
                    </Button>
                    <Button className="flex-1 h-11 bg-accent text-accent-foreground hover:bg-accent/90">
                      <FileCheck className="w-4 h-4 mr-2" />Faturayi Kaydet
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* MENU/SETTINGS TAB - Dark Theme */}
          {activeTab === 'menu' && (
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Dark Profile Card */}
              <div className="bg-[#192230] rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 flex items-center gap-4 border-b border-[#3d474e]">
                  <div className="w-16 h-16 rounded-full bg-[#ffcd00] flex items-center justify-center">
                    <User className="w-8 h-8 text-[#192230]" />
                  </div>
                  <div>
                    <p className="font-bold text-xl text-white">{username}</p>
                    <p className="text-[#8899a6] text-sm">GIB e-Arsiv Kullanicisi</p>
                  </div>
                </div>
                
                {[
                  { icon: Building2, label: 'Firma Bilgileri', desc: 'Sirket bilgilerinizi yonetin' },
                  { icon: CreditCard, label: 'Fatura Ayarlari', desc: 'Varsayilan fatura ayarlari' },
                  { icon: Bell, label: 'Bildirimler', desc: 'Bildirim tercihleriniz' },
                  { icon: Settings, label: 'Genel Ayarlar', desc: 'Uygulama ayarlari' },
                  { icon: Phone, label: 'Destek', desc: 'Yardim ve iletisim' },
                ].map((item, idx) => (
                  <button 
                    key={item.label} 
                    className={`w-full flex items-center gap-4 p-4 hover:bg-[#2c2f38] transition-colors text-left ${
                      idx !== 4 ? 'border-b border-[#3d474e]/50' : ''
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#2c2f38] flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-[#ffcd00]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{item.label}</p>
                      <p className="text-sm text-[#8899a6]">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#8899a6]" />
                  </button>
                ))}
              </div>

              {/* Logout Button */}
              <button 
                onClick={handleLogout} 
                className="w-full h-14 rounded-xl bg-[#dc3545]/10 border-2 border-[#dc3545]/30 text-[#dc3545] font-medium flex items-center justify-center gap-2 hover:bg-[#dc3545] hover:text-white transition-all"
              >
                <LogOut className="w-5 h-5" />
                Cikis Yap
              </button>

              <p className="text-center text-muted-foreground text-sm py-4">e-Fatura Pro v2.0.0</p>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-50">
        <div className="flex">
          {[
            { id: 'home', icon: Home, label: 'Anasayfa' },
            { id: 'documents', icon: FileText, label: 'Belgelerim' },
            { id: 'create', icon: Plus, label: 'Olustur', accent: true },
            { id: 'menu', icon: Menu, label: 'Menu' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`flex-1 flex flex-col items-center py-3 transition-colors ${
                item.accent 
                  ? '' 
                  : activeTab === item.id 
                    ? 'text-accent' 
                    : 'text-muted-foreground'
              }`}
            >
              {item.accent ? (
                <div className="w-12 h-12 -mt-6 bg-accent rounded-full flex items-center justify-center shadow-lg">
                  <item.icon className="w-6 h-6 text-accent-foreground" />
                </div>
              ) : (
                <item.icon className="w-5 h-5" />
              )}
              <span className={`text-xs mt-1 ${item.accent ? 'mt-0' : ''}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
