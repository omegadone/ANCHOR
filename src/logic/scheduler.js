/**
 * scheduler.js
 * Core Engine for Task Prioritization and Workload Calculation
 */

export const Scheduler = {
    /**
     * Calculates the minimum work required for today.
     * @param {Array} tasks - Array of task objects
     * @param {number} dailyCapacity - User's set hours per day
     * @returns {Object} { recommendedTasks, metrics }
     */
    calculateDailySchedule(tasks, dailyCapacity) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let totalRequiredHoursToday = 0;
        const processedTasks = tasks
            .filter(task => !task.completed)
            .map(task => {
                const deadline = new Date(task.deadline);
                deadline.setHours(0, 0, 0, 0);
                
                // Calculate days remaining (minimum 1 to avoid division by zero)
                const diffTime = deadline - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                // DaysRemaining <= 0 means it's due today or overdue
                const daysRemaining = diffDays <= 0 ? 1 : diffDays;
                
                // The "Minimum Daily Commitment" to finish by deadline
                // Formula: Total Hours / Days Left
                const minCommitmentToday = task.estimatedHours / daysRemaining;

                return {
                    ...task,
                    daysRemaining,
                    minCommitmentToday: parseFloat(minCommitmentToday.toFixed(2)),
                    urgencyScore: (task.priority * 1.5) + (1 / daysRemaining)
                };
            });

        // Sort by urgency and deadline
        processedTasks.sort((a, b) => b.urgencyScore - a.urgencyScore || a.daysRemaining - b.daysRemaining);

        // Select tasks for today until dailyCapacity is reached
        const recommendedTasks = [];
        let allocatedHours = 0;

        for (const task of processedTasks) {
            if (allocatedHours + task.minCommitmentToday <= dailyCapacity) {
                recommendedTasks.push(task);
                allocatedHours += task.minCommitmentToday;
            } else if (allocatedHours < dailyCapacity) {
                // Add partial task if capacity remains
                const remainingSpace = dailyCapacity - allocatedHours;
                recommendedTasks.push({ ...task, partial: true, partialHours: remainingSpace });
                allocatedHours = dailyCapacity;
                break;
            }
        }

        return {
            recommendedTasks,
            metrics: {
                totalRequiredHoursToday: parseFloat(allocatedHours.toFixed(2)),
                capacityUsage: ((allocatedHours / dailyCapacity) * 100).toFixed(1),
                isOverloaded: allocatedHours > dailyCapacity
            }
        };
    }
};