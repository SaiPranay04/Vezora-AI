/**
 * Workflow Automation Engine
 * Executes multi-step workflows and scheduled tasks
 */

import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { launchApplication } from '../controllers/appsController.js';
import { openFile } from '../controllers/filesController.js';
import { getGmailClient, getCalendarClient, isAuthenticated } from '../utils/googleAuth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WORKFLOWS_FILE = path.join(__dirname, '../data/workflows.json');

// Active cron jobs
const activeCronJobs = new Map();

/**
 * Load workflows from file
 */
async function loadWorkflows() {
  try {
    const data = await fs.readFile(WORKFLOWS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty
      await saveWorkflows({});
      return {};
    }
    throw error;
  }
}

/**
 * Save workflows to file
 */
async function saveWorkflows(workflows) {
  try {
    // Ensure data directory exists
    await fs.mkdir(path.dirname(WORKFLOWS_FILE), { recursive: true });
    await fs.writeFile(WORKFLOWS_FILE, JSON.stringify(workflows, null, 2));
  } catch (error) {
    console.error('❌ Error saving workflows:', error.message);
    throw error;
  }
}

/**
 * Execute a single workflow step
 */
async function executeStep(step) {
  try {
    console.log(`🔧 Executing step: ${step.action}`);
    
    switch (step.action) {
      case 'open_app':
        return await launchApplication(step.params.appName);
      
      case 'open_file':
        return await openFile(step.params.path);
      
      case 'check_email':
        if (await isAuthenticated()) {
          const gmail = await getGmailClient();
          const response = await gmail.users.messages.list({
            userId: 'me',
            maxResults: step.params.maxResults || 5,
            labelIds: ['INBOX']
          });
          return { success: true, count: response.data.messages?.length || 0 };
        }
        return { success: false, message: 'Not authenticated' };
      
      case 'check_calendar':
        if (await isAuthenticated()) {
          const calendar = await getCalendarClient();
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: today.toISOString(),
            timeMax: tomorrow.toISOString(),
            singleEvents: true,
            orderBy: 'startTime'
          });
          return { success: true, count: response.data.items?.length || 0 };
        }
        return { success: false, message: 'Not authenticated' };
      
      case 'wait':
        const delay = step.params.seconds || 1;
        await new Promise(resolve => setTimeout(resolve, delay * 1000));
        return { success: true, message: `Waited ${delay} seconds` };
      
      case 'notification':
        console.log(`🔔 Notification: ${step.params.message}`);
        return { success: true, message: step.params.message };
      
      default:
        return { success: false, message: `Unknown action: ${step.action}` };
    }
  } catch (error) {
    console.error(`❌ Step execution error:`, error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Execute entire workflow
 */
export async function executeWorkflow(workflowId) {
  try {
    const workflows = await loadWorkflows();
    const workflow = workflows[workflowId];
    
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }
    
    console.log(`🚀 Executing workflow: ${workflow.name}`);
    
    const results = [];
    
    for (const step of workflow.steps) {
      const result = await executeStep(step);
      results.push({
        step: step.action,
        description: step.description,
        result
      });
      
      // Stop if step failed and stopOnError is true
      if (!result.success && workflow.stopOnError) {
        console.log(`⚠️ Workflow stopped due to error in step: ${step.action}`);
        break;
      }
    }
    
    console.log(`✅ Workflow completed: ${workflow.name}`);
    
    return {
      success: true,
      workflowId,
      workflowName: workflow.name,
      results,
      executedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`❌ Workflow execution error:`, error.message);
    throw error;
  }
}

/**
 * Schedule workflow with cron
 */
export async function scheduleWorkflow(workflowId, cronExpression) {
  try {
    const workflows = await loadWorkflows();
    const workflow = workflows[workflowId];
    
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }
    
    // Stop existing job if running
    if (activeCronJobs.has(workflowId)) {
      activeCronJobs.get(workflowId).stop();
    }
    
    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      throw new Error('Invalid cron expression');
    }
    
    // Create cron job
    const job = cron.schedule(cronExpression, async () => {
      console.log(`⏰ Scheduled workflow triggered: ${workflow.name}`);
      await executeWorkflow(workflowId);
    });
    
    activeCronJobs.set(workflowId, job);
    
    // Update workflow with schedule
    workflow.schedule = cronExpression;
    workflow.isActive = true;
    workflows[workflowId] = workflow;
    await saveWorkflows(workflows);
    
    console.log(`📅 Workflow scheduled: ${workflow.name} (${cronExpression})`);
    
    return {
      success: true,
      workflowId,
      schedule: cronExpression
    };
  } catch (error) {
    console.error(`❌ Schedule error:`, error.message);
    throw error;
  }
}

/**
 * Unschedule workflow
 */
export async function unscheduleWorkflow(workflowId) {
  try {
    if (activeCronJobs.has(workflowId)) {
      activeCronJobs.get(workflowId).stop();
      activeCronJobs.delete(workflowId);
      
      const workflows = await loadWorkflows();
      if (workflows[workflowId]) {
        workflows[workflowId].isActive = false;
        await saveWorkflows(workflows);
      }
      
      return { success: true, message: 'Workflow unscheduled' };
    }
    
    return { success: false, message: 'Workflow not scheduled' };
  } catch (error) {
    console.error(`❌ Unschedule error:`, error.message);
    throw error;
  }
}

/**
 * Create new workflow
 */
export async function createWorkflow(workflowData) {
  try {
    const workflows = await loadWorkflows();
    const workflowId = `wf_${Date.now()}`;
    
    workflows[workflowId] = {
      id: workflowId,
      name: workflowData.name,
      description: workflowData.description || '',
      steps: workflowData.steps || [],
      schedule: workflowData.schedule || null,
      isActive: false,
      stopOnError: workflowData.stopOnError !== false,
      createdAt: new Date().toISOString()
    };
    
    await saveWorkflows(workflows);
    
    console.log(`✅ Workflow created: ${workflowData.name}`);
    
    return {
      success: true,
      workflowId,
      workflow: workflows[workflowId]
    };
  } catch (error) {
    console.error(`❌ Create workflow error:`, error.message);
    throw error;
  }
}

/**
 * Get all workflows
 */
export async function getAllWorkflows() {
  try {
    const workflows = await loadWorkflows();
    return Object.values(workflows);
  } catch (error) {
    console.error(`❌ Get workflows error:`, error.message);
    throw error;
  }
}

/**
 * Delete workflow
 */
export async function deleteWorkflow(workflowId) {
  try {
    // Stop if scheduled
    await unscheduleWorkflow(workflowId);
    
    const workflows = await loadWorkflows();
    delete workflows[workflowId];
    await saveWorkflows(workflows);
    
    return { success: true, message: 'Workflow deleted' };
  } catch (error) {
    console.error(`❌ Delete workflow error:`, error.message);
    throw error;
  }
}

/**
 * Initialize workflow engine on startup
 */
export async function initializeWorkflowEngine() {
  try {
    const workflows = await loadWorkflows();
    
    // Restore scheduled workflows
    for (const [workflowId, workflow] of Object.entries(workflows)) {
      if (workflow.isActive && workflow.schedule) {
        await scheduleWorkflow(workflowId, workflow.schedule);
        console.log(`📅 Restored scheduled workflow: ${workflow.name}`);
      }
    }
    
    console.log('✅ Workflow engine initialized');
  } catch (error) {
    console.error('❌ Workflow engine initialization error:', error.message);
  }
}
