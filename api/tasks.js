const db = require('./db');

module.exports = async (req, res) => {
  const { method } = req;
  const { event_id, id } = req.query;

  try {
    if (method === 'GET') {
      const result = await db.query(
        'SELECT t.*, u.name as assignee_name, u.avatar_url as assignee_avatar FROM tasks t LEFT JOIN users u ON t.assignee_id = u.id WHERE t.event_id = $1 ORDER BY t.id DESC',
        [event_id]
      );
      return res.status(200).json(result.rows);
    } else if (method === 'POST') {
      const { title, description, priority, status, due_date, assignee_id, event_id: evtId } = req.body;
      const result = await db.query(
        'INSERT INTO tasks (event_id, title, description, priority, status, due_date, assignee_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [evtId, title, description, priority || 'medium', status || 'todo', due_date || null, assignee_id || null]
      );
      return res.status(201).json(result.rows[0]);
    } else if (method === 'PUT') {
      const { title, description, priority, status, due_date, assignee_id } = req.body;
      const result = await db.query(
        'UPDATE tasks SET title=$1, description=$2, priority=$3, status=$4, due_date=$5, assignee_id=$6 WHERE id=$7 RETURNING *',
        [title, description, priority, status, due_date, assignee_id, id]
      );
      return res.status(200).json(result.rows[0]);
    } else if (method === 'DELETE') {
      await db.query('DELETE FROM tasks WHERE id = $1', [id]);
      return res.status(200).json({ message: 'Task deleted' });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
