import express, { Request, Response } from 'express';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
app.use(express.json());

// Simplistic A/B testing logic for prompts
app.post('/prompt/:experimentId/variant', async (req: Request, res: Response) => {
    const { experimentId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    try {
        const result = await pool.query('SELECT variants FROM experiments WHERE id = $1', [experimentId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Experiment not found' });
        }

        const variants = result.rows[0].variants;
        // Deterministic hashing based on userId and experimentId
        const hash = (userId.toString() + experimentId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const assignedVariant = variants[hash % variants.length];

        res.json({ variant: assignedVariant });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/prompt/:experimentId/metric', async (req: Request, res: Response) => {
    const { experimentId } = req.params;
    const { userId, metricName, value } = req.body;
    
    try {
        await pool.query(
            'INSERT INTO metrics (experiment_id, user_id, metric_name, value) VALUES ($1, $2, $3, $4)',
            [experimentId, userId, metricName, value]
        );
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

if (require.main === module) {
    app.listen(3000, () => console.log('A/B Testing API on port 3000'));
}

export { app, pool };
