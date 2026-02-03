'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency } from '@/lib/store'
import { TURKISH_MONTHS } from '@/lib/types'

interface MonthlyChartProps {
  invoices: any[]
  expenses: any[]
}

export function MonthlyChart({ invoices, expenses }: MonthlyChartProps) {
  const monthlyData = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const data: { month: string; income: number; expense: number }[] = []

    for (let i = 0; i < 6; i++) {
      const date = new Date(currentYear, new Date().getMonth() - 5 + i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = TURKISH_MONTHS[date.getMonth()].substring(0, 3)

      const monthIncome = invoices
        .filter(inv => {
          const invDate = new Date(inv.date)
          return invDate.getFullYear() === date.getFullYear() && 
                 invDate.getMonth() === date.getMonth()
        })
        .reduce((sum, inv) => sum + (inv.amount || 0), 0)

      const monthExpense = expenses
        .filter(exp => exp.month === monthKey || (exp.date && new Date(exp.date).getMonth() === date.getMonth()))
        .reduce((sum, exp) => sum + (exp.amount || 0), 0)

      data.push({ month: monthName, income: monthIncome, expense: monthExpense })
    }

    return data
  }, [invoices, expenses])

  const maxValue = Math.max(
    ...monthlyData.map(d => Math.max(d.income, d.expense)),
    1000
  )

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-base">Aylik Gelir/Gider</CardTitle>
        <CardDescription>Son 6 ayin karsilastirmasi</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-muted-foreground">Gelir</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive/60" />
              <span className="text-muted-foreground">Gider</span>
            </div>
          </div>

          {/* Chart */}
          <div className="flex items-end justify-between gap-2 h-48 pt-4">
            {monthlyData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="flex-1 w-full flex items-end justify-center gap-1">
                  {/* Income Bar */}
                  <div 
                    className="w-5 bg-accent rounded-t transition-all duration-300"
                    style={{ 
                      height: `${(data.income / maxValue) * 100}%`,
                      minHeight: data.income > 0 ? '8px' : '0'
                    }}
                    title={`Gelir: ${formatCurrency(data.income)} TRY`}
                  />
                  {/* Expense Bar */}
                  <div 
                    className="w-5 bg-destructive/60 rounded-t transition-all duration-300"
                    style={{ 
                      height: `${(data.expense / maxValue) * 100}%`,
                      minHeight: data.expense > 0 ? '8px' : '0'
                    }}
                    title={`Gider: ${formatCurrency(data.expense)} TRY`}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{data.month}</span>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">
                {formatCurrency(monthlyData.reduce((sum, d) => sum + d.income, 0))}
              </p>
              <p className="text-xs text-muted-foreground">Toplam Gelir</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive/80">
                {formatCurrency(monthlyData.reduce((sum, d) => sum + d.expense, 0))}
              </p>
              <p className="text-xs text-muted-foreground">Toplam Gider</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
