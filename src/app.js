import { Scheduler } from './logic/scheduler.js';
import { Storage } from './store/storage.js';
import { Theme } from './ui/theme.js';
import { Components } from './ui/components.js';

// --- GLOBAL STATE ---
const State = { 
    viewingDate: new Date() 
};
State.viewingDate.setHours(0,0,0,0);

/**
 * CORE RENDER ENGINE
 * Wrapped in a try-catch to prevent silent failures
 */
const render = () => {
    try {
        const tasks = Storage.getTasks() || [];
        const settings = Storage.getSettings() || { dailyCapacity: 8 };
        const capacity = settings.dailyCapacity || 8;

        // 1. Update Live Time for active timers
        const liveTasks = tasks.map(t => {
            if (t.isTracking && t.timerStartedAt) {
                const elapsedHours = (Date.now() - t.timerStartedAt) / (1000 * 60 * 60);
                return { ...t, timeWorked: (t.accumulatedTime || 0) + elapsedHours };
            }
            return t;
        });

        // 2. Date Navigator
        const header = document.querySelector('header');
        if (header) {
            document.querySelector('.date-navigator')?.remove();
            header.after(Components.DateNavigator(State.viewingDate, (d) => { 
                State.viewingDate = d; 
                render(); 
            }));
        }

        // 3. Run Scheduling Logic
        const { recommendedTasks, metrics } = Scheduler.calculateDailySchedule(liveTasks, capacity, State.viewingDate);

        // 4. Update Progress Bar & Metrics
        const burnRateEl = document.getElementById('burnRate');
        const loadBar = document.getElementById('loadBar');
        if (burnRateEl && loadBar) {
            const burnData = Components.RenderBurnRate(metrics.totalRequiredHoursToday, capacity);
            loadBar.style.width = burnData.width;
            loadBar.style.backgroundColor = burnData.color;
            burnRateEl.innerText = burnData.text;
        }

        // 5. Populate Task List
        const container = document.getElementById('dailyTasks');
        if (container) {
            container.innerHTML = '';
            if (recommendedTasks.length === 0) {
                container.appendChild(Components.EmptyState());
            } else {
                recommendedTasks.forEach(task => {
                    container.appendChild(Components.TaskCard(task, {
                        onToggle: handleToggle,
                        onDelete: handleDelete,
                        onTimer: handleTimer,
                        onManualEntry: handleManual
                    }));
                });
            }
        }
    } catch (error) {
        console.error("Render Error:", error);
    }
};

// --- ACTION HANDLERS ---

const handleTimer = (id) => {
    const tasks = Storage.getTasks().map(t => {
        if (t.id === id) {
            if (!t.isTracking) {
                return { ...t, isTracking: true, timerStartedAt: Date.now(), accumulatedTime: t.timeWorked || 0 };
            } else {
                const elapsed = (Date.now() - t.timerStartedAt) / (1000 * 60 * 60);
                const total = (t.accumulatedTime || 0) + elapsed;
                return { ...t, isTracking: false, timeWorked: total, accumulatedTime: total, timerStartedAt: null };
            }
        }
        // Multi-tasking prevention: Stop other timers
        if (t.isTracking) {
            const elapsed = (Date.now() - t.timerStartedAt) / (1000 * 60 * 60);
            const total = (t.accumulatedTime || 0) + elapsed;
            return { ...t, isTracking: false, timeWorked: total, accumulatedTime: total, timerStartedAt: null };
        }
        return t;
    });
    Storage.saveTasks(tasks);
    render();
};

const handleManual = (id, hrs) => {
    const tasks = Storage.getTasks().map(t => 
        t.id === id ? { ...t, timeWorked: (t.timeWorked || 0) + hrs, accumulatedTime: (t.timeWorked || 0) + hrs } : t
    );
    Storage.saveTasks(tasks);
    render();
};

const handleToggle = (id) => {
    const tasks = Storage.getTasks().map(t => 
        t.id === id ? { ...t, completed: !t.completed, isTracking: false } : t
    );
    Storage.saveTasks(tasks);
    render();
};

const handleDelete = (id) => {
    const tasks = Storage.getTasks().filter(t => t.id !== id);
    Storage.saveTasks(tasks);
    render();
};

/**
 * INITIALIZATION LOGIC
 * Wrapped in DOMContentLoaded to ensure HTML elements exist before we touch them.
 */
const init = () => {
    Theme.init();

    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const tasks = Storage.getTasks();
            const newTask = {
                id: Date.now(),
                title: document.getElementById('taskTitle').value,
                estimatedHours: parseFloat(document.getElementById('taskHours').value),
                priority: parseInt(document.getElementById('taskPriority').value),
                deadline: document.getElementById('taskDeadline').value,
                timeWorked: 0,
                accumulatedTime: 0,
                completed: false,
                isTracking: false
            };
            tasks.push(newTask);
            Storage.saveTasks(tasks);
            taskForm.reset();
            render();
        });
    }

    const capacitySlider = document.getElementById('dailyCapacity');
    if (capacitySlider) {
        capacitySlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            Storage.saveSettings({ dailyCapacity: val });
            const label = document.getElementById('capacityValue');
            if (label) label.innerText = `${val} hrs`;
            render();
        });
    }

    // Refresh display every minute for active timers
    setInterval(() => {
        const tasks = Storage.getTasks();
        if (tasks.some(t => t.isTracking)) render();
    }, 60000);

    render();
};

// Start the app safely
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}