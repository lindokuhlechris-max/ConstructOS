import { SubTask, SubTaskProgressEntry, Activity, ActivityStatus } from '../types';

/**
 * Calculates the daily average output and projected days left for a subtask
 */
export function calculateSubtaskDailyAverage(subtask: SubTask): {
  dailyAverage: number;
  shiftsCount: number;
  projectedDaysLeft?: number;
  formattedRate: string;
} {
  const history = subtask.progressHistory || [];
  const completed = subtask.completedQuantity || 0;
  const target = subtask.targetQuantity || 0;
  const unit = subtask.unit || 'units';

  if (history.length === 0) {
    if (completed > 0) {
      return {
        dailyAverage: completed,
        shiftsCount: 1,
        projectedDaysLeft: target > completed ? Math.ceil((target - completed) / completed) : 0,
        formattedRate: `${completed.toFixed(1)} ${unit}/shift`
      };
    }
    return {
      dailyAverage: 0,
      shiftsCount: 0,
      projectedDaysLeft: undefined,
      formattedRate: `0 ${unit}/day`
    };
  }

  // Calculate unique days or shift entries with positive output
  const validOutputs = history.filter(h => (h.outputQuantity || 0) > 0);
  const totalLoggedOutput = validOutputs.reduce((sum, h) => sum + (h.outputQuantity || 0), 0);
  const shiftsCount = validOutputs.length || 1;
  const dailyAverage = totalLoggedOutput > 0 ? totalLoggedOutput / shiftsCount : (completed / shiftsCount);

  let projectedDaysLeft: number | undefined = undefined;
  if (target > completed && dailyAverage > 0) {
    projectedDaysLeft = Math.max(1, Math.ceil((target - completed) / dailyAverage));
  } else if (completed >= target && target > 0) {
    projectedDaysLeft = 0;
  }

  return {
    dailyAverage: Number(dailyAverage.toFixed(2)),
    shiftsCount,
    projectedDaysLeft,
    formattedRate: `${dailyAverage.toFixed(1)} ${unit}/day`
  };
}

/**
 * Updates a SubTask with a new daily shift progress entry
 */
export function recordSubtaskProgress(
  subtask: SubTask,
  params: {
    date: string;
    shiftOutput: number;
    mode: 'shift' | 'cumulative';
    status?: 'Not Started' | 'In Progress' | 'Completed';
    notes?: string;
    loggedBy?: string;
    weather?: string;
    hoursSpent?: number;
    chainageSpan?: string;
  }
): SubTask {
  const targetQty = subtask.targetQuantity || 0;
  const prevCompleted = subtask.completedQuantity || 0;

  let newOutput = 0;
  let newCumulative = 0;

  if (params.mode === 'shift') {
    newOutput = Math.max(0, params.shiftOutput);
    newCumulative = prevCompleted + newOutput;
  } else {
    // Cumulative mode: new output is delta
    newCumulative = Math.max(0, params.shiftOutput);
    newOutput = Math.max(0, newCumulative - prevCompleted);
  }

  if (targetQty > 0 && newCumulative > targetQty * 1.5) {
    // Guard against erroneous runaway numbers
    newCumulative = Math.min(newCumulative, targetQty * 1.5);
  }

  // Determine auto status if not explicitly given
  let newStatus: 'Not Started' | 'In Progress' | 'Completed' = params.status || subtask.status;
  if (!params.status) {
    if (targetQty > 0 && newCumulative >= targetQty) {
      newStatus = 'Completed';
    } else if (newCumulative > 0) {
      newStatus = 'In Progress';
    }
  }

  const logEntry: SubTaskProgressEntry = {
    id: `STEP-LOG-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    date: params.date || new Date().toISOString().split('T')[0],
    outputQuantity: Number(newOutput.toFixed(2)),
    cumulativeQuantity: Number(newCumulative.toFixed(2)),
    status: newStatus,
    notes: params.notes,
    loggedBy: params.loggedBy,
    weather: params.weather,
    hoursSpent: params.hoursSpent,
    chainageSpan: params.chainageSpan,
    timestamp: new Date().toISOString()
  };

  const existingHistory = subtask.progressHistory || [];
  const updatedHistory = [logEntry, ...existingHistory];

  const updatedSubtask: SubTask = {
    ...subtask,
    completedQuantity: Number(newCumulative.toFixed(2)),
    status: newStatus,
    progressHistory: updatedHistory,
    lastLoggedDate: logEntry.date,
    lastLoggedOutput: logEntry.outputQuantity,
    notes: params.notes ? `${params.notes}` : subtask.notes,
    endDate: newStatus === 'Completed' ? (subtask.endDate || logEntry.date) : subtask.endDate,
    startDate: subtask.startDate || logEntry.date
  };

  const metrics = calculateSubtaskDailyAverage(updatedSubtask);
  updatedSubtask.dailyAverage = metrics.dailyAverage;

  return updatedSubtask;
}

/**
 * Calculates master activity rollup metrics from its subtasks
 */
export function calculateActivityRollupFromSubtasks(
  activity: Activity,
  subtasks: SubTask[]
): {
  overallProgress: number;
  actualQuantity: number;
  status: ActivityStatus;
  completedSubtasksCount: number;
  totalSubtasksCount: number;
} {
  if (!subtasks || subtasks.length === 0) {
    return {
      overallProgress: activity.progress || 0,
      actualQuantity: activity.actualQuantity || 0,
      status: activity.status,
      completedSubtasksCount: 0,
      totalSubtasksCount: 0
    };
  }

  const total = subtasks.length;
  const completedCount = subtasks.filter(s => s.status === 'Completed').length;
  const inProgressCount = subtasks.filter(s => s.status === 'In Progress').length;

  // Calculate weighted percentage
  // If subtasks have target quantities, weight by target; otherwise weight equally
  const subtasksWithTarget = subtasks.filter(s => (s.targetQuantity || 0) > 0);
  let overallPercent = 0;

  if (subtasksWithTarget.length === total) {
    const totalTarget = subtasks.reduce((sum, s) => sum + (s.targetQuantity || 0), 0);
    const totalCompleted = subtasks.reduce((sum, s) => sum + Math.min(s.completedQuantity || 0, s.targetQuantity || 0), 0);
    overallPercent = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : Math.round((completedCount / total) * 100);
  } else {
    // Sum individual completion percentages
    const sumPcts = subtasks.reduce((acc, s) => {
      if (s.status === 'Completed') return acc + 100;
      if (s.status === 'Not Started') return acc + 0;
      if (s.targetQuantity && s.targetQuantity > 0) {
        return acc + Math.min(100, Math.round(((s.completedQuantity || 0) / s.targetQuantity) * 100));
      }
      return acc + 50; // In progress default
    }, 0);
    overallPercent = Math.round(sumPcts / total);
  }

  // Determine rollup status
  let newStatus: ActivityStatus = activity.status;
  if (completedCount === total && total > 0) {
    newStatus = 'Completed';
    overallPercent = 100;
  } else if (completedCount > 0 || inProgressCount > 0 || overallPercent > 0) {
    if (activity.status !== 'Blocked') {
      newStatus = 'In Progress';
    }
  }

  // Compute primary quantity rollup if units align with activity
  let newActualQuantity = activity.actualQuantity || 0;
  if (activity.targetQuantity && activity.targetQuantity > 0) {
    newActualQuantity = Math.round((overallPercent / 100) * activity.targetQuantity);
  }

  return {
    overallProgress: Math.min(100, Math.max(0, overallPercent)),
    actualQuantity: newActualQuantity,
    status: newStatus,
    completedSubtasksCount: completedCount,
    totalSubtasksCount: total
  };
}
