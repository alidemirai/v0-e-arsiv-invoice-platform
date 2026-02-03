'use client'

import { TrendingUp, TrendingDown, Receipt, FileText, Users, Wallet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/store'
import type { DashboardStats } from '@/lib/types'

interface StatsCardsProps {
  stats: DashboardStats
  isLoading?: boolean
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const cards = [
    {
      title: 'Toplam Gelir',
      value: stats.totalRevenue,
      icon: TrendingUp,
      iconBg: 'bg-accent/20',
      iconColor: 'text-accent',
      subtitle: `${stats.invoiceCount} fatura`,
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Toplam Gider',
      value: stats.totalExpenses,
      icon: TrendingDown,
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      subtitle: `${stats.expenseCount} kayit`,
      trend: '-5%',
      trendUp: false
    },
    {
      title: 'Net Kar',
      value: stats.netProfit,
      icon: Wallet,
      iconBg: stats.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100',
      iconColor: stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600',
      subtitle: 'Bu ay',
      trend: stats.netProfit >= 0 ? '+' : '',
      trendUp: stats.netProfit >= 0
    },
    {
      title: 'KDV Durumu',
      value: stats.kdvCollected - stats.kdvPaid,
      icon: Receipt,
      iconBg: 'bg-secondary/20',
      iconColor: 'text-secondary',
      subtitle: `Tahsil: ${formatCurrency(stats.kdvCollected)} TRY`,
      trend: null,
      trendUp: true
    }
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-0 shadow-md animate-pulse">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-8 w-32 bg-muted rounded" />
                </div>
                <div className="w-12 h-12 bg-muted rounded-xl" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card 
          key={card.title} 
          className="border-0 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">{card.title}</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(card.value)} 
                  <span className="text-sm font-normal ml-1">TRY</span>
                </p>
              </div>
              <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm">
              {card.trend && (
                <span className={card.trendUp ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
                  {card.trend}
                </span>
              )}
              <span className="text-muted-foreground">{card.subtitle}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
