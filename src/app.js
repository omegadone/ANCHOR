import { Scheduler } from './logic/scheduler.js';
import { Storage } from './store/storage.js';
import { Theme } from './ui/theme.js';
import { Components } from './ui/components.js';

// --- INITIALIZATION ---
Theme.init();

const taskForm = document.getElementById('taskForm');
const dailyCapacityInput = document.getElementById('dailyCapacity');
const capacityValue = document.getElementById('capacityValue');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');

/**
 * The "Single Source of Truth" for the UI state.
 * This replaces 'updateUI' to match the new component architecture.
 */
const render = () => {
    const tasks = Storage.getTasks();
    const settings = Storage.getSettings();
    
    // Calculate the optimized schedule
    const { recommendedTasks, metrics } = Scheduler.calculateDailySchedule(tasks, settings.dailyCapacity);

    // 1. Update the Metric Displays
    const burnRateEl = document.getElementById('burnRate');
    const loadBar = document.getElementById('loadBar');
    
    if (burnRateEl && loadBar) {
        const burnData = Components.RenderBurnRate(metrics.totalRequiredHoursToday, settings.dailyCapacity);
        burnRateEl.innerText = burnData.text;
        burnRateEl.style.color = burnData.color;
        loadBar.style.width = burnData.width;
        loadBar.style.backgroundColor = burnData.color;
    }

    // 2. Update the Task List
    const container = document.getElementById('dailyTasks');
    if (container) {
        container.innerHTML = ''; 
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
    }
};

// --- EVENT HANDLERS ---

// Task Form Submission
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
            completed: false
        };

        tasks.push(newTask);
        Storage.saveTasks(tasks);
        taskForm.reset();
        render(); // Trigger re-draw
    });
}

// Slider Logic
if (dailyCapacityInput) {
    dailyCapacityInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (capacityValue) capacityValue.innerText = `${val} hrs`;
        Storage.saveSettings({ dailyCapacity: val });
        render(); // Re-calculate schedule in real-time
    });
}

// UI Toggles
if (settingsBtn) {
    settingsBtn.onclick = () => {
        settingsPanel?.classList.toggle('hidden');
        Theme.toggle();
    };
}

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

// Initial Start
render();