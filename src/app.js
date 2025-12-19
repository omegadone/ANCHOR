import { Scheduler } from './logic/scheduler.js';
import { Storage } from './store/storage.js';
import { Theme } from './ui/theme.js';
import { Components } from './ui/components.js';

const State = { viewingDate: new Date() };
State.viewingDate.setHours(0,0,0,0);

const render = () => {
    try {
        const tasks = Storage.getTasks();
        const settings = Storage.getSettings();
        
        const liveTasks = tasks.map(t => {
            if (t.isTracking && t.timerStartedAt) {
                const elapsedHours = (Date.now() - t.timerStartedAt) / (1000 * 60 * 60);
                return { ...t, timeWorked: (t.accumulatedTime || 0) + elapsedHours };
            }
            return t;
        });

        // Update Date Nav
        const header = document.querySelector('header');
        if (header) {
            document.querySelector('.date-navigator')?.remove();
            header.after(Components.DateNavigator(State.viewingDate, (d) => { 
                State.viewingDate = d; 
                render(); 
            }));
        }

        const { recommendedTasks, metrics } = Scheduler.calculateDailySchedule(liveTasks, settings.dailyCapacity, State.viewingDate);

        // Update Metrics
        const burnRateEl = document.getElementById('burnRate');
        const loadBar = document.getElementById('loadBar');
        if (burnRateEl && loadBar) {
            const burnData = Components.RenderBurnRate(metrics.totalRequiredHoursToday, settings.dailyCapacity);
            loadBar.style.width = burnData.width;
            loadBar.style.backgroundColor = burnData.color;
            burnRateEl.innerText = burnData.text;
        }

        const container = document.getElementById('dailyTasks');
        if (container) {
            container.innerHTML = '<h3>Recommended for Today</h3>';
            if (recommendedTasks.length === 0) {
                container.appendChild(Components.EmptyState());
            } else {
                recommendedTasks.forEach(task => {
                    container.appendChild(Components.TaskCard(task, {
                        onToggle: (id) => {
                            const updated = Storage.getTasks().map(t => t.id === id ? { ...t, completed: !t.completed, isTracking: false } : t);
                            Storage.saveTasks(updated); render();
                        },
                        onDelete: (id) => {
                            Storage.saveTasks(Storage.getTasks().filter(t => t.id !== id)); render();
                        },
                        onTimer: handleTimer,
                        onManualEntry: (id, hrs) => {
                            const updated = Storage.getTasks().map(t => t.id === id ? { ...t, timeWorked: (t.timeWorked || 0) + hrs, accumulatedTime: (t.timeWorked || 0) + hrs } : t);
                            Storage.saveTasks(updated); render();
                        }
                    }));
                });
            }
        }
    } catch (e) { console.error("Render Error:", e); }
};

const handleTimer = (id) => {
    const tasks = Storage.getTasks().map(t => {
        if (t.id === id) {
            if (!t.isTracking) return { ...t, isTracking: true, timerStartedAt: Date.now(), accumulatedTime: t.timeWorked || 0 };
            const elapsed = (Date.now() - t.timerStartedAt) / (1000 * 60 * 60);
            return { ...t, isTracking: false, timeWorked: (t.accumulatedTime || 0) + elapsed, accumulatedTime: (t.accumulatedTime || 0) + elapsed, timerStartedAt: null };
        }
        return t.isTracking ? { ...t, isTracking: false, timeWorked: (t.accumulatedTime || 0) + ((Date.now() - t.timerStartedAt) / (1000 * 60 * 60)), accumulatedTime: (t.accumulatedTime || 0) + ((Date.now() - t.timerStartedAt) / (1000 * 60 * 60)), timerStartedAt: null } : t;
    });
    Storage.saveTasks(tasks); render();
};

const init = () => {
    Theme.init();

    // Independent Theme Toggle
    document.getElementById('themeToggle')?.addEventListener('click', () => Theme.toggle());

    // Settings Panel Toggle
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
        document.getElementById('settingsPanel')?.classList.toggle('hidden');
    });

    // Task Submission
    document.getElementById('taskForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const tasks = Storage.getTasks();
        tasks.push({
            id: Date.now(),
            title: document.getElementById('taskTitle').value,
            estimatedHours: parseFloat(document.getElementById('taskHours').value),
            priority: parseInt(document.getElementById('taskPriority').value),
            deadline: document.getElementById('taskDeadline').value,
            timeWorked: 0, accumulatedTime: 0, completed: false, isTracking: false
        });
        Storage.saveTasks(tasks);
        e.target.reset();
        render();
    });

    // Capacity Slider
    document.getElementById('dailyCapacity')?.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        Storage.saveSettings({ dailyCapacity: val });
        document.getElementById('capacityValue').innerText = `${val} hrs`;
        render();
    });

    setInterval(() => { if (Storage.getTasks().some(t => t.isTracking)) render(); }, 60000);
    render();
};

document.addEventListener('DOMContentLoaded', init);