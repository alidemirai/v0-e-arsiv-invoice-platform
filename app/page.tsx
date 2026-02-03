'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  BarChart3, FileText, Plus, Menu, LogOut, Settings, 
  User, ChevronRight, Calendar, RefreshCw, FileCheck, 
  AlertCircle, Receipt, Home, Users, PieChart, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

// Dashboard Components
import { StatsCards } from '@/components/dashboard/stats-cards'
import { MonthlyChart } from '@/components/dashboard/monthly-chart'
import { RecentActivity } from '@/components/dashboard/recent-activity'

// Invoice Components
import { InvoiceForm } from '@/components/invoice/invoice-form'
import { TemplateManager } from '@/components/invoice/template-manager'

// Customer Components
import { CustomerManager } from '@/components/customer/customer-manager'

// Expense Components
import { ExpenseManager } from '@/components/expense/expense-manager'
import { AIReceiptScanner } from '@/components/expense/ai-receipt-scanner'

// Report Components
import { MonthlyReportView } from '@/components/reports/monthly-report'

// Store & Types
import { 
  calculateDashboardStats, 
  saveManualExpense, 
  generateId, 
  getManualExpenses,
  saveCustomer,
  updateCustomerStats,
  getCustomers
} from '@/lib/store'
import type { DashboardStats, Expense, Customer } from '@/lib/types'

type Tab = 'home' | 'invoices' | 'create' | 'customers' | 'expenses' | 'reports' | 'settings'

interface Invoice {
  id: string
  invoiceNo: string
  date: string
  customer: string
  customerId?: string
  amount: number
  kdvAmount?: number
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
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  
  const [loginForm, setLoginForm] = useState({ 
    username: '', 
    password: ''
  })
  
  // Data States
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [gibExpenses, setGibExpenses] = useState<Expense[]>([])
  const [manualExpenses, setManualExpenses] = useState<Expense[]>([])
  
  // UI States
  const [showReceiptScanner, setShowReceiptScanner] = useState(false)

  // Combined expenses
  const allExpenses = useMemo(() => {
    return [...gibExpenses, ...manualExpenses]
  }, [gibExpenses, manualExpenses])

  // Dashboard Stats
  const stats = useMemo<DashboardStats>(() => {
    return calculateDashboardStats(invoices as any, allExpenses)
  }, [invoices, allExpenses])

  useEffect(() => { 
    checkSession()
    loadLocalData()
  }, [])

  const loadLocalData = () => {
    setManualExpenses(getManualExpenses())
  }

  const checkSession = async () => {
    try {
      // Check if token exists in localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('gib-token') : null
      const savedUsername = typeof window !== 'undefined' ? localStorage.getItem('gib-username') : null
      const proxyUrl = typeof window !== 'undefined' ? localStorage.getItem('gib-proxy-url') : null
      
      if (token && proxyUrl) {
        setIsLoggedIn(true)
        setUsername(savedUsername || '')
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
      console.log('[v0] Login attempt:', loginForm.username)
      
      // Vercel API'sine giriş yap (proxy yok!)
      const res = await fetch('/api/gib/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: loginForm.username, 
          password: loginForm.password
        })
      })
      
      console.log('[v0] Login response status:', res.status)
      const data = await res.json()
      console.log('[v0] Login response:', data)
      
      if (data.success && data.token) {
        localStorage.setItem('gib-token', data.token)
        localStorage.setItem('gib-username', loginForm.username)
        setIsLoggedIn(true)
        setUsername(loginForm.username)
        setActiveTab('home')
        setTimeout(() => fetchData(), 500)
      } else {
        setError(data.error || 'Giris basarisiz')
      }
    } catch (e) {
      console.error('[v0] Login error:', e)
      setError('Giriş başarısız. Lütfen tekrar deneyin.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gib-token')
      localStorage.removeItem('gib-username')
    }
    setIsLoggedIn(false)
    setUsername('')
    setInvoices([])
    setGibExpenses([])
    setActiveTab('home')
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('gib-token') : null
      
      console.log('[v0] FetchData - token exists:', !!token)

      if (!token) {
        console.log('[v0] Token eksik')
        loadLocalData()
        return
      }

      // Vercel API'sine istek at
      console.log('[v0] Fetching invoices and expenses from Vercel API...')
      const [invoicesRes, expensesRes] = await Promise.all([
        fetch('/api/gib/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        }),
        fetch('/api/gib/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
      ])

      const [invoicesData, expensesData] = await Promise.all([
        invoicesRes.json(), 
        expensesRes.json()
      ])

      console.log('[v0] Invoices response:', invoicesData)
      console.log('[v0] Expenses response:', expensesData)

      // Fatura verisi
      if (invoicesData.data && Array.isArray(invoicesData.data)) {
        console.log('[v0] Processing', invoicesData.data.length, 'invoices')
        const formattedInvoices = invoicesData.data.map((inv: any) => ({
          id: inv.ettn || inv.belgeNumarasi || generateId(),
          invoiceNo: inv.belgeNumarasi || '',
          date: inv.belgeTarihi || '',
          customer: inv.aliciUnvanAdSoyad || '',
          amount: parseFloat(inv.malHizmetToplamTutari) || 0,
          kdvAmount: parseFloat(inv.hesaplananKdv) || 0,
          status: 'approved' as const
        }))
        setInvoices(formattedInvoices)
      }

      // Gider verisi
      if (expensesData.data && Array.isArray(expensesData.data)) {
        console.log('[v0] Processing', expensesData.data.length, 'expenses')
        const formattedExpenses = expensesData.data.map((exp: any) => ({
          id: exp.ettn || generateId(),
          description: exp.saticiUnvanAdSoyad || 'Gider',
          amount: parseFloat(exp.malHizmetToplamTutari) || 0,
          category: 'diger' as const,
          date: exp.belgeTarihi || '',
          isManual: false,
          month: exp.belgeTarihi ? exp.belgeTarihi.substring(3, 10).split('/').reverse().join('-') : ''
        }))
        setGibExpenses(formattedExpenses)
      }

      console.log('[v0] Data fetch complete')
      loadLocalData()
    } catch (e) { 
      console.error('[v0] Veri cekme hatasi:', e) 
    } finally { 
      setIsLoading(false) 
    }
  }

      // Dogrudan proxy sunucusuna istek at
      console.log('[v0] Fetching invoices and expenses...')
      const [invoicesRes, expensesRes] = await Promise.all([
        fetch(`${proxyUrl}/api/gib/invoices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        }),
        fetch(`${proxyUrl}/api/gib/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })
      ])

      const [invoicesData, expensesData] = await Promise.all([
        invoicesRes.json(), 
        expensesRes.json()
      ])

      console.log('[v0] Invoices response:', invoicesData)
      console.log('[v0] Expenses response:', expensesData)

      // Fatura verisi
      if (invoicesData.data && Array.isArray(invoicesData.data)) {
        console.log('[v0] Processing', invoicesData.data.length, 'invoices')
        const formattedInvoices = invoicesData.data.map((inv: any) => ({
          id: inv.ettn || inv.belgeNumarasi || generateId(),
          invoiceNo: inv.belgeNumarasi || '',
          date: inv.belgeTarihi || '',
          customer: inv.aliciUnvanAdSoyad || '',
          amount: parseFloat(inv.malHizmetToplamTutari) || 0,
          kdvAmount: parseFloat(inv.hesaplananKdv) || 0,
          status: 'approved' as const
        }))
        setInvoices(formattedInvoices)
      }

      // Gider verisi
      if (expensesData.data && Array.isArray(expensesData.data)) {
        console.log('[v0] Processing', expensesData.data.length, 'expenses')
        const formattedExpenses = expensesData.data.map((exp: any) => ({
          id: exp.ettn || generateId(),
          description: exp.saticiUnvanAdSoyad || 'Gider',
          amount: parseFloat(exp.malHizmetToplamTutari) || 0,
          category: 'diger' as const,
          date: exp.belgeTarihi || '',
          isManual: false,
          month: exp.belgeTarihi ? exp.belgeTarihi.substring(3, 10).split('/').reverse().join('-') : ''
        }))
        setGibExpenses(formattedExpenses)
      }

      console.log('[v0] Data fetch complete')
      loadLocalData()
    } catch (e) { 
      console.error('[v0] Veri cekme hatasi:', e) 
    } finally { 
      setIsLoading(false) 
    }
  }

  const handleInvoiceSubmit = async (data: any) => {
    // In production, this would send to GIB API
    console.log('Invoice data:', data)
    
    // Create new invoice locally
    const newInvoice: Invoice = {
      id: generateId(),
      invoiceNo: `INV-${Date.now().toString().slice(-8)}`,
      date: data.invoiceDate,
      customer: data.customerName,
      customerId: data.customerId,
      amount: data.subtotal,
      kdvAmount: data.kdvAmount,
      status: 'draft'
    }
    
    setInvoices(prev => [newInvoice, ...prev])
    
    // Update customer stats if customer exists
    if (data.customerId) {
      updateCustomerStats(data.customerId, data.total)
    }
    
    setActiveTab('invoices')
  }

  const handleReceiptScan = (data: {
    amount: number
    kdvAmount: number
    description: string
    supplier: string
    category: any
    date: string
    imageUrl: string
  }) => {
    const expense: Expense = {
      id: generateId(),
      description: data.description,
      supplier: data.supplier,
      supplierVkn: '',
      amount: data.amount,
      kdvAmount: data.kdvAmount,
      totalAmount: data.amount + data.kdvAmount,
      category: data.category,
      date: data.date,
      month: `${new Date(data.date).getFullYear()}-${String(new Date(data.date).getMonth() + 1).padStart(2, '0')}`,
      receiptUrl: data.imageUrl,
      isManual: true,
      createdAt: new Date().toISOString()
    }
    
    saveManualExpense(expense)
    loadLocalData()
    setShowReceiptScanner(false)
  }

  // Navigation items
  const navItems = [
    { id: 'home', icon: Home, label: 'Dashboard' },
    { id: 'invoices', icon: FileText, label: 'Faturalar' },
    { id: 'create', icon: Plus, label: 'Fatura Kes' },
    { id: 'customers', icon: Users, label: 'Musteriler' },
    { id: 'expenses', icon: Receipt, label: 'Giderler' },
    { id: 'reports', icon: PieChart, label: 'Raporlar' },
    { id: 'settings', icon: Settings, label: 'Ayarlar' },
  ]

  // Mobile nav items (limited)
  const mobileNavItems = [
    { id: 'home', icon: Home, label: 'Anasayfa' },
    { id: 'invoices', icon: FileText, label: 'Faturalar' },
    { id: 'create', icon: Plus, label: 'Olustur', accent: true },
    { id: 'expenses', icon: Receipt, label: 'Giderler' },
    { id: 'settings', icon: Menu, label: 'Menu' },
  ]

  // LOGIN SCREEN
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
              Kisisel e-Arsiv Fatura ve On Muhasebe platformunuz. GIB entegrasyonlu, guvenli ve kolay.
            </p>
            <div className="mt-12 flex gap-8 justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-accent">%100</div>
                <div className="text-white/60 text-sm">GIB Uyumlu</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-accent">AI</div>
                <div className="text-white/60 text-sm">Fis Tarama</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-accent">1-Tik</div>
                <div className="text-white/60 text-sm">Muhasebeci</div>
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
                    <Input
                      placeholder="Ornek: 12345678"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      className="h-12 text-base border-2 focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Sifre</label>
                    <Input
                      type="password"
                      placeholder="Sifrenizi girin"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="h-12 text-base border-2 focus:border-accent"
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
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

                  <Button 
                    onClick={handleLogin} 
                    disabled={isLoading} 
                    className="w-full h-12 text-base bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <FileCheck className="w-5 h-5 mr-2" />
                    )}
                    Giris Yap
                  </Button>
                </CardContent>
              </Card>

              <p className="text-center text-muted-foreground text-sm mt-6">
                Sifrenizi mi unuttunuz?{' '}
                <a 
                  href="https://ivd.gib.gov.tr" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-accent hover:underline font-medium"
                >
                  ivd.gib.gov.tr
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // MAIN APP
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
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
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
          <Button 
            onClick={handleLogout} 
            variant="ghost" 
            className="w-full mt-2 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10"
          >
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
              {activeTab === 'home' && 'Dashboard'}
              {activeTab === 'invoices' && 'Faturalarim'}
              {activeTab === 'create' && 'Fatura Olustur'}
              {activeTab === 'customers' && 'Musterilerim'}
              {activeTab === 'expenses' && 'Giderlerim'}
              {activeTab === 'reports' && 'Raporlar'}
              {activeTab === 'settings' && 'Ayarlar'}
            </h1>
            <p className="text-muted-foreground text-sm">Hos geldiniz, {username}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchData} 
              disabled={isLoading} 
              className="bg-transparent"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="ml-2">Senkronize Et</span>
            </Button>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden bg-primary text-primary-foreground p-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="text-lg font-bold">e-Fatura Pro</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={fetchData} 
            disabled={isLoading} 
            className="text-primary-foreground"
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
          </Button>
        </header>

        <div className="p-4 lg:p-6">
          {/* HOME / DASHBOARD */}
          {activeTab === 'home' && (
            <div className="space-y-6">
              <StatsCards stats={stats} isLoading={isLoading} />
              
              <div className="grid lg:grid-cols-2 gap-6">
                <MonthlyChart invoices={invoices} expenses={allExpenses} />
                <RecentActivity 
                  invoices={invoices} 
                  expenses={allExpenses}
                  onViewAllInvoices={() => setActiveTab('invoices')}
                  onViewAllExpenses={() => setActiveTab('expenses')}
                />
              </div>

              {/* Quick Actions */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">Hizli Islemler</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => setActiveTab('create')}
                    >
                      <Plus className="w-6 h-6 text-accent" />
                      <span className="text-sm">Fatura Kes</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => setShowReceiptScanner(true)}
                    >
                      <Receipt className="w-6 h-6 text-destructive" />
                      <span className="text-sm">Fis Tara</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => setActiveTab('customers')}
                    >
                      <Users className="w-6 h-6 text-primary" />
                      <span className="text-sm">Musteri Ekle</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto py-4 flex-col gap-2"
                      onClick={() => setActiveTab('reports')}
                    >
                      <PieChart className="w-6 h-6 text-secondary" />
                      <span className="text-sm">Rapor Gor</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* INVOICES */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {invoices.length} fatura listeleniyor
                </p>
                <Button onClick={() => setActiveTab('create')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Fatura
                </Button>
              </div>

              {invoices.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-lg font-medium text-muted-foreground">Henuz fatura bulunmuyor</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Yeni fatura olusturmak icin "Fatura Olustur" sekmesine gidin.
                    </p>
                    <Button onClick={() => setActiveTab('create')} className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Ilk Faturani Olustur
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <Card 
                      key={invoice.id} 
                      className="hover:shadow-lg transition-all border-0 shadow-md cursor-pointer"
                    >
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
                            <p className="font-bold text-xl text-accent">
                              {invoice.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TRY
                            </p>
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                              invoice.status === 'approved' 
                                ? 'bg-green-100 text-green-700' 
                                : invoice.status === 'sent' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {invoice.status === 'approved' ? 'Onaylandi' : 
                               invoice.status === 'sent' ? 'Gonderildi' : 'Taslak'}
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

          {/* CREATE INVOICE */}
          {activeTab === 'create' && (
            <div className="max-w-4xl mx-auto">
              <InvoiceForm 
                onSubmit={handleInvoiceSubmit}
                onPreview={(data) => console.log('Preview:', data)}
              />
            </div>
          )}

          {/* CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="max-w-4xl mx-auto">
              <CustomerManager 
                onSelectCustomer={(customer) => {
                  // Navigate to create invoice with customer pre-filled
                  setActiveTab('create')
                }}
              />
            </div>
          )}

          {/* EXPENSES */}
          {activeTab === 'expenses' && (
            <ExpenseManager 
              gibExpenses={gibExpenses}
              onScanReceipt={() => setShowReceiptScanner(true)}
            />
          )}

          {/* REPORTS */}
          {activeTab === 'reports' && (
            <MonthlyReportView 
              invoices={invoices as any}
              expenses={allExpenses}
            />
          )}

          {/* SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Profile Card */}
              <div className="bg-primary rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 flex items-center gap-4 border-b border-sidebar-border">
                  <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                    <User className="w-8 h-8 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-xl text-primary-foreground">{username}</p>
                    <p className="text-primary-foreground/60 text-sm">GIB e-Arsiv Kullanicisi</p>
                  </div>
                </div>
              </div>

              {/* Template Manager */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Hizli Sablonlar</CardTitle>
                      <CardDescription>Fatura sablonlarinizi yonetin</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <TemplateManager />
                </CardContent>
              </Card>

              {/* Logout Button */}
              <button 
                onClick={handleLogout} 
                className="w-full h-14 rounded-xl bg-destructive/10 border-2 border-destructive/30 text-destructive font-medium flex items-center justify-center gap-2 hover:bg-destructive hover:text-white transition-all"
              >
                <LogOut className="w-5 h-5" />
                Cikis Yap
              </button>

              <p className="text-center text-muted-foreground text-sm py-4">
                e-Fatura Pro v2.0.0
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-50">
        <div className="flex">
          {mobileNavItems.map((item) => (
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

      {/* AI Receipt Scanner Modal */}
      {showReceiptScanner && (
        <AIReceiptScanner 
          onScan={handleReceiptScan}
          onClose={() => setShowReceiptScanner(false)}
        />
      )}
    </div>
  )
}
