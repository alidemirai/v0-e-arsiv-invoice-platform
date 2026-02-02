'use client'

import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Camera,
  User,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  LogIn,
  LogOut,
  ChevronRight,
  Calendar,
  Building2,
  CreditCard,
  Scan,
  Upload,
  X,
  Check,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type TabType = 'dashboard' | 'invoices' | 'expenses' | 'scan' | 'account'

interface Invoice {
  id: string
  invoiceNo: string
  date: string
  amount: number
  customer: string
  vkn?: string
  status: 'pending' | 'approved' | 'rejected'
  source: 'gib' | 'local'
}

interface Expense {
  id: string
  date: string
  amount: number
  category: string
  description: string
  supplier?: string
  vkn?: string
  imageUrl?: string
  source?: 'gib' | 'local'
}

export default function EArsivApp() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [isConnected, setIsConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
    environment: 'production' as 'test' | 'production'
  })

  // Check session on mount
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const res = await fetch('/api/gib/invoices')
      if (res.ok) {
        setIsConnected(true)
        syncData()
      }
    } catch {
      setIsConnected(false)
    }
  }

  const handleLogin = async () => {
    setLoginLoading(true)
    setLoginError(null)

    try {
      const res = await fetch('/api/gib/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })

      const data = await res.json()

      if (data.success) {
        setIsConnected(true)
        setUserInfo(data.userInfo)
        setShowLogin(false)
        syncData()
      } else {
        setLoginError(data.error || 'Giris basarisiz')
      }
    } catch (err) {
      setLoginError('Baglanti hatasi')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/gib/logout', { method: 'POST' })
    } catch {}
    setIsConnected(false)
    setInvoices([])
    setExpenses([])
    setUserInfo(null)
  }

  const syncData = async () => {
    if (!isConnected) return
    setIsSyncing(true)

    try {
      const [invoicesRes, expensesRes] = await Promise.all([
        fetch('/api/gib/invoices'),
        fetch('/api/gib/expenses')
      ])

      const [invoicesData, expensesData] = await Promise.all([
        invoicesRes.json(),
        expensesRes.json()
      ])

      if (invoicesData.success && invoicesData.data) {
        setInvoices(invoicesData.data)
      }

      if (expensesData.success && expensesData.data) {
        setExpenses(expensesData.data)
      }
    } catch (err) {
      console.error('Sync error:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  // Calculate stats
  const totalIncome = invoices
    .filter(i => i.status === 'approved')
    .reduce((sum, i) => sum + i.amount, 0)
  
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const netProfit = totalIncome - totalExpenses
  const pendingCount = invoices.filter(i => i.status === 'pending').length

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    try {
      if (dateStr.includes('/')) return dateStr
      return new Date(dateStr).toLocaleDateString('tr-TR')
    } catch {
      return dateStr
    }
  }

  // Render different views based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-4 pb-24">
            {/* Connection Status */}
            <div className={cn(
              "flex items-center justify-between p-4 rounded-2xl",
              isConnected ? "bg-green-500/10" : "bg-amber-500/10"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-3 h-3 rounded-full animate-pulse",
                  isConnected ? "bg-green-500" : "bg-amber-500"
                )} />
                <span className={cn(
                  "text-sm font-medium",
                  isConnected ? "text-green-500" : "text-amber-500"
                )}>
                  {isConnected ? 'GIB Bagli' : 'Bagli Degil'}
                </span>
              </div>
              {isConnected ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={syncData}
                  disabled={isSyncing}
                  className="text-green-500"
                >
                  <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setShowLogin(true)}
                  className="bg-primary text-primary-foreground"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Giris Yap
                </Button>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-xs">Toplam Gelir</span>
                  </div>
                  <p className="text-xl font-bold text-green-500">
                    {formatCurrency(totalIncome)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-xs">Toplam Gider</span>
                  </div>
                  <p className="text-xl font-bold text-red-500">
                    {formatCurrency(totalExpenses)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <span className="text-xs">Net Kar</span>
                  </div>
                  <p className={cn(
                    "text-xl font-bold",
                    netProfit >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {formatCurrency(netProfit)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <FileText className="h-4 w-4 text-amber-500" />
                    <span className="text-xs">Bekleyen</span>
                  </div>
                  <p className="text-xl font-bold text-amber-500">
                    {pendingCount} Fatura
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Invoices */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Son Faturalar</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setActiveTab('invoices')}
                  className="text-primary"
                >
                  Tumunu Gor
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {invoices.slice(0, 5).map((invoice) => (
                  <Card 
                    key={invoice.id}
                    className="bg-card/50 border-border/50 cursor-pointer hover:bg-card/80 transition-colors"
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{invoice.customer}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{invoice.invoiceNo}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{formatDate(invoice.date)}</span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-semibold text-green-500">{formatCurrency(invoice.amount)}</p>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            invoice.status === 'approved' ? "bg-green-500/20 text-green-500" :
                            invoice.status === 'pending' ? "bg-amber-500/20 text-amber-500" :
                            "bg-red-500/20 text-red-500"
                          )}>
                            {invoice.status === 'approved' ? 'Onaylandi' :
                             invoice.status === 'pending' ? 'Bekliyor' : 'Reddedildi'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {invoices.length === 0 && (
                  <Card className="bg-card/50 border-border/50">
                    <CardContent className="p-8 text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">
                        {isConnected ? 'Fatura bulunamadi' : 'GIB\'e baglanin'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )

      case 'invoices':
        return (
          <div className="space-y-4 pb-24">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">Faturalarim</h1>
              <span className="text-sm text-muted-foreground">{invoices.length} fatura</span>
            </div>

            <div className="space-y-2">
              {invoices.map((invoice) => (
                <Card 
                  key={invoice.id}
                  className="bg-card/50 border-border/50 cursor-pointer hover:bg-card/80 transition-colors"
                  onClick={() => setSelectedInvoice(invoice)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{invoice.customer}</p>
                          {invoice.source === 'gib' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">GIB</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{formatDate(invoice.date)}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{invoice.invoiceNo}</span>
                        </div>
                        {invoice.vkn && (
                          <div className="flex items-center gap-2 mt-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">VKN: {invoice.vkn}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-green-500">{formatCurrency(invoice.amount)}</p>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full mt-1 inline-block",
                          invoice.status === 'approved' ? "bg-green-500/20 text-green-500" :
                          invoice.status === 'pending' ? "bg-amber-500/20 text-amber-500" :
                          "bg-red-500/20 text-red-500"
                        )}>
                          {invoice.status === 'approved' ? 'Onaylandi' :
                           invoice.status === 'pending' ? 'Bekliyor' : 'Reddedildi'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {invoices.length === 0 && (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-12 text-center">
                    <FileText className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">Fatura Bulunamadi</p>
                    <p className="text-sm text-muted-foreground/70">
                      {isConnected ? 'Son 3 ayda fatura yok' : 'GIB\'e baglanarak faturalarinizi gorun'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )

      case 'expenses':
        return (
          <div className="space-y-4 pb-24">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">Giderlerim</h1>
              <span className="text-sm text-muted-foreground">{expenses.length} gider</span>
            </div>

            <div className="space-y-2">
              {expenses.map((expense) => (
                <Card 
                  key={expense.id}
                  className="bg-card/50 border-border/50"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{expense.description}</p>
                          {expense.source === 'gib' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">GIB</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{formatDate(expense.date)}</span>
                          {expense.supplier && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{expense.supplier}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-red-500">-{formatCurrency(expense.amount)}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {expense.category}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {expenses.length === 0 && (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-12 text-center">
                    <Receipt className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">Gider Bulunamadi</p>
                    <p className="text-sm text-muted-foreground/70">
                      Gider eklemek icin Tara sekmesini kullanin
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )

      case 'scan':
        return (
          <div className="space-y-6 pb-24">
            <h1 className="text-xl font-bold">Belge Tara</h1>
            
            <div className="grid grid-cols-2 gap-4">
              <Card 
                className="bg-card/50 border-border/50 cursor-pointer hover:bg-card/80 transition-all hover:scale-[1.02]"
                onClick={() => {
                  // Trigger camera
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/*'
                  input.capture = 'environment'
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                      // Process the image
                      const newExpense: Expense = {
                        id: Date.now().toString(),
                        date: new Date().toLocaleDateString('tr-TR'),
                        amount: 0,
                        category: 'Diger',
                        description: 'Taranan belge',
                        source: 'local'
                      }
                      setExpenses([newExpense, ...expenses])
                      setActiveTab('expenses')
                    }
                  }
                  input.click()
                }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-semibold">Kamera</p>
                  <p className="text-xs text-muted-foreground mt-1">Fiş veya fatura çek</p>
                </CardContent>
              </Card>

              <Card 
                className="bg-card/50 border-border/50 cursor-pointer hover:bg-card/80 transition-all hover:scale-[1.02]"
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/*,application/pdf'
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                      const newExpense: Expense = {
                        id: Date.now().toString(),
                        date: new Date().toLocaleDateString('tr-TR'),
                        amount: 0,
                        category: 'Diger',
                        description: file.name,
                        source: 'local'
                      }
                      setExpenses([newExpense, ...expenses])
                      setActiveTab('expenses')
                    }
                  }
                  input.click()
                }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="font-semibold">Dosya Yukle</p>
                  <p className="text-xs text-muted-foreground mt-1">Galeriden seç</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Scan className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-semibold">Otomatik Tanima</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Yuklediginiz belgeler otomatik olarak taranir ve gider olarak kaydedilir.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'account':
        return (
          <div className="space-y-4 pb-24">
            <h1 className="text-xl font-bold">Hesabim</h1>

            {isConnected ? (
              <>
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <User className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{userInfo?.unvan || 'GIB Kullanicisi'}</p>
                        <p className="text-sm text-muted-foreground">{userInfo?.vkn || loginForm.vkn}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/50 border-border/50">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground">Baglanti Durumu</span>
                      <span className="text-green-500 font-medium">Aktif</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground">Toplam Fatura</span>
                      <span className="font-medium">{invoices.length}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground">Toplam Gider</span>
                      <span className="font-medium">{expenses.length}</span>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full bg-transparent border-red-500/50 text-red-500 hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cikis Yap
                </Button>
              </>
            ) : (
              <Card className="bg-card/50 border-border/50">
                <CardContent className="p-8 text-center">
                  <User className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-medium text-muted-foreground mb-4">GIB Hesabiniza Baglanin</p>
                  <Button onClick={() => setShowLogin(true)} className="w-full">
                    <LogIn className="h-4 w-4 mr-2" />
                    Giris Yap
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">e-Arsiv</h1>
              <p className="text-xs text-muted-foreground">GIB Fatura Yonetimi</p>
            </div>
            {isConnected && (
              <Button
                size="sm"
                variant="ghost"
                onClick={syncData}
                disabled={isSyncing}
              >
                <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4">
        {renderContent()}
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 z-50">
        <div className="flex items-center justify-around py-2 pb-safe">
          {[
            { id: 'dashboard' as TabType, icon: LayoutDashboard, label: 'Ana Sayfa' },
            { id: 'invoices' as TabType, icon: FileText, label: 'Faturalar' },
            { id: 'scan' as TabType, icon: Camera, label: 'Tara' },
            { id: 'expenses' as TabType, icon: Receipt, label: 'Giderler' },
            { id: 'account' as TabType, icon: User, label: 'Hesap' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all",
                activeTab === tab.id 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className={cn(
                "h-5 w-5 transition-transform",
                activeTab === tab.id && "scale-110"
              )} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center">
          <div className="w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">GIB Giris</h2>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowLogin(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Kullanici Kodu</label>
                <Input
                  placeholder="GIB kullanici kodunuz"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="bg-muted/50"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Sifre</label>
                <Input
                  type="password"
                  placeholder="GIB sifreniz"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="bg-muted/50"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Ortam</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={loginForm.environment === 'production' ? 'default' : 'outline'}
                    onClick={() => setLoginForm({ ...loginForm, environment: 'production' })}
                    className={cn(
                      "flex-1",
                      loginForm.environment !== 'production' && "bg-transparent"
                    )}
                  >
                    Gercek
                  </Button>
                  <Button
                    type="button"
                    variant={loginForm.environment === 'test' ? 'default' : 'outline'}
                    onClick={() => setLoginForm({ ...loginForm, environment: 'test' })}
                    className={cn(
                      "flex-1",
                      loginForm.environment !== 'test' && "bg-transparent"
                    )}
                  >
                    Test
                  </Button>
                </div>
              </div>

              {loginError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{loginError}</span>
                </div>
              )}

              <Button
                onClick={handleLogin}
                disabled={loginLoading || !loginForm.vkn || !loginForm.username || !loginForm.password}
                className="w-full"
              >
                {loginLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <LogIn className="h-4 w-4 mr-2" />
                )}
                {loginLoading ? 'Baglaniyor...' : 'Giris Yap'}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                GIB e-Arsiv Portal bilgilerinizi girin
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center">
          <div className="w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Fatura Detayi</h2>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedInvoice(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground">Musteri</p>
                <p className="font-semibold text-lg">{selectedInvoice.customer}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground">Fatura No</p>
                  <p className="font-medium">{selectedInvoice.invoiceNo}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground">Tarih</p>
                  <p className="font-medium">{formatDate(selectedInvoice.date)}</p>
                </div>
              </div>

              {selectedInvoice.vkn && (
                <div className="p-4 rounded-xl bg-muted/50">
                  <p className="text-sm text-muted-foreground">VKN/TCKN</p>
                  <p className="font-medium">{selectedInvoice.vkn}</p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-green-500/10">
                <p className="text-sm text-green-500/70">Tutar</p>
                <p className="font-bold text-2xl text-green-500">{formatCurrency(selectedInvoice.amount)}</p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                <span className="text-muted-foreground">Durum</span>
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  selectedInvoice.status === 'approved' ? "bg-green-500/20 text-green-500" :
                  selectedInvoice.status === 'pending' ? "bg-amber-500/20 text-amber-500" :
                  "bg-red-500/20 text-red-500"
                )}>
                  {selectedInvoice.status === 'approved' ? 'Onaylandi' :
                   selectedInvoice.status === 'pending' ? 'Bekliyor' : 'Reddedildi'}
                </span>
              </div>

              {selectedInvoice.source === 'gib' && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm text-primary">GIB'den senkronize edildi</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
