const db = require('./db');

module.exports = async (req, res) => {
  const { method } = req;
  const { event_id, id } = req.query;

  try {
    if (method === 'GET') {
      const result = await db.query('SELECT * FROM budget_items WHERE event_id = $1 ORDER BY id DESC', [event_id]);
      return res.status(200).json(result.rows);
    } else if (method === 'POST') {
      const { title, type, amount, event_id: evtId } = req.body;
      const result = await db.query(
        'INSERT INTO budget_items (event_id, title, type, amount, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [evtId, title, type, amount, 'approved']
      );
      return res.status(201).json(result.rows[0]);
    } else if (method === 'DELETE') {
      await db.query('DELETE FROM budget_items WHERE id = $1', [id]);
      return res.status(200).json({ message: 'Budget item deleted' });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};