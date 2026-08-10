import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { LabourLog, Activity } from '../types';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, format } from 'date-fns';

interface WeeklyLabourChartProps {
  labourLogs: LabourLog[];
  activities: Activity[];
}

export function WeeklyLabourChart({ labourLogs, activities }: WeeklyLabourChartProps) {
  const chartData = useMemo(() => {
    // Get current week's logs
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const currentWeekLogs = labourLogs.filter(log => {
      try {
        const logDate = parseISO(log.date);
        return isWithinInterval(logDate, { start: weekStart, end: weekEnd });
      } catch (e) {
        return false;
      }
    });

    // Aggregate hours by activityId
    const aggregated: Record<string, number> = {};
    currentWeekLogs.forEach(log => {
      if (!aggregated[log.activityId]) {
        aggregated[log.activityId] = 0;
      }
      aggregated[log.activityId] += log.hours || 0;
    });

    // Map to chart data format with activity names
    const data = Object.keys(aggregated).map(activityId => {
      const activity = activities.find(a => a.id === activityId);
      return {
        name: activity ? (activity.name.length > 15 ? activity.name.substring(0, 15) + '...' : activity.name) : 'Unknown Task',
        fullName: activity?.name || 'Unknown Task',
        hours: aggregated[activityId]
      };
    });

    return data.sort((a, b) => b.hours - a.hours); // Sort by highest hours
  }, [labourLogs, activities]);

  if (chartData.length === 0) {
    return null; // Don't render if no data for the current week
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-lg">Weekly Labour Distribution</CardTitle>
        <p className="text-sm text-slate-500">Total hours logged per task this week</p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
                dx={-10}
              />
              <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => [`${value} hrs`, 'Total Hours']}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    return payload[0].payload.fullName;
                  }
                  return label;
                }}
              />
              <Bar 
                dataKey="hours" 
                fill="#4f46e5" 
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
