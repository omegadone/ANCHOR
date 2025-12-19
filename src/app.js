import { Scheduler } from './logic/scheduler.js';
import { Storage } from './store/storage.js';
import { Theme } from './ui/theme.js';
import { Components } from './ui/components.js';

const State = { viewingDate: new Date() };
State.viewingDate.setHours(0,0,0,0);

// Update UI every minute if a timer is active
setInterval(() => {
    const tasks = Storage.getTasks();
    if (tasks.some(t => t.isTracking)) render();
}, 60000);

const render = () => {
    const tasks = Storage.getTasks();
    const settings = Storage.getSettings();

    // 1. Calculate live time for any active timers
    const liveTasks = tasks.map(t => {
        if (t.isTracking && t.timerStartedAt) {
            const elapsedHours = (Date.now() - t.timerStartedAt) / (1000 * 60 * 60);
            return { ...t, timeWorked: (t.accumulatedTime || 0) + elapsedHours };
        }
        return t;
    });

    // 2. Refresh Date Navigator
    const header = document.querySelector('header');
    document.querySelector('.date-navigator')?.remove();
    header.after(Components.DateNavigator(State.viewingDate, (d) => { State.viewingDate = d; render(); }));

    // 3. Process Schedule
    const { recommendedTasks, metrics } = Scheduler.calculateDailySchedule(liveTasks, settings.dailyCapacity, State.viewingDate);

    // 4. Update Header Metrics
    const burnData = Components.RenderBurnRate(metrics.totalRequiredHoursToday, settings.dailyCapacity);
    const loadBar = document.getElementById('loadBar');
    if (loadBar) {
        loadBar.style.width = burnData.width;
        loadBar.style.backgroundColor = burnData.color;
        document.getElementById('burnRate').innerText = burnData.text;
    }

    // 5. Update Task List
    const container = document.getElementById('dailyTasks');
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
};

const handleTimer = (id) => {
    const tasks = Storage.getTasks().map(t => {
        if (t.id === id) {
            if (!t.isTracking) return { ...t, isTracking: true, timerStartedAt: Date.now(), accumulatedTime: t.timeWorked || 0 };
            const elapsed = (Date.now() - t.timerStartedAt) / (1000 * 60 * 60);
            const total = (t.accumulatedTime || 0) + elapsed;
            return { ...t, isTracking: false, timeWorked: total, accumulatedTime: total, timerStartedAt: null };
        }
        return t.isTracking ? { ...t, isTracking: false, timeWorked: (t.accumulatedTime || 0) + ((Date.now() - t.timerStartedAt) / (1000 * 60 * 60)), accumulatedTime: (t.accumulatedTime || 0) + ((Date.now() - t.timerStartedAt) / (1000 * 60 * 60)), timerStartedAt: null } : t;
    });
    Storage.saveTasks(tasks);
    render();
};

const handleManual = (id, hrs) => {
    const tasks = Storage.getTasks().map(t => t.id === id ? { ...t, timeWorked: (t.timeWorked || 0) + hrs, accumulatedTime: (t.timeWorked || 0) + hrs } : t);
    Storage.saveTasks(tasks);
    render();
};

const handleToggle = (id) => {
    const tasks = Storage.getTasks().map(t => t.id === id ? { ...t, completed: !t.completed, isTracking: false } : t);
    Storage.saveTasks(tasks);
    render();
};

const handleDelete = (id) => {
    Storage.saveTasks(Storage.getTasks().filter(t => t.id !== id));
    render();
};

// Initial Setup
Theme.init();
document.getElementById('taskForm').onsubmit = (e) => {
    e.preventDefault();
    const tasks = Storage.getTasks();
    tasks.push({
        id: Date.now(),
        title: document.getElementById('taskTitle').value,
        estimatedHours: parseFloat(document.getElementById('taskHours').value),
        priority: parseInt(document.getElementById('taskPriority').value),
        deadline: document.getElementById('taskDeadline').value,
        timeWorked: 0,
        accumulatedTime: 0,
        completed: false
    });
    Storage.saveTasks(tasks);
    e.target.reset();
    render();
};

document.getElementById('dailyCapacity').oninput = (e) => {
    Storage.saveSettings({ dailyCapacity: parseInt(e.target.value) });
    document.getElementById('capacityValue').innerText = `${e.target.value} hrs`;
    render();
};

render();