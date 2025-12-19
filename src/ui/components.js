/**
 * components.js
 * Atomic UI elements for the SmartTask dashboard
 */

export const Components = {
    /**
     * Creates a sleek Task Card with conditional styling
     */
    TaskCard(task, onToggleComplete, onDelete) {
        const card = document.createElement('div');
        card.className = `task-card glass ${task.completed ? 'completed' : ''}`;
        
        // Visual indicator for urgency
        const urgencyColor = task.minCommitmentToday > 3 ? '#f87171' : '#38bdf8';
        card.style.borderLeft = `4px solid ${urgencyColor}`;

        card.innerHTML = `
            <div class="task-info">
                <h4>${task.title}</h4>
                <p>Focus: <strong>${task.minCommitmentToday}h</strong> today</p>
                <small>Deadline: ${new Date(task.deadline).toLocaleDateString()}</small>
            </div>
            <div class="task-actions">
                <button class="action-btn complete-btn">${task.completed ? '✓' : '○'}</button>
                <button class="action-btn delete-btn">✕</button>
            </div>
        `;

        // Event Listeners for testing interactivity
        card.querySelector('.complete-btn').onclick = () => onToggleComplete(task.id);
        card.querySelector('.delete-btn').onclick = () => onDelete(task.id);

        return card;
    },

    /**
     * Creates the "Empty State" when no tasks exist
     */
    EmptyState() {
        const div = document.createElement('div');
        div.className = 'empty-state';
        div.innerHTML = `
            <p>Your schedule is clear. Add a task to optimize your day.</p>
        `;
        return div;
    },

    /**
     * Renders a Progress Metric with color shifting
     */
    RenderBurnRate(hours, capacity) {
        const percentage = (hours / capacity) * 100;
        const color = percentage > 100 ? '#ef4444' : (percentage > 80 ? '#fbbf24' : '#38bdf8');
        
        return {
            color,
            width: `${Math.min(percentage, 100)}%`,
            text: `${hours} / ${capacity} hrs`
        };
    }
};