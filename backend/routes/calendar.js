/**
 * Google Calendar API Routes
 * Handles calendar operations: events, reminders, scheduling
 */

import express from 'express';
import { getCalendarClient, isAuthenticated, getAuthUrl } from '../utils/googleAuth.js';

const router = express.Router();

/**
 * Middleware: Check authentication
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
 * GET /api/calendar/events
 * Get upcoming calendar events
 */
router.get('/events', requireAuth, async (req, res) => {
  try {
    const { 
      timeMin = new Date().toISOString(),
      timeMax,
      maxResults = 20,
      q
    } = req.query;
    
    const calendar = await getCalendarClient();
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      maxResults: parseInt(maxResults),
      singleEvents: true,
      orderBy: 'startTime',
      q
    });
    
    const events = response.data.items || [];
    
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.summary,
      description: event.description || '',
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      location: event.location || '',
      attendees: event.attendees?.map(a => a.email) || [],
      isVirtual: event.conferenceData?.conferenceSolution ? true : false,
      meetingUrl: event.conferenceData?.entryPoints?.[0]?.uri || '',
      status: event.status,
      creator: event.creator?.email || '',
      organizer: event.organizer?.email || ''
    }));
    
    res.json({ events: formattedEvents, total: events.length });
  } catch (error) {
    console.error('❌ Calendar events error:', error.message);
    res.status(500).json({ error: 'Failed to fetch events', details: error.message });
  }
});

/**
 * GET /api/calendar/events/today
 * Get today's events
 */
router.get('/events/today', requireAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const calendar = await getCalendarClient();
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: today.toISOString(),
      timeMax: tomorrow.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });
    
    const events = response.data.items || [];
    
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.summary,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      location: event.location || '',
      isVirtual: event.conferenceData ? true : false,
      meetingUrl: event.conferenceData?.entryPoints?.[0]?.uri || ''
    }));
    
    res.json({ events: formattedEvents, date: today.toDateString() });
  } catch (error) {
    console.error('❌ Calendar today error:', error.message);
    res.status(500).json({ error: 'Failed to fetch today\'s events', details: error.message });
  }
});

/**
 * POST /api/calendar/events
 * Create new calendar event
 */
router.post('/events', requireAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      start,
      end,
      location,
      attendees,
      reminders
    } = req.body;
    
    if (!title || !start || !end) {
      return res.status(400).json({ error: 'Missing required fields: title, start, end' });
    }
    
    const calendar = await getCalendarClient();
    
    const event = {
      summary: title,
      description: description || '',
      location: location || '',
      start: {
        dateTime: start,
        timeZone: 'UTC'
      },
      end: {
        dateTime: end,
        timeZone: 'UTC'
      },
      attendees: attendees?.map(email => ({ email })) || [],
      reminders: reminders || {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 }
        ]
      }
    };
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all'
    });
    
    res.json({
      success: true,
      event: {
        id: response.data.id,
        title: response.data.summary,
        start: response.data.start.dateTime,
        htmlLink: response.data.htmlLink
      },
      message: 'Event created successfully'
    });
  } catch (error) {
    console.error('❌ Calendar create error:', error.message);
    res.status(500).json({ error: 'Failed to create event', details: error.message });
  }
});

/**
 * PUT /api/calendar/events/:id
 * Update calendar event
 */
router.put('/events/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, start, end, location } = req.body;
    
    const calendar = await getCalendarClient();
    
    // Get existing event
    const existingEvent = await calendar.events.get({
      calendarId: 'primary',
      eventId: id
    });
    
    // Update fields
    const updatedEvent = {
      ...existingEvent.data,
      summary: title || existingEvent.data.summary,
      description: description !== undefined ? description : existingEvent.data.description,
      location: location !== undefined ? location : existingEvent.data.location,
      start: start ? { dateTime: start, timeZone: 'UTC' } : existingEvent.data.start,
      end: end ? { dateTime: end, timeZone: 'UTC' } : existingEvent.data.end
    };
    
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: id,
      resource: updatedEvent,
      sendUpdates: 'all'
    });
    
    res.json({
      success: true,
      event: {
        id: response.data.id,
        title: response.data.summary,
        start: response.data.start.dateTime
      },
      message: 'Event updated successfully'
    });
  } catch (error) {
    console.error('❌ Calendar update error:', error.message);
    res.status(500).json({ error: 'Failed to update event', details: error.message });
  }
});

/**
 * DELETE /api/calendar/events/:id
 * Delete calendar event
 */
router.delete('/events/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const calendar = await getCalendarClient();
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: id,
      sendUpdates: 'all'
    });
    
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('❌ Calendar delete error:', error.message);
    res.status(500).json({ error: 'Failed to delete event', details: error.message });
  }
});

/**
 * GET /api/calendar/freebusy
 * Check free/busy times
 */
router.post('/freebusy', requireAuth, async (req, res) => {
  try {
    const { timeMin, timeMax } = req.body;
    
    if (!timeMin || !timeMax) {
      return res.status(400).json({ error: 'Missing required fields: timeMin, timeMax' });
    }
    
    const calendar = await getCalendarClient();
    
    const response = await calendar.freebusy.query({
      resource: {
        timeMin,
        timeMax,
        items: [{ id: 'primary' }]
      }
    });
    
    const busyTimes = response.data.calendars.primary.busy || [];
    
    res.json({ busyTimes });
  } catch (error) {
    console.error('❌ Calendar freebusy error:', error.message);
    res.status(500).json({ error: 'Failed to check availability', details: error.message });
  }
});

export default router;
