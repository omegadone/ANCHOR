import { Scheduler } from './logic/scheduler.js';
import { Storage } from './store/storage.js';
import { Theme } from './ui/theme.js';
import { Components } from './ui/components.js';

// --- GLOBAL STATE ---
const State = {
    viewingDate: new Date()
};
State.viewingDate.setHours(0, 0, 0, 0);

// --- CORE RENDER ENGINE ---
const render = () => {
    const tasks = Storage.getTasks();
    const settings = Storage.getSettings();
    
    // 1. Refresh the Date Navigator
    const header = document.querySelector('header');
    const existingNav = document.querySelector('.date-navigator');
    if (existingNav) existingNav.remove();
    
    const nav = Components.DateNavigator(State.viewingDate, (selectedDate) => {
        State.viewingDate = selectedDate;
        render(); // Recursive call to refresh view
    });
    header.after(nav);

    // 2. Calculate schedule for the active date
    const { recommendedTasks, metrics } = Scheduler.calculateDailySchedule(
        tasks, 
        settings.dailyCapacity, 
        State.viewingDate
    );

    // 3. Update Progress Metrics
    const burnRateEl = document.getElementById('burnRate');
    const loadBar = document.getElementById('loadBar');
    const statusMsg = document.getElementById('statusMessage');
    
    if (burnRateEl && loadBar) {
        const burnData = Components.RenderBurnRate(metrics.totalRequiredHoursToday, settings.dailyCapacity);
        burnRateEl.innerText = burnData.text;
        burnRateEl.style.color = burnData.color;
        loadBar.style.width = burnData.width;
        loadBar.style.backgroundColor = burnData.color;

        const isToday = State.viewingDate.getTime() === new Date().setHours(0,0,0,0);
        statusMsg.innerText = metrics.totalRequiredHoursToday > settings.dailyCapacity 
            ? "Warning: Over capacity for this day." 
            : `Schedule optimized for ${isToday ? 'Today' : State.viewingDate.toLocaleDateString()}.`;
    }

    // 4. Populate Task List
    const container = document.getElementById('dailyTasks');
    const listTitle = document.querySelector('.task-list-container h3');
    
    if (container) {
        container.innerHTML = '';
        listTitle.innerText = State.viewingDate.getTime() === new Date().setHours(0,0,0,0) 
            ? "Recommended for Today" 
            : `Projected for ${State.viewingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

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

// --- INTERACTION HANDLERS ---

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

const initListeners = () => {
    const taskForm = document.getElementById('taskForm');
    const dailyCapacityInput = document.getElementById('dailyCapacity');
    const settingsBtn = document.getElementById('settingsBtn');

    if (taskForm) {
        taskForm.onsubmit = (e) => {
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
            render();
        };
    }

    if (dailyCapacityInput) {
        dailyCapacityInput.oninput = (e) => {
            const val = parseInt(e.target.value);
            document.getElementById('capacityValue').innerText = `${val} hrs`;
            Storage.saveSettings({ dailyCapacity: val });
            render();
        };
    }

    if (settingsBtn) {
        settingsBtn.onclick = () => {
            document.getElementById('settingsPanel')?.classList.toggle('hidden');
            Theme.toggle();
        };
    }
};

// --- APP STARTUP ---
Theme.init();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initListeners();
        render();
    });
} else {
    initListeners();
    render();
}