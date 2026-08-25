"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const pg_1 = require("pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
exports.pool = pool;
const app = (0, express_1.default)();
exports.app = app;
app.use(express_1.default.json());
// Simplistic A/B testing logic for prompts
app.post('/prompt/:experimentId/variant', async (req, res) => {
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
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
app.post('/prompt/:experimentId/metric', async (req, res) => {
    const { experimentId } = req.params;
    const { userId, metricName, value } = req.body;
    try {
        await pool.query('INSERT INTO metrics (experiment_id, user_id, metric_name, value) VALUES ($1, $2, $3, $4)', [experimentId, userId, metricName, value]);
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
if (require.main === module) {
    app.listen(3000, () => console.log('A/B Testing API on port 3000'));
}
