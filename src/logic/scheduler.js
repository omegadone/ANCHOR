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
                const deadline = new Date(task.deadline);
                deadline.setHours(0, 0, 0, 0);
                
                // Days left from TODAY to the deadline
                const totalDaysWindow = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24)) || 1;
                
                // Days left from the VIEWED DATE to the deadline
                const daysFromView = Math.ceil((deadline - viewDate) / (1000 * 60 * 60 * 24)) || 1;

                const remainingWork = Math.max(0, task.estimatedHours - (task.timeWorked || 0));

                let minCommitmentToday;
                if (isFutureView) {
                    /**
                     * IDEAL PROJECTION: 
                     * We show the "fair share" assuming we work steadily from today.
                     * If we have 10 hours left and 5 days total, every future day shows 2 hours.
                     */
                    minCommitmentToday = remainingWork / totalDaysWindow;
                } else {
                    /**
                     * REAL-TIME URGENCY:
                     * What is actually needed today to hit the deadline.
                     */
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

        // Sort by urgency
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