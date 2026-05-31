import cron from 'node-cron';
import notifier from 'node-notifier';
import { getUpcomingDeadlines, getOverdueTasks } from './taskService.js';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || './data';
const NOTIFIED_CACHE_FILE = path.join(DATA_DIR, 'notified-tasks.json');

// Memory cache of task IDs we've already notified the user about
let notifiedTasks = { upcoming: [], overdue: [] };

async function loadNotifiedCache() {
  try {
    const data = await fs.readFile(NOTIFIED_CACHE_FILE, 'utf8');
    notifiedTasks = JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await saveNotifiedCache();
    }
  }
}

async function saveNotifiedCache() {
  try {
    await fs.writeFile(NOTIFIED_CACHE_FILE, JSON.stringify(notifiedTasks), 'utf8');
  } catch (error) {
    console.error('❌ Failed to save notified cache:', error.message);
  }
}

/**
 * Initializes the Local Reminder service using node-cron
 */
export async function initializeReminders() {
  console.log('⏰ Starting background reminder service...');
  await loadNotifiedCache();

  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      // Typically user_id is the default one or extracted from active sessions. 
      // For local desktop mode, we use 'default' globally.
      const userId = 'default';
      
      const upcoming = await getUpcomingDeadlines(userId, 1); // Next 1 day
      const overdue = await getOverdueTasks(userId);
      
      let needsSave = false;
      const now = new Date();

      // Check Upcoming
      for (const task of upcoming) {
        if (!notifiedTasks.upcoming.includes(task.id)) {
          // Push local desktop notification
          notifier.notify({
            title: '📆 Zara Reminder: Upcoming Task',
            message: `${task.title} is due today!`,
            appID: 'Vezora AI',
            sound: true
          });
          console.log(`🔔 [REMINDER] Notified user about upcoming task: ${task.title}`);
          notifiedTasks.upcoming.push(task.id);
          needsSave = true;
        }
      }

      // Check Overdue
      for (const task of overdue) {
        if (!notifiedTasks.overdue.includes(task.id)) {
          // Push local desktop warning notification
          notifier.notify({
            title: '⚠️ Zara Alert: Task Overdue',
            message: `${task.title} is past its deadline.`,
            appID: 'Vezora AI',
            sound: true
          });
          console.log(`🔔 [REMINDER] Notified user about overdue task: ${task.title}`);
          notifiedTasks.overdue.push(task.id);
          needsSave = true;
        }
      }

      if (needsSave) {
        await saveNotifiedCache();
      }

    } catch (error) {
      console.error('❌ [REMINDER] Error checking tasks:', error.message);
    }
  });

  console.log('✅ Local reminder cron job installed');
}

export default { initializeReminders };
