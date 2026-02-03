'use client'

import { useState, useMemo } from 'react'
import { 
  Download, Share2, FileArchive, ExternalLink, Send, 
  ChevronLeft, ChevronRight, FileText, Receipt, TrendingUp,
  TrendingDown, Wallet, Calendar, Check, Copy, MessageCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, parseMonthDisplay, getCurrentMonth, getMonthlyReport } from '@/lib/store'
import { EXPENSE_CATEGORIES, TURKISH_MONTHS } from '@/lib/types'
import type { Expense, Invoice } from '@/lib/types'

interface MonthlyReportProps {
  invoices: Invoice[]
  expenses: Expense[]
}

export function MonthlyReportView({ invoices, expenses }: MonthlyReportProps) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [isSharing, setIsSharing] = useState(false)
  const [shareMethod, setShareMethod] = useState<'zip' | 'whatsapp' | 'copy' | null>(null)
  const [shareSuccess, setShareSuccess] = useState(false)

  // Generate available months
  const availableMonths = useMemo(() => {
    const months = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
    }
    return months
  }, [])

  // Filter data for selected month
  const monthData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number)
    
    const monthInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.date)
      return invDate.getFullYear() === year && invDate.getMonth() + 1 === month
    })
    
    const monthExpenses = expenses.filter(exp => {
      if (exp.month === selectedMonth) return true
      if (exp.date) {
        const expDate = new Date(exp.date)
        return expDate.getFullYear() === year && expDate.getMonth() + 1 === month
      }
      return false
    })

    const totalIncome = monthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    const totalKdvIncome = monthInvoices.reduce((sum, inv) => sum + (inv.kdvAmount || inv.amount * 0.2 || 0), 0)
    const totalExpense = monthExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
    const totalKdvExpense = monthExpenses.reduce((sum, exp) => sum + (exp.kdvAmount || 0), 0)

    return {
      invoices: monthInvoices,
      expenses: monthExpenses,
      totalIncome,
      totalKdvIncome,
      totalExpense,
      totalKdvExpense,
      netProfit: totalIncome - totalExpense,
      kdvBalance: totalKdvIncome - totalKdvExpense
    }
  }, [selectedMonth, invoices, expenses])

  // Category breakdown for expenses
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number; total: number }> = {}
    monthData.expenses.forEach(exp => {
      const cat = exp.category || 'diger'
      if (!breakdown[cat]) {
        breakdown[cat] = { count: 0, total: 0 }
      }
      breakdown[cat].count++
      breakdown[cat].total += exp.amount || 0
    })
    return breakdown
  }, [monthData.expenses])

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const date = new Date(year, month - 1 + (direction === 'next' ? 1 : -1), 1)
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }

  const handleShare = async (method: 'zip' | 'whatsapp' | 'copy') => {
    setShareMethod(method)
    setIsSharing(true)
    
    // Simulate sharing process
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    if (method === 'whatsapp') {
      const message = `${parseMonthDisplay(selectedMonth)} Gider Raporu\n\n` +
        `Toplam Gider: ${formatCurrency(monthData.totalExpense)} TRY\n` +
        `KDV Toplami: ${formatCurrency(monthData.totalKdvExpense)} TRY\n` +
        `Belge Sayisi: ${monthData.expenses.length}\n\n` +
        `Detayli PDF ve belgeler icin lutfen platform uzerinden indirin.`
      
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
    } else if (method === 'copy') {
      const text = generateReportText()
      await navigator.clipboard.writeText(text)
    } else if (method === 'zip') {
      // In production, this would generate and download a ZIP file
      // For demo, we'll just show success
    }
    
    setShareSuccess(true)
    setTimeout(() => {
      setIsSharing(false)
      setShareMethod(null)
      setShareSuccess(false)
    }, 2000)
  }

  const generateReportText = () => {
    const lines = [
      `===== ${parseMonthDisplay(selectedMonth)} AYLIK RAPOR =====`,
      '',
      'GELIR OZETI',
      `Toplam Gelir: ${formatCurrency(monthData.totalIncome)} TRY`,
      `KDV Tahsilati: ${formatCurrency(monthData.totalKdvIncome)} TRY`,
      `Fatura Sayisi: ${monthData.invoices.length}`,
      '',
      'GIDER OZETI',
      `Toplam Gider: ${formatCurrency(monthData.totalExpense)} TRY`,
      `KDV Odemesi: ${formatCurrency(monthData.totalKdvExpense)} TRY`,
      `Belge Sayisi: ${monthData.expenses.length}`,
      '',
      'NET SONUC',
      `Net Kar/Zarar: ${formatCurrency(monthData.netProfit)} TRY`,
      `KDV Dengesi: ${formatCurrency(monthData.kdvBalance)} TRY`,
      '',
      'KATEGORI DAGILIMI',
    ]
    
    Object.entries(categoryBreakdown).forEach(([cat, data]) => {
      const label = EXPENSE_CATEGORIES[cat as keyof typeof EXPENSE_CATEGORIES]?.label || cat
      lines.push(`${label}: ${formatCurrency(data.total)} TRY (${data.count} adet)`)
    })
    
    return lines.join('\n')
  }

  return (
    <div className="space-y-4">
      {/* Month Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue>{parseMonthDisplay(selectedMonth)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map(month => (
                <SelectItem key={month} value={month}>
                  {parseMonthDisplay(month)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="text-xs text-muted-foreground">Toplam Gelir</span>
            </div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(monthData.totalIncome)} TRY</p>
            <p className="text-xs text-muted-foreground mt-1">{monthData.invoices.length} fatura</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Toplam Gider</span>
            </div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(monthData.totalExpense)} TRY</p>
            <p className="text-xs text-muted-foreground mt-1">{monthData.expenses.length} belge</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Net Kar/Zarar</span>
            </div>
            <p className={`text-xl font-bold ${monthData.netProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {monthData.netProfit >= 0 ? '+' : ''}{formatCurrency(monthData.netProfit)} TRY
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-4 h-4 text-secondary" />
              <span className="text-xs text-muted-foreground">KDV Dengesi</span>
            </div>
            <p className={`text-xl font-bold ${monthData.kdvBalance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
              {formatCurrency(monthData.kdvBalance)} TRY
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {monthData.kdvBalance >= 0 ? 'Odenecek' : 'Iade'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Share Actions for Accountant */}
      <Card className="border-0 shadow-md bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Share2 className="w-5 h-5 text-accent" />
            Muhasebeciye Gonder
          </CardTitle>
          <CardDescription>
            {parseMonthDisplay(selectedMonth)} giderlerini tek tikla paylasin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSharing ? (
            <div className="flex items-center justify-center py-6">
              {shareSuccess ? (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="font-medium text-green-600">
                    {shareMethod === 'zip' && 'ZIP dosyasi indirildi!'}
                    {shareMethod === 'whatsapp' && 'WhatsApp aciliyor...'}
                    {shareMethod === 'copy' && 'Panoya kopyalandi!'}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border-4 border-muted border-t-accent animate-spin mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Hazirlaniyor...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-3">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2 bg-background hover:bg-muted"
                onClick={() => handleShare('zip')}
              >
                <FileArchive className="w-6 h-6 text-accent" />
                <div className="text-center">
                  <p className="font-medium text-sm">ZIP Indir</p>
                  <p className="text-xs text-muted-foreground">Tum belgeler</p>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2 bg-background hover:bg-muted"
                onClick={() => handleShare('whatsapp')}
              >
                <MessageCircle className="w-6 h-6 text-green-500" />
                <div className="text-center">
                  <p className="font-medium text-sm">WhatsApp</p>
                  <p className="text-xs text-muted-foreground">Ozet gonder</p>
                </div>
              </Button>

              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2 bg-background hover:bg-muted"
                onClick={() => handleShare('copy')}
              >
                <Copy className="w-6 h-6 text-primary" />
                <div className="text-center">
                  <p className="font-medium text-sm">Kopyala</p>
                  <p className="text-xs text-muted-foreground">Metin raporu</p>
                </div>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">Gider Dagilimi</CardTitle>
            <CardDescription>Kategorilere gore {parseMonthDisplay(selectedMonth)} giderleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(categoryBreakdown)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([cat, data]) => {
                  const category = EXPENSE_CATEGORIES[cat as keyof typeof EXPENSE_CATEGORIES]
                  const percentage = (data.total / monthData.totalExpense) * 100
                  return (
                    <div key={cat} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category?.color || '#b2bec3' }}
                          />
                          <span className="text-sm font-medium">{category?.label || cat}</span>
                          <span className="text-xs text-muted-foreground">({data.count} adet)</span>
                        </div>
                        <span className="font-medium">{formatCurrency(data.total)} TRY</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: category?.color || '#b2bec3'
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense List for Month */}
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Gider Detaylari</CardTitle>
            <CardDescription>{monthData.expenses.length} kayit</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {monthData.expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Bu ay icin gider kaydedilmemis</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {monthData.expenses.map(expense => (
                <div 
                  key={expense.id} 
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ 
                        backgroundColor: `${EXPENSE_CATEGORIES[expense.category as keyof typeof EXPENSE_CATEGORIES]?.color || '#b2bec3'}20` 
                      }}
                    >
                      <Receipt 
                        className="w-4 h-4"
                        style={{ 
                          color: EXPENSE_CATEGORIES[expense.category as keyof typeof EXPENSE_CATEGORIES]?.color || '#b2bec3' 
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{expense.description || expense.supplier}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  <p className="font-medium text-destructive">{formatCurrency(expense.amount)} TRY</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
