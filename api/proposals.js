const db = require('./db');

module.exports = async (req, res) => {
  const { method } = req;
  const { event_id, id } = req.query;

  try {
    if (method === 'GET') {
      const result = await db.query(
        'SELECT p.*, u.name as submitter_name FROM proposals p LEFT JOIN users u ON p.submitted_by = u.id WHERE p.event_id = $1 ORDER BY p.id DESC',
        [event_id]
      );
      return res.status(200).json(result.rows);
    } else if (method === 'POST') {
      const { title, description, submitted_by, event_id: evtId } = req.body;
      const result = await db.query(
        'INSERT INTO proposals (event_id, title, description, submitted_by, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [evtId, title, description, submitted_by, 'pending']
      );
      return res.status(201).json(result.rows[0]);
    } else if (method === 'PATCH') {
      const { status } = req.body;
      const result = await db.query(
        'UPDATE proposals SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );
      return res.status(200).json(result.rows[0]);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
