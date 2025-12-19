import { Scheduler } from './logic/scheduler.js';
import { Storage } from './store/storage.js';
import { Theme } from './ui/theme.js';
import { Components } from './ui/components.js';

// Initialize Theme
Theme.init();

const render = () => {
    const tasks = Storage.getTasks();
    const { dailyCapacity } = Storage.getSettings();
    const { recommendedTasks, metrics } = Scheduler.calculateDailySchedule(tasks, dailyCapacity);

    // 1. Update Burn Rate UI
    const burnData = Components.RenderBurnRate(metrics.totalRequiredHoursToday, dailyCapacity);
    const burnRateEl = document.getElementById('burnRate');
    const loadBar = document.getElementById('loadBar');
    
    burnRateEl.innerText = burnData.text;
    burnRateEl.style.color = burnData.color;
    loadBar.style.width = burnData.width;
    loadBar.style.backgroundColor = burnData.color;

    // 2. Update Task List
    const container = document.getElementById('dailyTasks');
    container.innerHTML = ''; // Clear current

    if (recommendedTasks.length === 0) {
        container.appendChild(Components.EmptyState());
    } else {
        recommendedTasks.forEach(task => {
            const card = Components.TaskCard(
                task, 
                (id) => handleToggleTask(id), 
                (id) => handleDeleteTask(id)
            );
            container.appendChild(card);
        });
    }
};

// Interaction Handlers
const handleToggleTask = (id) => {
    const tasks = Storage.getTasks().map(t => t.id === id ? {...t, completed: !t.completed} : t);
    Storage.saveTasks(tasks);
    render();
};

const handleDeleteTask = (id) => {
    const tasks = Storage.getTasks().filter(t => t.id !== id);
    Storage.saveTasks(tasks);
    render();
};

// Settings Toggle Testing
document.getElementById('settingsBtn').onclick = () => Theme.toggle();

// Initial Render
render();