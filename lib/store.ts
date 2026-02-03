// Local storage helpers for demo - In production, use database
import type { 
  Invoice, 
  Customer, 
  Expense, 
  InvoiceTemplate, 
  DashboardStats,
  MonthlyReport 
} from './types'

const STORAGE_KEYS = {
  CUSTOMERS: 'earsiv_customers',
  TEMPLATES: 'earsiv_templates',
  MANUAL_EXPENSES: 'earsiv_manual_expenses'
}

// Customers
export function getCustomers(): Customer[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS)
  return data ? JSON.parse(data) : []
}

export function saveCustomer(customer: Customer): void {
  const customers = getCustomers()
  const existingIndex = customers.findIndex(c => c.id === customer.id)
  if (existingIndex >= 0) {
    customers[existingIndex] = customer
  } else {
    customers.push(customer)
  }
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers))
}

export function deleteCustomer(id: string): void {
  const customers = getCustomers().filter(c => c.id !== id)
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers))
}

// Templates
export function getTemplates(): InvoiceTemplate[] {
  if (typeof window === 'undefined') return getDefaultTemplates()
  const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES)
  return data ? JSON.parse(data) : getDefaultTemplates()
}

export function saveTemplate(template: InvoiceTemplate): void {
  const templates = getTemplates()
  const existingIndex = templates.findIndex(t => t.id === template.id)
  if (existingIndex >= 0) {
    templates[existingIndex] = template
  } else {
    templates.push(template)
  }
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates))
}

export function deleteTemplate(id: string): void {
  const templates = getTemplates().filter(t => t.id !== id)
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates))
}

function getDefaultTemplates(): InvoiceTemplate[] {
  return []
}

// Manual Expenses (not from GIB)
export function getManualExpenses(): Expense[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STORAGE_KEYS.MANUAL_EXPENSES)
  return data ? JSON.parse(data) : []
}

export function saveManualExpense(expense: Expense): void {
  const expenses = getManualExpenses()
  const existingIndex = expenses.findIndex(e => e.id === expense.id)
  if (existingIndex >= 0) {
    expenses[existingIndex] = expense
  } else {
    expenses.push(expense)
  }
  localStorage.setItem(STORAGE_KEYS.MANUAL_EXPENSES, JSON.stringify(expenses))
}

export function deleteManualExpense(id: string): void {
  const expenses = getManualExpenses().filter(e => e.id !== id)
  localStorage.setItem(STORAGE_KEYS.MANUAL_EXPENSES, JSON.stringify(expenses))
}

// Calculate dashboard stats
export function calculateDashboardStats(
  invoices: Invoice[], 
  expenses: Expense[]
): DashboardStats {
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  const kdvCollected = invoices.reduce((sum, inv) => sum + (inv.kdvAmount || inv.amount * 0.2), 0)
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
  const kdvPaid = expenses.reduce((sum, exp) => sum + (exp.kdvAmount || 0), 0)
  const customers = getCustomers()

  return {
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    kdvCollected,
    kdvPaid,
    invoiceCount: invoices.length,
    expenseCount: expenses.length,
    customerCount: customers.length
  }
}

// Get monthly report
export function getMonthlyReport(
  expenses: Expense[],
  invoices: Invoice[],
  month: string, // Format: YYYY-MM
  year: number
): MonthlyReport {
  const monthExpenses = expenses.filter(e => e.month === month)
  const monthInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.date)
    const [targetYear, targetMonth] = month.split('-').map(Number)
    return invDate.getFullYear() === targetYear && invDate.getMonth() + 1 === targetMonth
  })

  const totalIncome = monthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
  const totalExpense = monthExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)

  return {
    month,
    year,
    totalIncome,
    totalExpense,
    netProfit: totalIncome - totalExpense,
    invoiceCount: monthInvoices.length,
    expenseCount: monthExpenses.length,
    expenses: monthExpenses
  }
}

// Update customer stats when invoice is created
export function updateCustomerStats(customerId: string, invoiceAmount: number): void {
  const customers = getCustomers()
  const customer = customers.find(c => c.id === customerId)
  if (customer) {
    customer.totalInvoices += 1
    customer.totalRevenue += invoiceAmount
    saveCustomer(customer)
  }
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Format date
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('tr-TR')
}

// Get current month in YYYY-MM format
export function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// Parse month string to display
export function parseMonthDisplay(month: string): string {
  const [year, monthNum] = month.split('-').map(Number)
  const months = [
    'Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
    'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'
  ]
  return `${months[monthNum - 1]} ${year}`
}
