import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export function ResourceDemandForecast() {
  const { activities, labourLogs } = useAppContext();

  const forecastData = useMemo(() => {
    // Basic mock logic: use upcoming dates (next 7 days)
    // and forecast demand based on activities in progress or planned.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const data = [];
    
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      
      const dateStr = targetDate.toISOString().split('T')[0];
      const shortDate = targetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      
      // Calculate active activities on this day
      const activeActivities = activities.filter(a => {
        if (!a.startDate || !a.finishDate) return false;
        const start = new Date(a.startDate);
        const end = new Date(a.finishDate);
        return targetDate >= start && targetDate <= end;
      });

      // Calculate forecasted hours based on some logic
      // e.g., base demand + random variation based on active activities
      let civilDemand = 0;
      let mechanicalDemand = 0;
      let electricalDemand = 0;

      activeActivities.forEach(a => {
        if (!a.startDate || !a.finishDate) return;
        const start = new Date(a.startDate).getTime();
        const end = new Date(a.finishDate).getTime();
        const durationDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
        const dailyHours = (a.plannedHours || 0) / durationDays;

        if (a.discipline === 'Civil') civilDemand += Math.round(dailyHours);
        if (a.discipline === 'Mechanical') mechanicalDemand += Math.round(dailyHours);
        if (a.discipline === 'Electrical') electricalDemand += Math.round(dailyHours);
      });

      data.push({
        date: shortDate,
        Civil: civilDemand,
        Mechanical: mechanicalDemand,
        Electrical: electricalDemand,
        total: civilDemand + mechanicalDemand + electricalDemand
      });
    }
    
    return data;
  }, [activities, labourLogs]);

  return (
    <Card className="flex flex-col flex-1 min-h-[300px]">
      <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-[#0B5FFF]" />
          Resource Demand Forecast (7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-1 h-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={forecastData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#64748b' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#64748b' }} 
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="Civil" stackId="a" fill="#0B5FFF" radius={[0, 0, 4, 4]} maxBarSize={40} />
            <Bar dataKey="Mechanical" stackId="a" fill="#00C49F" maxBarSize={40} />
            <Bar dataKey="Electrical" stackId="a" fill="#FFBB28" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
