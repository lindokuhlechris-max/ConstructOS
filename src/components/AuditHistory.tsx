import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, cn } from './ui';
import { History, User, FileText, CheckCircle, Clock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface AuditHistoryProps {
  projectId: string;
}

export function AuditHistory({ projectId }: AuditHistoryProps) {
  const { auditLogs } = useAppContext();
  
  const logs = auditLogs
    .filter(log => log.projectId === projectId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <History className="h-5 w-5 text-[#0B5FFF]" />
            Audit History
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
          <History className="h-12 w-12 text-slate-200 dark:text-slate-700 mb-4" />
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">No activity yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            Major actions like labor assignments and status changes will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Status Change':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Labour Assigned':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'Status Change':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Labour Assigned':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <History className="h-5 w-5 text-[#0B5FFF]" />
          Audit History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 pl-6 space-y-8 py-2">
          {logs.map((log) => (
            <div key={log.id} className="relative">
              {/* Timeline marker */}
              <div className="absolute -left-[35px] top-1 h-6 w-6 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-slate-400"></div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1", getActionColor(log.action))}>
                      {getActionIcon(log.action)}
                      {log.action}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {new Date(log.timestamp).toLocaleString(undefined, { 
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                  </span>
                </div>
                
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {log.details}
                </p>
                
                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                  <User className="h-3 w-3" />
                  <span>{log.userId}</span>
                  <span className="mx-1">•</span>
                  <span className="text-[10px] font-mono text-slate-400">{log.id}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
