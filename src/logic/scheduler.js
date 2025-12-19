/**
 * scheduler.js
 * The Optimization Engine: Handles Proportional Distribution & Priority Scoring
 */

export const Scheduler = {
    /**
     * Calculates the optimized workload for a specific target date.
     * @param {Array} tasks - All user tasks from storage
     * @param {number} dailyCapacity - Max hours per day
     * @param {Date} targetDate - The date being viewed/simulated
     */
    calculateDailySchedule(tasks, dailyCapacity, targetDate = new Date()) {
        // Normalize the targetDate to midnight for accurate day-diff calculation
        const viewDate = new Date(targetDate);
        viewDate.setHours(0, 0, 0, 0);

        let allocatedHours = 0;

        const processedTasks = tasks
            .filter(task => !task.completed)
            .map(task => {
                const deadline = new Date(task.deadline);
                deadline.setHours(0, 0, 0, 0);
                
                // Calculate days from the viewed date to the deadline
                const diffTime = deadline - viewDate;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                /**
                 * LOGIC:
                 * If diffDays is 0, the task is due today (full effort required).
                 * If diffDays is negative, it's overdue (full effort required).
                 * If diffDays is > 0, we distribute the effort over remaining days.
                 */
                const daysRemaining = diffDays <= 0 ? 1 : diffDays;
                
                // The minimum amount of work to stay on track for this specific date
                const minCommitmentToday = parseFloat((task.estimatedHours / daysRemaining).toFixed(2));

                return {
                    ...task,
                    daysRemaining,
                    minCommitmentToday,
                    // Urgency Score: Higher priority and closer deadlines rank higher
                    urgencyScore: (task.priority * 2) + (10 / (daysRemaining + 0.1)),
                    // Filter out tasks whose deadlines passed BEFORE the viewed date
                    isExpired: deadline < viewDate
                };
            })
            .filter(task => !task.isExpired); // Only show tasks relevant to this day or later

        // Sort by urgency so we fill the user's "Daily Capacity" with the most important work first
        processedTasks.sort((a, b) => b.urgencyScore - a.urgencyScore);

        const recommendedTasks = [];
        for (const task of processedTasks) {
            // Check if adding this task exceeds the work-life balance limit
            if (allocatedHours + task.minCommitmentToday <= dailyCapacity) {
                recommendedTasks.push(task);
                allocatedHours += task.minCommitmentToday;
            } else if (allocatedHours < dailyCapacity) {
                // Partial allocation: If we have 1 hour left but the task needs 2, 
                // we suggest doing the remaining 1 hour today.
                const remainingSpace = dailyCapacity - allocatedHours;
                if (remainingSpace > 0.25) { // Only add if it's more than 15 mins of work
                    recommendedTasks.push({ 
                        ...task, 
                        isPartial: true, 
                        partialHours: parseFloat(remainingSpace.toFixed(2)) 
                    });
                    allocatedHours += remainingSpace;
                }
                break; // Capacity reached
            }
        }

        return {
            recommendedTasks,
            metrics: {
                totalRequiredHoursToday: parseFloat(allocatedHours.toFixed(2)),
                capacityUsage: ((allocatedHours / dailyCapacity) * 100).toFixed(1),
                isOverloaded: allocatedHours >= dailyCapacity
            }
        };
    }
};