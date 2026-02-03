'use client'

import { useState, useEffect, useMemo } from 'react'
import { BarChart3, FileText, Plus, LogOut, Settings, User, ChevronRight, Calendar, RefreshCw, FileCheck, AlertCircle, Receipt, Home, Users, PieChart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { MonthlyChart } from '@/components/dashboard/monthly-chart'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { InvoiceForm } from '@/components/invoice/invoice-form'
import { TemplateManager } from '@/components/invoice/template-manager'
import { CustomerManager } from '@/components/customer/customer-manager'
import { ExpenseManager } from '@/components/expense/expense-manager'
import { AIReceiptScanner } from '@/components/expense/ai-receipt-scanner'
import { MonthlyReportView } from '@/components/reports/monthly-report'
import { calculateDashboardStats, saveManualExpense, generateId, getManualExpenses, saveCustomer, updateCustomerStats, getCustomers } from '@/lib/store'
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
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [gibExpenses, setGibExpenses] = useState<Expense[]>([])
  const [manualExpenses, setManualExpenses] = useState<Expense[]>([])
  const [showReceiptScanner, setShowReceiptScanner] = useState(false)

  const allExpenses = useMemo(() => [...gibExpenses, ...manualExpenses], [gibExpenses, manualExpenses])
  const stats = useMemo<DashboardStats>(() => calculateDashboardStats(invoices as any, allExpenses), [invoices, allExpenses])

  useEffect(() => { 
    checkSession()
    loadLocalData()
  }, [])

  const loadLocalData = () => {
    setManualExpenses(getManualExpenses())
  }

  const checkSession = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('gib-token') : null
      const savedUsername = typeof window !== 'undefined' ? localStorage.getItem('gib-username') : null
      
      if (token && savedUsername) {
        setIsLoggedIn(true)
        setUsername(savedUsername)
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
        body: JSON.stringify({ 
          username: loginForm.username, 
          password: loginForm.password
        })
      })
      
      const data = await res.json()
      
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
      
      if (!token) {
        loadLocalData()
        return
      }

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

      if (invoicesData.data && Array.isArray(invoicesData.data)) {
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

      if (expensesData.data && Array.isArray(expensesData.data)) {
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

      loadLocalData()
    } catch (e) { 
      console.error('Veri cekme hatasi:', e) 
    } finally { 
      setIsLoading(false) 
    }
  }

  const handleInvoiceSubmit = async (data: any) => {
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

  const navItems = [
    { id: 'home', icon: Home, label: 'Dashboard' },
    { id: 'invoices', icon: FileText, label: 'Faturalar' },
    { id: 'create', icon: Plus, label: 'Fatura Kes' },
    { id: 'customers', icon: Users, label: 'Musteriler' },
    { id: 'expenses', icon: Receipt, label: 'Giderler' },
    { id: 'reports', icon: PieChart, label: 'Raporlar' },
    { id: 'settings', icon: Settings, label: 'Ayarlar' },
  ]

  const mobileNavItems = [
    { id: 'home', icon: Home, label: 'Anasayfa' },
    { id: 'invoices', icon: FileText, label: 'Faturalar' },
    { id: 'create', icon: Plus, label: 'Olustur', accent: true },
    { id: 'expenses', icon: Receipt, label: 'Giderler' },
    { id: 'settings', icon: Settings, label: 'Menu' },
  ]

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-primary flex">
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

        <div className="flex-1 flex flex-col bg-background lg:rounded-l-3xl">
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
                      placeholder="27421877"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      className="h-12 text-base border-2 focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Sifre</label>
                    <Input
                      type="password"
                      placeholder="Sifreniz"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="h-12 text-base border-2 focus:border-accent"
                    />
                  </div>

                  {error && (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full h-12 text-base font-semibold rounded-xl"
                  >
                    {isLoading ? 'Kontrol ediliyor...' : 'Giris Yap'}
                  </Button>
                </CardContent>
              </Card>

              <div className="text-center text-xs text-muted-foreground mt-6">
                <p>Sifrenizi unuttu musunuz? <a href="https://ivergi.gib.gov.tr" target="_blank" className="text-accent font-medium">yd.gib.gov.tr</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row h-screen">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 bg-card border-r border-border">
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-border flex items-center gap-3">
              <Logo />
              <div>
                <h1 className="text-lg font-bold text-primary">e-Fatura Pro</h1>
                <p className="text-xs text-muted-foreground">{username}</p>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {navItems.map(item => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as Tab)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                )
              })}
            </nav>

            <div className="p-4 border-t border-border">
              <Button 
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Cikis Yap
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="bg-card border-b border-border p-4 flex items-center justify-between lg:hidden">
            <Logo />
            <h1 className="flex-1 ml-4 font-bold text-primary">e-Fatura Pro</h1>
            <Button onClick={handleLogout} variant="ghost" size="sm">
              <LogOut className="w-5 h-5" />
            </Button>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 lg:p-8">
              {activeTab === 'home' && (
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
                  <StatsCards stats={stats} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MonthlyChart invoices={invoices} />
                    <RecentActivity invoices={invoices} expenses={allExpenses} />
                  </div>
                </div>
              )}

              {activeTab === 'invoices' && (
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-6">Faturalar</h2>
                  <div className="bg-card rounded-lg overflow-hidden">
                    {invoices.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Henuz fatura bulunmamaktadir</p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Fatura No</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Tarih</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Musteri</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Tutar</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Durum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map(inv => (
                            <tr key={inv.id} className="border-b border-border hover:bg-muted/50">
                              <td className="px-6 py-4 text-sm font-medium">{inv.invoiceNo}</td>
                              <td className="px-6 py-4 text-sm">{inv.date}</td>
                              <td className="px-6 py-4 text-sm">{inv.customer}</td>
                              <td className="px-6 py-4 text-sm font-semibold text-right">{inv.amount.toFixed(2)} TL</td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  inv.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {inv.status === 'approved' ? 'Onayli' : 'Taslak'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'create' && <InvoiceForm onSubmit={handleInvoiceSubmit} />}
              {activeTab === 'customers' && <CustomerManager />}
              {activeTab === 'expenses' && <ExpenseManager onScanReceipt={() => setShowReceiptScanner(true)} />}
              {activeTab === 'reports' && <MonthlyReportView invoices={invoices} expenses={allExpenses} />}
              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-6">Ayarlar</h2>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground">Ayarlar sayfasi yapimda</p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showReceiptScanner && (
        <AIReceiptScanner 
          onScanComplete={handleReceiptScan}
          onClose={() => setShowReceiptScanner(false)}
        />
      )}
    </div>
  )
}
