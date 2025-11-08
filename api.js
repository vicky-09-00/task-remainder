// Simple API simulation for Service Worker
// This simulates backend API endpoints for the service worker

class TaskReminderAPI {
  constructor() {
    this.reminders = new Map();
  }

  // Simulate API endpoints
  async getReminders() {
    // Return reminders from localStorage for simulation
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    return tasks.filter(task => !task.done);
  }

  async markReminderDone(reminderId) {
    // Update task in localStorage
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const task = tasks.find(t => t.id === parseInt(reminderId));
    if (task) {
      task.done = true;
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    return { success: true };
  }

  async snoozeReminder(reminderId, minutes) {
    // Update task time in localStorage
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const task = tasks.find(t => t.id === parseInt(reminderId));
    if (task) {
      const newTime = new Date();
      newTime.setMinutes(newTime.getMinutes() + minutes);
      task.time = newTime.toISOString();
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    return { success: true };
  }
}

// Export for use in service worker
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TaskReminderAPI;
} else {
  window.TaskReminderAPI = TaskReminderAPI;
}
