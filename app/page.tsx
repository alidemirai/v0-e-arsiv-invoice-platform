'use client'

import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  FileText,
  Camera,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  LogIn,
  LogOut,
  Cloud,
  CloudOff,
  RefreshCw,
  History,
  Eye,
  ChevronRight,
  Upload,
  ImagePlus,
  Settings,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { GIBLoginModal } from '@/components/gib-login-modal'
import { ExpenseCameraScanner } from '@/components/expense-camera-scanner'
import { getGIBSession, logoutGIB } from '@/app/actions/gib-auth'
import { fetchInvoicesFromGIB, fetchCustomersFromGIB, fetchExpensesFromGIB, fetchFinancialReportsFromGIB } from '@/app/actions/gib-data'

type View = 'dashboard' | 'invoices' | 'expenses' | 'details'

interface Invoice {
  id: string
  invoiceNo: string
  date: string
  amount: number
  customer: string
  status: 'pending' | 'approved' | 'rejected'
  source?: 'local' | 'gib'
}

interface Expense {
  id: string
  date: string
  amount: number
  category: string
  description: string
  imageUrl?: string
}

export default function ModernEInvoiceApp() {
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [showGIBLogin, setShowGIBLogin] = useState(false)
  const [gibConnected, setGibConnected] = useState(false)
  const [isSyncingGIB, setIsSyncingGIB] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showCameraScanner, setShowCameraScanner] = useState(false)

  // Mock data
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: '1',
      invoiceNo: 'INV-2024-001',
      date: '2024-02-01',
      amount: 5250.00,
      customer: 'Acme Corporation',
      status: 'approved'
    },
    {
      id: '2',
      invoiceNo: 'INV-2024-002',
      date: '2024-02-05',
      amount: 3750.50,
      customer: 'Tech Solutions Ltd',
      status: 'approved'
    },
    {
      id: '3',
      invoiceNo: 'INV-2024-003',
      date: '2024-02-10',
      amount: 8900.00,
      customer: 'Global Enterprises',
      status: 'pending'
    },
  ])

  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      date: '2024-02-01',
      amount: 450.00,
      category: 'Ulaştırma',
      description: 'Ofis tedarik malzemeleri'
    },
    {
      id: '2',
      date: '2024-02-05',
      amount: 1200.00,
      category: 'Yazılım',
      description: 'Aylık yazılım aboneliği'
    },
  ])

  useEffect(() => {
    checkGIBConnection()
  }, [])

  const checkGIBConnection = async () => {
    const session = await getGIBSession()
    setGibConnected(!!session)
  }

  const handleGIBLoginSuccess = async () => {
    setShowGIBLogin(false)
    setGibConnected(true)
    await syncGIBData()
  }

  const handleGIBLogout = async () => {
    await logoutGIB()
    setGibConnected(false)
  }

  const syncGIBData = async () => {
    setIsSyncingGIB(true)
    try {
      const token = localStorage.getItem('gib-token')
      console.log('[v0] Syncing GIB data with token:', token?.substring(0, 10) + '...')
      
      if (!token) {
        throw new Error('GIB token bulunamadı')
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      console.log('[v0] Fetching from API routes...')
      const [invoicesRes, customersRes, expensesRes] = await Promise.all([
        fetch('/api/gib/invoices', { headers }),
        fetch('/api/gib/customers', { headers }),
        fetch('/api/gib/expenses', { headers })
      ])

      console.log('[v0] API responses received, parsing JSON...')
      const [invoicesResult, customersResult, expensesResult] = await Promise.all([
        invoicesRes.json(),
        customersRes.json(),
        expensesRes.json()
      ])

      console.log('[v0] Invoices result:', invoicesResult)

      // Merge GIB invoices with existing
      if (invoicesResult.success && invoicesResult.data) {
        const existingIds = new Set(invoices.map(inv => inv.id))
        const newInvoices = invoicesResult.data
          .filter((inv: any) => !existingIds.has(inv.id))
          .map((inv: any) => ({
            id: inv.id,
            invoiceNo: inv.invoiceNo,
            date: inv.date,
            amount: inv.amount,
            customer: inv.customer,
            status: inv.status || 'approved',
            source: 'gib' as const
          }))
        if (newInvoices.length > 0) {
          console.log('[v0] Adding', newInvoices.length, 'invoices to state')
          setInvoices(prev => [...newInvoices, ...prev])
        }
      }

      console.log('[v0] Expenses result:', expensesResult)
      // Merge GIB expenses with existing
      if (expensesResult.success && expensesResult.data) {
        const existingExpenseIds = new Set(expenses.map(exp => exp.id))
        const newExpenses = expensesResult.data
          .filter((exp: any) => !existingExpenseIds.has(exp.id))
          .map((exp: any) => ({
            id: exp.id,
            description: exp.description,
            amount: exp.amount,
            date: exp.date,
            category: exp.category,
            imageUrl: ''
          }))
        if (newExpenses.length > 0) {
          setExpenses(prev => [...newExpenses, ...prev])
        }
      }

    } catch (error) {
      console.error('[v0] GIB sync error:', error)
    } finally {
      console.log('[v0] GIB sync completed')
      setIsSyncingGIB(false)
    }
  }

  const handleExpenseScanned = (data: {
    amount: number
    description: string
    category: string
    date: string
    imageUrl: string
  }) => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      ...data,
    }
    setExpenses([newExpense, ...expenses])
    setShowCameraScanner(false)
  }

  // Calculations
  const totalIncome = invoices
    .filter(inv => inv.status === 'approved')
    .reduce((sum, inv) => sum + inv.amount, 0)

  const pendingAmount = invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + inv.amount, 0)

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)

  const filteredInvoices = invoices.filter(
    inv => inv.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">e-Arşiv</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="border-t border-border px-4 py-3 space-y-2">
            <button
              onClick={() => {
                setCurrentView('dashboard')
                setMobileMenuOpen(false)
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-sm',
                currentView === 'dashboard'
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted'
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              Kontrol Paneli
            </button>
            <button
              onClick={() => {
                setCurrentView('invoices')
                setMobileMenuOpen(false)
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-sm',
                currentView === 'invoices'
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted'
              )}
            >
              <FileText className="h-4 w-4" />
              Faturalar
            </button>
            <button
              onClick={() => {
                setCurrentView('expenses')
                setMobileMenuOpen(false)
              }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-sm',
                currentView === 'expenses'
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted'
              )}
            >
              <Camera className="h-4 w-4" />
              Gider Tarayıcı
            </button>
          </nav>
        )}
      </header>

      <div className="flex gap-0 lg:gap-4 lg:p-4 min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 fixed left-0 top-0 h-screen border-r border-border bg-card/50 backdrop-blur p-4">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">e-Arşiv</span>
          </div>

          <nav className="space-y-2 flex-1">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium',
                currentView === 'dashboard'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'hover:bg-muted'
              )}
            >
              <LayoutDashboard className="h-5 w-5" />
              Kontrol Paneli
            </button>
            <button
              onClick={() => setCurrentView('invoices')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium',
                currentView === 'invoices'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'hover:bg-muted'
              )}
            >
              <FileText className="h-5 w-5" />
              Faturalar
            </button>
            <button
              onClick={() => setCurrentView('expenses')}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium',
                currentView === 'expenses'
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'hover:bg-muted'
              )}
            >
              <Camera className="h-5 w-5" />
              Gider Tarayıcı
            </button>
          </nav>

          {/* GIB Connection Status */}
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center gap-2 px-3">
              {gibConnected ? (
                <Cloud className="h-4 w-4 text-green-500" />
              ) : (
                <CloudOff className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-xs font-medium text-muted-foreground">
                {gibConnected ? 'GİB Bağlı' : 'GİB Bağlı Değil'}
              </span>
            </div>
            {gibConnected ? (
              <>
                <Button
                  onClick={syncGIBData}
                  disabled={isSyncingGIB}
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                >
                  {isSyncingGIB ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Senkronize ediliyor...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Güncelle
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleGIBLogout}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Çıkış Yap
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setShowGIBLogin(true)}
                className="w-full"
              >
                <LogIn className="mr-2 h-4 w-4" />
                GİB Giriş
              </Button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full lg:ml-64">
          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <div className="space-y-4 p-4 lg:p-6">
              <div className="space-y-2">
                <h1 className="text-2xl lg:text-3xl font-bold">Kontrol Paneli</h1>
                <p className="text-muted-foreground">Finansal özeti ve son aktiviteleri görüntüleyin</p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border/50 bg-card/50 backdrop-blur">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Toplam Gelir</p>
                        <p className="text-2xl font-bold">{totalIncome.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                      </div>
                      <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Beklemede</p>
                        <p className="text-2xl font-bold">{pendingAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                      </div>
                      <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-yellow-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Gider Toplamı</p>
                        <p className="text-2xl font-bold">{totalExpenses.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                      </div>
                      <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50 backdrop-blur">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Fatura Sayısı</p>
                        <p className="text-2xl font-bold">{invoices.length}</p>
                      </div>
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Invoices */}
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Son Faturalar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {invoices.slice(0, 3).map(invoice => (
                      <div
                        key={invoice.id}
                        onClick={() => {
                          setSelectedInvoice(invoice)
                          setCurrentView('details')
                        }}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-border/30"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{invoice.customer}</p>
                          <p className="text-xs text-muted-foreground">{invoice.invoiceNo}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">{invoice.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                          <p className={cn(
                            'text-xs font-medium',
                            invoice.status === 'approved' ? 'text-green-500' :
                            invoice.status === 'pending' ? 'text-yellow-500' :
                            'text-red-500'
                          )}>
                            {invoice.status === 'approved' ? 'Onaylandı' :
                             invoice.status === 'pending' ? 'Beklemede' :
                             'Reddedildi'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Invoices View */}
          {currentView === 'invoices' && (
            <div className="space-y-4 p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold">Faturalar</h1>
                  <p className="text-muted-foreground text-sm">Tüm kestiğiniz faturalar</p>
                </div>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Fatura
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Fatura veya müşteri ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Invoices List */}
              <div className="grid grid-cols-1 gap-3">
                {filteredInvoices.map(invoice => (
                  <div
                    key={invoice.id}
                    onClick={() => {
                      setSelectedInvoice(invoice)
                      setCurrentView('details')
                    }}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 cursor-pointer transition-all hover:border-primary/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{invoice.customer}</p>
                            {invoice.source === 'gib' && (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-500">
                                GİB
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{invoice.invoiceNo}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{invoice.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                      <p className={cn(
                        'text-xs font-medium mt-1',
                        invoice.status === 'approved' ? 'text-green-500' :
                        invoice.status === 'pending' ? 'text-yellow-500' :
                        'text-red-500'
                      )}>
                        {invoice.status === 'approved' ? 'Onaylandı' :
                         invoice.status === 'pending' ? 'Beklemede' :
                         'Reddedildi'}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground ml-2" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expenses View */}
          {currentView === 'expenses' && (
            <div className="space-y-4 p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold">Gider Tarayıcı</h1>
                  <p className="text-muted-foreground text-sm">Kamerası ile gider belgelerini tarayın</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    onClick={() => setShowCameraScanner(true)}
                    variant="outline" 
                    className="flex-1 sm:flex-none bg-transparent"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Kamera
                  </Button>
                  <Button 
                    onClick={() => setShowCameraScanner(true)}
                    variant="outline" 
                    className="flex-1 sm:flex-none bg-transparent"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Dosya
                  </Button>
                </div>
              </div>

              {/* Camera Scanning Area */}
              <Card className="border-2 border-dashed border-primary/50 bg-primary/5">
                <CardContent className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <ImagePlus className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-semibold mb-2 text-center">Fotoğraf yükleyin veya kamerayı kullanın</p>
                  <p className="text-sm text-muted-foreground text-center">Sistem otomatik olarak gideri tanıyacak ve kaydetecek</p>
                </CardContent>
              </Card>

              {/* Recent Expenses */}
              <div>
                <h3 className="font-semibold mb-3">Son Giderler</h3>
                <div className="space-y-2">
                  {expenses.map(expense => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card/50"
                    >
                      <div>
                        <p className="font-medium text-sm">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">{new Date(expense.date).toLocaleDateString('tr-TR')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{expense.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                        <p className="text-xs text-primary">{expense.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Invoice Details View */}
          {currentView === 'details' && selectedInvoice && (
            <div className="space-y-4 p-4 lg:p-6">
              <button
                onClick={() => setCurrentView('invoices')}
                className="flex items-center gap-2 text-primary hover:underline mb-4"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                Geri
              </button>

              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle>{selectedInvoice.customer}</CardTitle>
                  <CardDescription>{selectedInvoice.invoiceNo}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Fatura Tarihi</p>
                      <p className="font-semibold">{new Date(selectedInvoice.date).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Durumu</p>
                      <p className={cn(
                        'font-semibold',
                        selectedInvoice.status === 'approved' ? 'text-green-500' :
                        selectedInvoice.status === 'pending' ? 'text-yellow-500' :
                        'text-red-500'
                      )}>
                        {selectedInvoice.status === 'approved' ? 'Onaylandı' :
                         selectedInvoice.status === 'pending' ? 'Beklemede' :
                         'Reddedildi'}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground mb-1">Tutar</p>
                    <p className="text-3xl font-bold text-primary">{selectedInvoice.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* GIB Login Modal */}
      {showGIBLogin && (
        <GIBLoginModal
          onSuccess={handleGIBLoginSuccess}
          onCancel={() => setShowGIBLogin(false)}
        />
      )}

      {/* Camera Scanner Modal */}
      {showCameraScanner && (
        <ExpenseCameraScanner
          onScan={handleExpenseScanned}
          onClose={() => setShowCameraScanner(false)}
        />
      )}
    </div>
  )
}
