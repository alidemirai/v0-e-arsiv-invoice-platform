'use client'

import { FileText, Receipt, ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/store'

interface RecentActivityProps {
  invoices: any[]
  expenses: any[]
  onViewAllInvoices: () => void
  onViewAllExpenses: () => void
}

export function RecentActivity({ 
  invoices, 
  expenses, 
  onViewAllInvoices, 
  onViewAllExpenses 
}: RecentActivityProps) {
  // Combine and sort by date
  const allActivity = [
    ...invoices.slice(0, 5).map(inv => ({
      type: 'invoice' as const,
      id: inv.id,
      title: inv.customer,
      subtitle: inv.invoiceNo,
      date: inv.date,
      amount: inv.amount,
      status: inv.status
    })),
    ...expenses.slice(0, 5).map(exp => ({
      type: 'expense' as const,
      id: exp.id,
      title: exp.description || exp.supplier,
      subtitle: exp.category,
      date: exp.date,
      amount: exp.amount,
      status: 'completed'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, 8)

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">Son Islemler</CardTitle>
          <CardDescription>Faturalar ve giderler</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {allActivity.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Henuz islem bulunmuyor</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allActivity.map((item) => (
              <div 
                key={`${item.type}-${item.id}`}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    item.type === 'invoice' 
                      ? 'bg-accent/20' 
                      : 'bg-destructive/10'
                  }`}>
                    {item.type === 'invoice' ? (
                      <ArrowUpRight className="w-5 h-5 text-accent" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.subtitle} - {formatDate(item.date)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${
                    item.type === 'invoice' ? 'text-accent' : 'text-destructive'
                  }`}>
                    {item.type === 'invoice' ? '+' : '-'}{formatCurrency(item.amount)} TRY
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 bg-transparent"
            onClick={onViewAllInvoices}
          >
            <FileText className="w-4 h-4 mr-2" />
            Tum Faturalar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 bg-transparent"
            onClick={onViewAllExpenses}
          >
            <Receipt className="w-4 h-4 mr-2" />
            Tum Giderler
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
