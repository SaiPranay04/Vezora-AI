/**
 * Gmail API Routes
 * Handles email operations: fetch, send, search, etc.
 */

import express from 'express';
import { getGmailClient, isAuthenticated, getAuthUrl } from '../utils/googleAuth.js';

const router = express.Router();

/**
 * Middleware: Check if user is authenticated
 */
async function requireAuth(req, res, next) {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    return res.status(401).json({
      error: 'Not authenticated',
      message: 'Please authenticate with Google first',
      authUrl: getAuthUrl()
    });
  }
  
  next();
}

/**
 * GET /api/gmail/messages (Simple endpoint for AI)
 * Returns recent emails or prompts to authenticate
 */
router.get('/messages', async (req, res) => {
  try {
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      return res.json({
        authenticated: false,
        message: 'User needs to authenticate with Google to access emails',
        authUrl: getAuthUrl(),
        mockData: [
          {
            id: '1',
            subject: 'Meeting Reminder - 3PM Today',
            from: 'John Doe <johndoe@example.com>',
            date: new Date().toISOString(),
            snippet: 'This is mock data. Please authenticate to see real emails.',
            isMock: true
          },
          {
            id: '2',
            subject: 'Project Update - Deadline Approaching',
            from: 'Jane Smith <janesmith@example.com>',
            date: new Date().toISOString(),
            snippet: 'This is mock data. Please authenticate to see real emails.',
            isMock: true
          }
        ]
      });
    }
    
    // User is authenticated - fetch real emails
    const { maxResults = 5 } = req.query;
    const gmail = await getGmailClient();
    
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults: parseInt(maxResults),
      labelIds: ['INBOX']
    });
    
    const messages = listResponse.data.messages || [];
    
    if (messages.length === 0) {
      return res.json({
        authenticated: true,
        emails: [],
        message: 'No emails found in inbox'
      });
    }
    
    // Fetch email details (just first few for speed)
    const emails = await Promise.all(
      messages.slice(0, 5).map(async (msg) => {
        const message = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full'
        });
        
        return parseEmail(message.data);
      })
    );
    
    res.json({
      authenticated: true,
      emails,
      totalMessages: listResponse.data.resultSizeEstimate
    });
  } catch (error) {
    console.error('❌ Gmail messages error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch emails', 
      details: error.message 
    });
  }
});

/**
 * GET /api/gmail/inbox
 * Fetch inbox emails
 */
router.get('/inbox', requireAuth, async (req, res) => {
  try {
    const { maxResults = 20, pageToken } = req.query;
    
    const gmail = await getGmailClient();
    
    // List messages
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults: parseInt(maxResults),
      pageToken: pageToken,
      labelIds: ['INBOX']
    });
    
    const messages = listResponse.data.messages || [];
    
    // Fetch full message details
    const emails = await Promise.all(
      messages.map(async (msg) => {
        const message = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full'
        });
        
        return parseEmail(message.data);
      })
    );
    
    res.json({
      emails,
      nextPageToken: listResponse.data.nextPageToken,
      totalMessages: listResponse.data.resultSizeEstimate
    });
  } catch (error) {
    console.error('❌ Gmail inbox error:', error.message);
    res.status(500).json({ error: 'Failed to fetch inbox', details: error.message });
  }
});

/**
 * GET /api/gmail/sent
 * Fetch sent emails
 */
router.get('/sent', requireAuth, async (req, res) => {
  try {
    const { maxResults = 20, pageToken } = req.query;
    
    const gmail = await getGmailClient();
    
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      maxResults: parseInt(maxResults),
      pageToken: pageToken,
      labelIds: ['SENT']
    });
    
    const messages = listResponse.data.messages || [];
    
    const emails = await Promise.all(
      messages.map(async (msg) => {
        const message = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full'
        });
        
        return parseEmail(message.data);
      })
    );
    
    res.json({
      emails,
      nextPageToken: listResponse.data.nextPageToken
    });
  } catch (error) {
    console.error('❌ Gmail sent error:', error.message);
    res.status(500).json({ error: 'Failed to fetch sent emails', details: error.message });
  }
});

/**
 * GET /api/gmail/search
 * Search emails
 */
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { q, maxResults = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    const gmail = await getGmailClient();
    
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: q,
      maxResults: parseInt(maxResults)
    });
    
    const messages = listResponse.data.messages || [];
    
    const emails = await Promise.all(
      messages.map(async (msg) => {
        const message = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full'
        });
        
        return parseEmail(message.data);
      })
    );
    
    res.json({ emails, query: q });
  } catch (error) {
    console.error('❌ Gmail search error:', error.message);
    res.status(500).json({ error: 'Failed to search emails', details: error.message });
  }
});

/**
 * POST /api/gmail/send
 * Send email
 */
router.post('/send', requireAuth, async (req, res) => {
  try {
    const { to, subject, body, cc, bcc } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
    }
    
    const gmail = await getGmailClient();
    
    // Create email message
    const messageParts = [
      `To: ${to}`,
      cc ? `Cc: ${cc}` : '',
      bcc ? `Bcc: ${bcc}` : '',
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      body
    ].filter(Boolean).join('\n');
    
    // Encode message
    const encodedMessage = Buffer.from(messageParts)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    // Send message
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });
    
    res.json({
      success: true,
      messageId: response.data.id,
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('❌ Gmail send error:', error.message);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

/**
 * GET /api/gmail/:id
 * Get single email by ID
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const gmail = await getGmailClient();
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: id,
      format: 'full'
    });
    
    const email = parseEmail(message.data);
    
    res.json({ email });
  } catch (error) {
    console.error('❌ Gmail get error:', error.message);
    res.status(500).json({ error: 'Failed to fetch email', details: error.message });
  }
});

/**
 * DELETE /api/gmail/:id
 * Delete email
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const gmail = await getGmailClient();
    await gmail.users.messages.trash({
      userId: 'me',
      id: id
    });
    
    res.json({ success: true, message: 'Email moved to trash' });
  } catch (error) {
    console.error('❌ Gmail delete error:', error.message);
    res.status(500).json({ error: 'Failed to delete email', details: error.message });
  }
});

/**
 * Helper: Parse Gmail message data
 */
function parseEmail(message) {
  const headers = message.payload.headers;
  
  const getHeader = (name) => {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : '';
  };
  
  // Get email body
  let body = '';
  if (message.payload.parts) {
    const textPart = message.payload.parts.find(part => part.mimeType === 'text/plain');
    const htmlPart = message.payload.parts.find(part => part.mimeType === 'text/html');
    
    const part = htmlPart || textPart;
    if (part && part.body.data) {
      body = Buffer.from(part.body.data, 'base64').toString('utf-8');
    }
  } else if (message.payload.body.data) {
    body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
  }
  
  return {
    id: message.id,
    threadId: message.threadId,
    from: getHeader('From'),
    to: getHeader('To'),
    subject: getHeader('Subject'),
    date: getHeader('Date'),
    snippet: message.snippet,
    body: body,
    isUnread: message.labelIds?.includes('UNREAD') || false,
    isStarred: message.labelIds?.includes('STARRED') || false,
    hasAttachments: message.payload.parts?.some(part => part.filename) || false
  };
}

export default router;
