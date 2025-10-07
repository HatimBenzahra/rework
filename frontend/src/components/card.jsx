import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function StatsCard({ title, value, description, icon, trend, trendValue }) {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
  const trendIcon = trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '➡️'

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-2xl">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
        {trend && trendValue && (
          <div className={`flex items-center mt-2 text-xs ${trendColor}`}>
            <span className="mr-1">{trendIcon}</span>
            <span>{trendValue}</span>
            <span className="ml-1">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}