// Core Types for E-Arsiv Platform

export interface Invoice {
  id: string
  invoiceNo: string
  date: string
  customer: string
  customerId?: string
  vkn?: string
  amount: number
  kdvRate: number
  kdvAmount: number
  totalAmount: number
  status: 'draft' | 'sent' | 'approved'
  items: InvoiceItem[]
  notes?: string
  createdAt: string
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  kdvRate: number
  total: number
}

export interface Customer {
  id: string
  name: string
  vkn: string
  taxOffice?: string
  address?: string
  phone?: string
  email?: string
  totalInvoices: number
  totalRevenue: number
  createdAt: string
}

export interface Expense {
  id: string
  description: string
  supplier: string
  supplierVkn?: string
  amount: number
  kdvAmount: number
  totalAmount: number
  category: ExpenseCategory
  date: string
  month: string // Format: YYYY-MM
  receiptUrl?: string
  pdfUrl?: string
  isManual: boolean
  createdAt: string
}

export type ExpenseCategory = 
  | 'yemek'
  | 'ulasim'
  | 'yazilim'
  | 'ofis'
  | 'abonelik'
  | 'diger'

export interface InvoiceTemplate {
  id: string
  name: string
  description: string
  defaultKdvRate: number
  isExempt: boolean
  exemptionReason?: string
  defaultItems: Partial<InvoiceItem>[]
}

export interface MonthlyReport {
  month: string
  year: number
  totalIncome: number
  totalExpense: number
  netProfit: number
  invoiceCount: number
  expenseCount: number
  expenses: Expense[]
}

export interface DashboardStats {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  kdvCollected: number
  kdvPaid: number
  invoiceCount: number
  expenseCount: number
  customerCount: number
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string; color: string }> = {
  yemek: { label: 'Yemek', color: '#ff6b6b' },
  ulasim: { label: 'Ulasim', color: '#4ecdc4' },
  yazilim: { label: 'Yazilim', color: '#45b7d1' },
  ofis: { label: 'Ofis Malzemeleri', color: '#96ceb4' },
  abonelik: { label: 'Abonelik', color: '#dfe6e9' },
  diger: { label: 'Diger', color: '#b2bec3' }
}

export const KDV_RATES = [
  { value: 0, label: '%0 (Istisna)' },
  { value: 1, label: '%1' },
  { value: 10, label: '%10' },
  { value: 20, label: '%20' }
]

export const EXEMPTION_REASONS = [
  { code: '301', label: 'Mal ihracati' },
  { code: '302', label: 'Hizmet ihracati' },
  { code: '303', label: 'Yurt disi yazilim hizmeti' },
  { code: '350', label: 'Diger istisnalar' }
]

// Turkish months for display
export const TURKISH_MONTHS = [
  'Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
  'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'
]
