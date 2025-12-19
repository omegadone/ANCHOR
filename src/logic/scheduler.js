/**
 * scheduler.js
 * The Brain: Calculates work-load distribution and ideal projections.
 */
export const Scheduler = {
    calculateDailySchedule(tasks, dailyCapacity, targetDate = new Date()) {
        const viewDate = new Date(targetDate);
        viewDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const isFutureView = viewDate > today;
        let allocatedHours = 0;

        const processedTasks = tasks
            .filter(task => !task.completed)
            .map(task => {
                // FIX: Use replace to ensure local time parsing (prevents UTC/timezone bug)
                const deadline = new Date(task.deadline.replace(/-/g, '\/'));
                deadline.setHours(0, 0, 0, 0);
                
                const totalDaysWindow = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24)) || 1;
                const daysFromView = Math.ceil((deadline - viewDate) / (1000 * 60 * 60 * 24)) || 1;
                const remainingWork = Math.max(0, task.estimatedHours - (task.timeWorked || 0));

                let minCommitmentToday;
                if (isFutureView) {
                    minCommitmentToday = remainingWork / totalDaysWindow;
                } else {
                    minCommitmentToday = remainingWork / daysFromView;
                }

                return {
                    ...task,
                    remainingHours: parseFloat(remainingWork.toFixed(2)),
                    minCommitmentToday: parseFloat(minCommitmentToday.toFixed(2)),
                    urgencyScore: (task.priority * 2) + (10 / (daysFromView + 0.1)),
                    isExpired: deadline < viewDate
                };
            })
            .filter(task => !task.isExpired && task.minCommitmentToday > 0);

        processedTasks.sort((a, b) => b.urgencyScore - a.urgencyScore);

        const recommendedTasks = [];
        for (const task of processedTasks) {
            if (allocatedHours + task.minCommitmentToday <= dailyCapacity) {
                recommendedTasks.push(task);
                allocatedHours += task.minCommitmentToday;
            }
        }

        return {
            recommendedTasks,
            metrics: {
                totalRequiredHoursToday: parseFloat(allocatedHours.toFixed(2)),
                capacityUsage: ((allocatedHours / dailyCapacity) * 100).toFixed(1)
            }
        };
    }
};