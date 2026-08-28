import request from 'supertest';
import { app, db, initDb } from '../src/index';

describe('Prompt A/B Testing Platform', () => {
    beforeAll(async () => {
        // Use in-memory SQLite for tests
        await initDb(':memory:');
    });

    beforeEach(async () => {
        // Clear tables between tests
        await db.run('DELETE FROM experiments');
        await db.run('DELETE FROM metrics');
        await db.run('DELETE FROM audit_log');
    });

    afterAll(async () => {
        if (db) await db.close();
    });

    it('should create an experiment and log it', async () => {
        const res = await request(app).post('/experiments').send({
            id: 'exp1',
            variants: ['A', 'B']
        });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);

        const logsRes = await request(app).get('/experiments/exp1/audit');
        expect(logsRes.statusCode).toEqual(200);
        expect(logsRes.body.logs.length).toBe(1);
        expect(logsRes.body.logs[0].action).toBe('created');
    });

    it('should return 409 if experiment exists', async () => {
        await request(app).post('/experiments').send({
            id: 'exp1',
            variants: ['A', 'B']
        });
        const res = await request(app).post('/experiments').send({
            id: 'exp1',
            variants: ['C', 'D']
        });
        
        expect(res.statusCode).toEqual(409);
        expect(res.body.error).toBe('Experiment already exists');
    });

    it('should assign a variant deterministically', async () => {
        await request(app).post('/experiments').send({
            id: 'exp1',
            variants: ['variantA', 'variantB']
        });

        const res1 = await request(app).post('/prompt/exp1/variant').send({ userId: 'user1' });
        const res2 = await request(app).post('/prompt/exp1/variant').send({ userId: 'user1' });
        const res3 = await request(app).post('/prompt/exp1/variant').send({ userId: 'user2' });

        expect(res1.statusCode).toEqual(200);
        expect(res1.body.variant).toBeDefined();
        // Deterministic check
        expect(res1.body.variant).toBe(res2.body.variant);
        
        // user2 might get different or same, but just verify it returns correctly
        expect(res3.statusCode).toEqual(200);
        expect(res3.body.variant).toBeDefined();
    });

    it('should track metrics and provide stats', async () => {
        await request(app).post('/experiments').send({
            id: 'exp1',
            variants: ['A', 'B']
        });

        const m1 = await request(app).post('/prompt/exp1/metric').send({
            userId: 'user1',
            variant: 'A',
            metricName: 'conversion',
            value: 1
        });
        expect(m1.statusCode).toEqual(200);
        expect(m1.body.success).toEqual(true);

        const m2 = await request(app).post('/prompt/exp1/metric').send({
            userId: 'user2',
            variant: 'A',
            metricName: 'conversion',
            value: 0
        });

        const m3 = await request(app).post('/prompt/exp1/metric').send({
            userId: 'user3',
            variant: 'B',
            metricName: 'conversion',
            value: 1
        });

        const statsRes = await request(app).get('/experiments/exp1/stats');
        expect(statsRes.statusCode).toEqual(200);
        
        // A should have avg 0.5, B should have avg 1.0
        const stats = statsRes.body.stats;
        expect(stats.length).toBe(2);
        
        const statA = stats.find((s: any) => s.variant === 'A');
        const statB = stats.find((s: any) => s.variant === 'B');
        
        expect(statA.avg_value).toBe(0.5);
        expect(statA.count).toBe(2);
        expect(statB.avg_value).toBe(1);
        expect(statB.count).toBe(1);
    });

    it('should return 400 if userId is missing', async () => {
        const res = await request(app).post('/prompt/exp1/variant').send({});
        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toBe('userId is required');
    });

    it('should return 404 if experiment not found', async () => {
        const res = await request(app).post('/prompt/exp-not-found/variant').send({
            userId: 'user1'
        });

        expect(res.statusCode).toEqual(404);
        expect(res.body.error).toBe('Experiment not found');
    });
});
