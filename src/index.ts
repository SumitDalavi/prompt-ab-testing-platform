import express, { Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

const app = express();
app.use(express.json());

let db: Database;

export async function initDb(dbPath: string = ':memory:') {
    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS experiments (
            id TEXT PRIMARY KEY,
            variants TEXT,
            status TEXT DEFAULT 'running',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            experiment_id TEXT,
            user_id TEXT,
            variant TEXT,
            metric_name TEXT,
            value REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            experiment_id TEXT,
            action TEXT,
            details TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

// Immutable Prompt Versioning: Create an experiment
app.post('/experiments', async (req: Request, res: Response) => {
    const { id, variants } = req.body;
    if (!id || !variants || !Array.isArray(variants) || variants.length === 0) {
        return res.status(400).json({ error: 'id and variants array are required' });
    }

    try {
        await db.run(
            'INSERT INTO experiments (id, variants) VALUES (?, ?)',
            [id, JSON.stringify(variants)]
        );
        await db.run(
            'INSERT INTO audit_log (experiment_id, action, details) VALUES (?, ?, ?)',
            [id, 'created', JSON.stringify({ variants })]
        );
        res.status(201).json({ success: true, id });
    } catch (e: any) {
        if (e.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ error: 'Experiment already exists' });
        }
        res.status(500).json({ error: e.message });
    }
});

// A/B Testing Evaluation
app.post('/prompt/:experimentId/variant', async (req: Request, res: Response) => {
    const { experimentId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    try {
        const row = await db.get('SELECT variants, status FROM experiments WHERE id = ?', [experimentId]);
        if (!row) {
            return res.status(404).json({ error: 'Experiment not found' });
        }

        const variants = JSON.parse(row.variants);
        // Deterministic hashing based on userId and experimentId
        const hash = (userId.toString() + experimentId).split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const assignedVariant = variants[hash % variants.length];

        res.json({ variant: assignedVariant, status: row.status });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/prompt/:experimentId/metric', async (req: Request, res: Response) => {
    const { experimentId } = req.params;
    const { userId, variant, metricName, value } = req.body;
    
    try {
        await db.run(
            'INSERT INTO metrics (experiment_id, user_id, variant, metric_name, value) VALUES (?, ?, ?, ?, ?)',
            [experimentId, userId, variant, metricName, value]
        );
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Experiment statistics (tracking win rates)
app.get('/experiments/:experimentId/stats', async (req: Request, res: Response) => {
    const { experimentId } = req.params;
    
    try {
        const row = await db.get('SELECT variants FROM experiments WHERE id = ?', [experimentId]);
        if (!row) {
            return res.status(404).json({ error: 'Experiment not found' });
        }

        // Calculate average metric value per variant
        const stats = await db.all(`
            SELECT variant, metric_name, COUNT(*) as count, AVG(value) as avg_value 
            FROM metrics 
            WHERE experiment_id = ? 
            GROUP BY variant, metric_name
        `, [experimentId]);

        res.json({ experimentId, stats });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Audit trails
app.get('/experiments/:experimentId/audit', async (req: Request, res: Response) => {
    const { experimentId } = req.params;
    try {
        const logs = await db.all('SELECT * FROM audit_log WHERE experiment_id = ? ORDER BY timestamp DESC', [experimentId]);
        res.json({ logs });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Optional main entrypoint if started directly
export async function startServer() {
    await initDb('ab-testing.db');
    app.listen(3000, () => console.log('A/B Testing API on port 3000'));
}

if (require.main === module) {
    startServer();
}

export { app, db };
