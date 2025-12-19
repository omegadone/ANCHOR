/**
 * components.js
 * Atomic UI elements with integrated tracking controls.
 */
export const Components = {
    TaskCard(task, handlers) {
        const { onToggle, onDelete, onTimer, onManualEntry } = handlers;
        const card = document.createElement('div');
        card.className = `task-card glass ${task.completed ? 'completed' : ''} ${task.isTracking ? 'tracking-active' : ''}`;
        
        const urgencyColor = task.minCommitmentToday > 3 ? '#f87171' : '#38bdf8';
        card.style.borderLeft = `4px solid ${urgencyColor}`;

        card.innerHTML = `
            <div class="task-info">
                <h4>${task.title} ${task.isTracking ? '<span class="pulse-icon">●</span>' : ''}</h4>
                <div class="task-stats">
                    <span>Target: <strong>${task.minCommitmentToday}h</strong></span>
                    <span>Done: <strong>${(task.timeWorked || 0).toFixed(2)}h</strong></span>
                </div>
            </div>
            
            <div class="task-controls">
                <div class="tracking-group">
                    <button class="timer-btn btn-small">${task.isTracking ? 'Stop' : 'Start'}</button>
                    <div class="manual-box">
                        <input type="number" step="0.5" placeholder="+hrs" class="manual-input" id="man-${task.id}">
                        <button class="add-manual-btn">Add</button>
                    </div>
                </div>
                <div class="action-group" style="display: flex; gap: 5px; margin-top: 10px;">
                    <button class="complete-btn" style="flex:1;">${task.completed ? '✓' : '○'}</button>
                    <button class="delete-btn" style="flex:1;">✕</button>
                </div>
            </div>
        `;

        card.querySelector('.timer-btn').onclick = () => onTimer(task.id);
        card.querySelector('.add-manual-btn').onclick = () => {
            const input = document.getElementById(`man-${task.id}`);
            const val = parseFloat(input.value);
            if (val > 0) { onManualEntry(task.id, val); input.value = ''; }
        };
        card.querySelector('.complete-btn').onclick = () => onToggle(task.id);
        card.querySelector('.delete-btn').onclick = () => onDelete(task.id);

        return card;
    },

    DateNavigator(currentDate, onDateChange) {
        const nav = document.createElement('div');
        nav.className = 'date-navigator glass';
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            date.setHours(0,0,0,0);
            const isSelected = date.getTime() === currentDate.getTime();
            const dayBtn = document.createElement('div');
            dayBtn.className = `date-item ${isSelected ? 'active' : ''}`;
            dayBtn.innerHTML = `<span class="day-name">${date.toLocaleDateString('en-US', { weekday: 'short' })}</span><span class="day-num">${date.getDate()}</span>`;
            dayBtn.onclick = () => onDateChange(date);
            nav.appendChild(dayBtn);
        }
        return nav;
    },

    RenderBurnRate(hours, capacity) {
        const percentage = (hours / capacity) * 100;
        const color = percentage > 100 ? '#f87171' : (percentage > 80 ? '#fbbf24' : '#38bdf8');
        return { color, width: `${Math.min(percentage, 100)}%`, text: `${hours.toFixed(1)} / ${capacity} hrs` };
    },

    EmptyState() {
        const div = document.createElement('div');
        div.className = 'empty-state';
        div.style.textAlign = 'center';
        div.style.padding = '40px';
        div.innerHTML = `<p style="opacity:0.6;">No tasks scheduled for this date.</p>`;
        return div;
    }
};