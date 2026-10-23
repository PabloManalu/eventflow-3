const db = require('./db');

module.exports = async (req, res) => {
  const { method } = req;

  try {
    if (method === 'GET') {
      const result = await db.query('SELECT * FROM events ORDER BY created_at DESC');
      return res.status(200).json(result.rows);
    } else if (method === 'POST') {
      const { title, description, event_date, target_attendees, created_by } = req.body;
      const result = await db.query(
        'INSERT INTO events (title, description, event_date, target_attendees, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [title, description, event_date, target_attendees || 0, created_by || 1]
      );
      
      const newEvent = result.rows[0];
      await db.query(
        'INSERT INTO event_members (event_id, user_id, role) VALUES ($1, $2, $3)',
        [newEvent.id, created_by || 1, 'owner']
      );

      return res.status(201).json(newEvent);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};