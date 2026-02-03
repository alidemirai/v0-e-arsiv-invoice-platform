'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Plus, Search, Camera, Upload, Receipt, Trash2, Edit2, 
  Filter, ChevronLeft, ChevronRight, FileText, Download
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  getManualExpenses, saveManualExpense, deleteManualExpense, 
  generateId, formatCurrency, formatDate, getCurrentMonth, parseMonthDisplay 
} from '@/lib/store'
import { EXPENSE_CATEGORIES, TURKISH_MONTHS } from '@/lib/types'
import type { Expense, ExpenseCategory } from '@/lib/types'

interface ExpenseManagerProps {
  gibExpenses: Expense[]
  onScanReceipt: () => void
}

export function ExpenseManager({ gibExpenses, onScanReceipt }: ExpenseManagerProps) {
  const [manualExpenses, setManualExpenses] = useState<Expense[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    description: '',
    supplier: '',
    amount: '',
    kdvAmount: '',
    category: 'diger' as ExpenseCategory,
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = () => {
    setManualExpenses(getManualExpenses())
  }

  // Combine GIB expenses with manual expenses
  const allExpenses = useMemo(() => {
    const gib = gibExpenses.map(exp => ({
      ...exp,
      month: exp.date ? `${new Date(exp.date).getFullYear()}-${String(new Date(exp.date).getMonth() + 1).padStart(2, '0')}` : selectedMonth,
      isManual: false
    }))
    return [...gib, ...manualExpenses]
  }, [gibExpenses, manualExpenses, selectedMonth])

  // Filter expenses by month and category
  const filteredExpenses = useMemo(() => {
    return allExpenses.filter(exp => {
      const monthMatch = exp.month === selectedMonth
      const categoryMatch = categoryFilter === 'all' || exp.category === categoryFilter
      const searchMatch = !searchQuery || 
        exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.supplier?.toLowerCase().includes(searchQuery.toLowerCase())
      return monthMatch && categoryMatch && searchMatch
    })
  }, [allExpenses, selectedMonth, categoryFilter, searchQuery])

  // Calculate totals for selected month
  const monthlyTotal = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
  const monthlyKdv = filteredExpenses.reduce((sum, exp) => sum + (exp.kdvAmount || 0), 0)

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {}
    filteredExpenses.forEach(exp => {
      const cat = exp.category || 'diger'
      breakdown[cat] = (breakdown[cat] || 0) + (exp.amount || 0)
    })
    return breakdown
  }, [filteredExpenses])

  const resetForm = () => {
    setFormData({
      description: '',
      supplier: '',
      amount: '',
      kdvAmount: '',
      category: 'diger',
      date: new Date().toISOString().split('T')[0]
    })
    setIsCreating(false)
    setEditingId(null)
  }

  const handleSave = () => {
    const expense: Expense = {
      id: editingId || generateId(),
      description: formData.description,
      supplier: formData.supplier,
      supplierVkn: '',
      amount: parseFloat(formData.amount) || 0,
      kdvAmount: parseFloat(formData.kdvAmount) || 0,
      totalAmount: (parseFloat(formData.amount) || 0) + (parseFloat(formData.kdvAmount) || 0),
      category: formData.category,
      date: formData.date,
      month: `${new Date(formData.date).getFullYear()}-${String(new Date(formData.date).getMonth() + 1).padStart(2, '0')}`,
      isManual: true,
      createdAt: editingId ? manualExpenses.find(e => e.id === editingId)?.createdAt || new Date().toISOString() : new Date().toISOString()
    }
    saveManualExpense(expense)
    loadExpenses()
    resetForm()
  }

  const handleEdit = (expense: Expense) => {
    if (!expense.isManual) return // Can't edit GIB expenses
    setFormData({
      description: expense.description,
      supplier: expense.supplier,
      amount: String(expense.amount),
      kdvAmount: String(expense.kdvAmount || 0),
      category: expense.category,
      date: expense.date
    })
    setEditingId(expense.id)
    setIsCreating(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Bu gideri silmek istediginizden emin misiniz?')) {
      deleteManualExpense(id)
      loadExpenses()
    }
  }

  // Month navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number)
    const date = new Date(year, month - 1 + (direction === 'next' ? 1 : -1), 1)
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }

  // Generate available months (last 12 months)
  const availableMonths = useMemo(() => {
    const months = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
    }
    return months
  }, [])

  return (
    <div className="space-y-4">
      {/* Month Selector & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[160px]">
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

        <div className="flex gap-2">
          <Button variant="outline" onClick={onScanReceipt} className="bg-transparent">
            <Camera className="w-4 h-4 mr-2" />
            Fis Tara
          </Button>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Manuel Ekle
          </Button>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">Toplam Gider</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(monthlyTotal)} TRY</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">KDV Toplami</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(monthlyKdv)} TRY</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">Belge Sayisi</p>
            <p className="text-xl font-bold text-foreground">{filteredExpenses.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">En Buyuk Kategori</p>
            <p className="text-xl font-bold text-foreground">
              {Object.entries(categoryBreakdown).length > 0 
                ? EXPENSE_CATEGORIES[Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] as ExpenseCategory]?.label || 'Diger'
                : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryBreakdown).length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Kategori Dagilimi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(categoryBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amount]) => {
                  const category = EXPENSE_CATEGORIES[cat as ExpenseCategory]
                  const percentage = (amount / monthlyTotal) * 100
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground">{category?.label || cat}</span>
                        <span className="font-medium">{formatCurrency(amount)} TRY</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
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

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Gider ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[180px] h-11">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tum Kategoriler</SelectItem>
            {Object.entries(EXPENSE_CATEGORIES).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card className="border-accent/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {editingId ? 'Gideri Duzenle' : 'Manuel Gider Ekle'}
            </CardTitle>
            <CardDescription>
              PDF fatura veya fis bilgilerini manuel girin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Aciklama *</Label>
                <Input
                  placeholder="Gider aciklamasi"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Satici / Isletme</Label>
                <Input
                  placeholder="Satici adi"
                  value={formData.supplier}
                  onChange={e => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tutar (KDV Haric) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>KDV Tutari</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.kdvAmount}
                  onChange={e => setFormData(prev => ({ ...prev, kdvAmount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={v => setFormData(prev => ({ ...prev, category: v as ExpenseCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPENSE_CATEGORIES).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tarih</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={resetForm}>
                Iptal
              </Button>
              <Button 
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={handleSave}
                disabled={!formData.description || !formData.amount}
              >
                Kaydet
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {searchQuery || categoryFilter !== 'all' 
                ? 'Filtrelere uygun gider bulunamadi' 
                : `${parseMonthDisplay(selectedMonth)} icin gider kaydedilmemis`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map(expense => (
            <Card key={expense.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${EXPENSE_CATEGORIES[expense.category as ExpenseCategory]?.color || '#b2bec3'}20` }}
                    >
                      <Receipt 
                        className="w-5 h-5"
                        style={{ color: EXPENSE_CATEGORIES[expense.category as ExpenseCategory]?.color || '#b2bec3' }}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {expense.description || expense.supplier}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatDate(expense.date)}</span>
                        <span>•</span>
                        <span className="px-2 py-0.5 rounded-full text-xs" style={{
                          backgroundColor: `${EXPENSE_CATEGORIES[expense.category as ExpenseCategory]?.color || '#b2bec3'}20`,
                          color: EXPENSE_CATEGORIES[expense.category as ExpenseCategory]?.color || '#b2bec3'
                        }}>
                          {EXPENSE_CATEGORIES[expense.category as ExpenseCategory]?.label || expense.category}
                        </span>
                        {!expense.isManual && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                            GIB
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-destructive">{formatCurrency(expense.amount)} TRY</p>
                      {expense.kdvAmount > 0 && (
                        <p className="text-xs text-muted-foreground">
                          +{formatCurrency(expense.kdvAmount)} KDV
                        </p>
                      )}
                    </div>
                    {expense.isManual && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
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
