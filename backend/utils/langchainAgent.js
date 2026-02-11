/**
 * LangChain Agent - AI Tool Orchestrator
 * Coordinates AI with Gmail, Calendar, Search, Files, and Apps
 */

import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { getGmailClient, getCalendarClient, isAuthenticated } from './googleAuth.js';
import { generateGeminiCompletion, isGeminiAvailable } from './geminiClient.js';
import { launchApplication } from '../controllers/appsController.js';
import { openFile, saveFile } from '../controllers/filesController.js';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL_NAME || 'mistral:latest';

/**
 * Create LangChain-compatible LLM
 */
function createLLM() {
  // Simple wrapper that uses our existing AI clients
  return {
    invoke: async (messages) => {
      const useGemini = process.env.AI_PROVIDER === 'gemini' && isGeminiAvailable();
      
      if (useGemini) {
        const response = await generateGeminiCompletion(messages);
        return { content: response };
      } else {
        // Use Ollama via our client
        const { generateChatCompletion } = await import('./ollamaClient.js');
        const response = await generateChatCompletion(messages);
        return { content: response.response };
      }
    }
  };
}

/**
 * Gmail Tool - Read and send emails
 */
const gmailTool = new DynamicStructuredTool({
  name: 'gmail',
  description: `Read inbox, search emails, or send emails. 
  - For reading inbox: use action='inbox'
  - For searching: use action='search' with query
  - For sending: use action='send' with to, subject, and query (email body)
  Extract email parameters from user's request carefully.`,
  schema: z.object({
    action: z.enum(['inbox', 'search', 'send']).describe('inbox to read emails, search to find emails, send to compose and send an email'),
    query: z.string().optional().describe('For search: search terms. For send: the email body/message content. Extract the message content from user request.'),
    to: z.string().optional().describe('For send action: recipient email address. Extract from "to", "send to", "email to" in user request.'),
    subject: z.string().optional().describe('For send action: email subject line. Extract from "subject", "about", "with subject" in user request.')
  }),
  func: async ({ action, query, to, subject }) => {
    try {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        return 'Error: Not authenticated with Google. User needs to authenticate first.';
      }
      
      const gmail = await getGmailClient();
      
      if (action === 'inbox') {
        const response = await gmail.users.messages.list({
          userId: 'me',
          maxResults: 3,
          labelIds: ['INBOX']
        });
        
        const messages = response.data.messages || [];
        
        if (messages.length === 0) {
          return 'No emails found in inbox.';
        }
        
        // Fetch details for each message
        const emailDetails = await Promise.all(
          messages.map(async (msg) => {
            const details = await gmail.users.messages.get({
              userId: 'me',
              id: msg.id,
              format: 'metadata',
              metadataHeaders: ['From', 'Subject', 'Date']
            });
            
            const headers = details.data.payload.headers;
            const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
            const subject = headers.find(h => h.name === 'Subject')?.value || 'No subject';
            const date = headers.find(h => h.name === 'Date')?.value || '';
            
            return { from, subject, date };
          })
        );
        
        // Format the response
        const formatted = emailDetails.map((email, i) => 
          `${i + 1}. Subject: ${email.subject}\n   From: ${email.from}\n   Date: ${email.date}`
        ).join('\n\n');
        
        return `Here are the last ${messages.length} emails from your inbox:\n\n${formatted}`;
      }
      
      if (action === 'search') {
        const response = await gmail.users.messages.list({
          userId: 'me',
          q: query,
          maxResults: 5
        });
        
        const messages = response.data.messages || [];
        return `Found ${messages.length} emails matching "${query}".`;
      }
      
      if (action === 'send') {
        console.log('📧 Send email params:', { to, subject, body: query });
        
        if (!to || !subject || !query) {
          const missing = [];
          if (!to) missing.push('recipient email');
          if (!subject) missing.push('subject');
          if (!query) missing.push('email body');
          return `Error: Missing required fields: ${missing.join(', ')}. Please provide the recipient email, subject, and message body.`;
        }
        
        const messageParts = [
          `To: ${to}`,
          `Subject: ${subject}`,
          'Content-Type: text/html; charset=utf-8',
          '',
          query
        ].join('\n');
        
        const encodedMessage = Buffer.from(messageParts)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        
        const result = await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw: encodedMessage }
        });
        
        console.log('✅ Email sent successfully, ID:', result.data.id);
        return `✅ Email sent successfully to ${to} with subject "${subject}"!`;
      }
      
      return 'Unknown action';
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
});

/**
 * Calendar Tool - Manage calendar events
 */
const calendarTool = new DynamicStructuredTool({
  name: 'calendar',
  description: 'Check calendar, create events, or schedule meetings. Use when user asks about their schedule or wants to create an event.',
  schema: z.object({
    action: z.enum(['list', 'today', 'create']).describe('Action to perform'),
    title: z.string().optional().describe('Event title (for create)'),
    start: z.string().optional().describe('Start time ISO string (for create)'),
    end: z.string().optional().describe('End time ISO string (for create)')
  }),
  func: async ({ action, title, start, end }) => {
    try {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        return 'Error: Not authenticated with Google. User needs to authenticate first.';
      }
      
      const calendar = await getCalendarClient();
      
      if (action === 'today') {
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
        
        const events = response.data.items || [];
        
        if (events.length === 0) {
          return 'You have no events scheduled for today.';
        }
        
        const formatted = events.map((event, i) => {
          const startTime = event.start.dateTime || event.start.date;
          const time = event.start.dateTime 
            ? new Date(startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            : 'All day';
          const recurring = event.recurringEventId ? ' (Recurring)' : '';
          return `${i + 1}. ${event.summary}${recurring}\n   Time: ${time}\n   Location: ${event.location || 'No location'}`;
        }).join('\n\n');
        
        return `You have ${events.length} event(s) today:\n\n${formatted}`;
      }
      
      if (action === 'list') {
        const response = await calendar.events.list({
          calendarId: 'primary',
          timeMin: new Date().toISOString(),
          maxResults: 10,
          singleEvents: true,
          orderBy: 'startTime'
        });
        
        const events = response.data.items || [];
        
        if (events.length === 0) {
          return 'You have no upcoming events scheduled.';
        }
        
        // Remove duplicate events by title and date
        const uniqueEvents = [];
        const seenEvents = new Set();
        
        for (const event of events) {
          const startTime = event.start.dateTime || event.start.date;
          const eventKey = `${event.summary}-${new Date(startTime).toDateString()}`;
          
          if (!seenEvents.has(eventKey)) {
            seenEvents.add(eventKey);
            uniqueEvents.push(event);
            if (uniqueEvents.length >= 5) break; // Limit to 5 unique events
          }
        }
        
        const formatted = uniqueEvents.map((event, i) => {
          const startTime = event.start.dateTime || event.start.date;
          const date = new Date(startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
          const time = event.start.dateTime ? new Date(startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'All day';
          const recurring = event.recurringEventId ? ' (Recurring)' : '';
          return `${i + 1}. ${event.summary}${recurring}\n   Date: ${date}\n   Time: ${time}`;
        }).join('\n\n');
        
        return `Here are your upcoming events:\n\n${formatted}`;
      }
      
      if (action === 'create') {
        if (!title || !start || !end) {
          return 'Error: Missing required fields for creating event (title, start, end).';
        }
        
        const event = {
          summary: title,
          start: { dateTime: start, timeZone: 'UTC' },
          end: { dateTime: end, timeZone: 'UTC' }
        };
        
        const response = await calendar.events.insert({
          calendarId: 'primary',
          resource: event
        });
        
        return `Event "${title}" created successfully for ${start}.`;
      }
      
      return 'Unknown action';
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
});

/**
 * Web Search Tool - Search the internet
 */
const searchTool = new DynamicStructuredTool({
  name: 'web_search',
  description: 'Search the web for current information, news, or facts. Use when user asks about current events or needs up-to-date information.',
  schema: z.object({
    query: z.string().describe('Search query')
  }),
  func: async ({ query }) => {
    try {
      const useGeminiGrounding = process.env.ENABLE_GEMINI_GROUNDING === 'true' && isGeminiAvailable();
      
      if (!useGeminiGrounding) {
        return 'Error: Web search not enabled. Set ENABLE_GEMINI_GROUNDING=true in .env';
      }
      
      const messages = [
        { role: 'user', content: `Search the web and briefly answer: ${query}` }
      ];
      
      const answer = await generateGeminiCompletion(messages);
      return answer;
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
});

/**
 * App Launcher Tool - Launch applications
 */
const appLauncherTool = new DynamicStructuredTool({
  name: 'launch_app',
  description: 'Launch desktop applications like Chrome, VS Code, Notepad, Calculator, etc. Use when user asks to open an app.',
  schema: z.object({
    appName: z.string().describe('Name of the application to launch (chrome, code, notepad, calculator, etc.)')
  }),
  func: async ({ appName }) => {
    try {
      if (process.env.ENABLE_APP_LAUNCH !== 'true') {
        return 'Error: App launching is disabled. Enable ENABLE_APP_LAUNCH in .env';
      }
      
      const result = await launchApplication(appName);
      return result.success ? `Launched ${appName} successfully.` : `Failed to launch ${appName}: ${result.message}`;
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
});

/**
 * File System Tool - Read/write files
 */
const fileSystemTool = new DynamicStructuredTool({
  name: 'file_system',
  description: 'Open, read, or save files. Use when user wants to work with files.',
  schema: z.object({
    action: z.enum(['open', 'save']).describe('Action to perform'),
    path: z.string().describe('File path'),
    content: z.string().optional().describe('Content to save (for save action)')
  }),
  func: async ({ action, path, content }) => {
    try {
      if (process.env.ENABLE_FILE_SYSTEM !== 'true') {
        return 'Error: File system access is disabled. Enable ENABLE_FILE_SYSTEM in .env';
      }
      
      if (action === 'open') {
        const result = await openFile(path);
        return result.success ? `Opened file: ${path}` : `Failed to open file: ${result.message}`;
      }
      
      if (action === 'save') {
        if (!content) {
          return 'Error: Content is required for saving files.';
        }
        
        const result = await saveFile(path, content);
        return result.success ? `Saved file: ${path}` : `Failed to save file: ${result.message}`;
      }
      
      return 'Unknown action';
    } catch (error) {
      return `Error: ${error.message}`;
    }
  }
});

/**
 * Get all available tools
 */
export function getTools() {
  return [
    gmailTool,
    calendarTool,
    searchTool,
    appLauncherTool,
    fileSystemTool
  ];
}

/**
 * Execute agent with tools
 * @param {string} userMessage - User's message/request
 * @returns {string} - Agent's response
 */
export async function executeAgent(userMessage) {
  try {
    const llm = createLLM();
    const tools = getTools();
    
    // Simple agent logic: determine which tool to use based on message
    const lowerMessage = userMessage.toLowerCase();
    
    // Email-related
    if (lowerMessage.includes('email') || lowerMessage.includes('inbox') || lowerMessage.includes('send') || lowerMessage.includes('mail')) {
      console.log('📧 Email query detected:', userMessage);
      const action = lowerMessage.includes('send') ? 'send' : lowerMessage.includes('search') ? 'search' : 'inbox';
      console.log('📧 Using action:', action);
      
      let params = { action, query: userMessage };
      
      // Extract email parameters for send action
      if (action === 'send') {
        // Extract recipient email (to)
        const toMatch = userMessage.match(/(?:to|email)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
        if (toMatch) params.to = toMatch[1];
        
        // Extract subject
        const subjectMatch = userMessage.match(/(?:subject|about|titled?)\s+["']?([^"']+?)["']?(?:\s+(?:saying|with body|body|and)|$)/i);
        if (subjectMatch) params.subject = subjectMatch[1].trim();
        
        // Extract body message
        const bodyMatch = userMessage.match(/(?:saying|body|with body|message|text)\s+["']?(.+?)["']?$/i);
        if (bodyMatch) {
          params.query = bodyMatch[1].trim();
        } else {
          // Try to extract body after "and" or after subject
          const andMatch = userMessage.match(/(?:and|,)\s+["']?(.+?)["']?$/i);
          if (andMatch) params.query = andMatch[1].trim();
        }
        
        console.log('📧 Extracted params:', params);
      }
      
      const result = await gmailTool.func(params);
      console.log('📧 Gmail tool result:', result);
      return result;
    }
    
    // Calendar-related
    if (lowerMessage.includes('calendar') || lowerMessage.includes('schedule') || lowerMessage.includes('meeting') || lowerMessage.includes('event')) {
      console.log('📅 Calendar query detected:', lowerMessage);
      const action = lowerMessage.includes('today') ? 'today' : lowerMessage.includes('create') ? 'create' : 'list';
      console.log('📅 Using action:', action);
      const result = await calendarTool.func({ action });
      console.log('📅 Calendar tool result:', result);
      return result;
    }
    
    // Web search
    if (lowerMessage.includes('search') || lowerMessage.includes('what is') || lowerMessage.includes('who is') || lowerMessage.includes('current')) {
      const result = await searchTool.func({ query: userMessage });
      return result;
    }
    
    // App launching
    if (lowerMessage.includes('open') || lowerMessage.includes('launch') || lowerMessage.includes('start')) {
      const apps = ['chrome', 'code', 'notepad', 'calculator', 'explorer'];
      const appName = apps.find(app => lowerMessage.includes(app));
      
      if (appName) {
        const result = await appLauncherTool.func({ appName });
        return result;
      }
    }
    
    // File operations
    if (lowerMessage.includes('file') && (lowerMessage.includes('open') || lowerMessage.includes('save'))) {
      const action = lowerMessage.includes('save') ? 'save' : 'open';
      // Extract file path from message (simplified)
      const pathMatch = userMessage.match(/["']([^"']+)["']/);
      const path = pathMatch ? pathMatch[1] : 'unknown';
      
      const result = await fileSystemTool.func({ action, path });
      return result;
    }
    
    // Default: use LLM for conversation
    const messages = [{ role: 'user', content: userMessage }];
    const response = await llm.invoke(messages);
    return response.content || response;
  } catch (error) {
    console.error('❌ Agent execution error:', error.message);
    return `I encountered an error: ${error.message}`;
  }
}

export { createLLM };
