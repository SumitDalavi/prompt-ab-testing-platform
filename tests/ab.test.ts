import request from 'supertest';

jest.mock('pg', () => {
    const mPool = {
        query: jest.fn(),
    };
    return { Pool: jest.fn(() => mPool) };
});

import { app, pool } from '../src/index';

describe('Prompt A/B Testing Platform', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should assign a variant deterministically', async () => {
        (pool.query as jest.Mock).mockResolvedValueOnce({
            rows: [{ variants: ['variantA', 'variantB'] }]
        });

        const res = await request(app).post('/prompt/exp1/variant').send({
            userId: 'user1'
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body.variant).toBeDefined();
    });

    it('should track metrics', async () => {
        (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 1 });

        const res = await request(app).post('/prompt/exp1/metric').send({
            userId: 'user1',
            metricName: 'click',
            value: 1
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toEqual(true);
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO metrics'),
            ['exp1', 'user1', 'click', 1]
        );
    });

    it('should return 400 if userId is missing', async () => {
        const res = await request(app).post('/prompt/exp1/variant').send({});
        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toBe('userId is required');
    });

    it('should return 404 if experiment not found', async () => {
        (pool.query as jest.Mock).mockResolvedValueOnce({
            rows: []
        });

        const res = await request(app).post('/prompt/exp-not-found/variant').send({
            userId: 'user1'
        });

        expect(res.statusCode).toEqual(404);
        expect(res.body.error).toBe('Experiment not found');
    });

    it('should return 500 on variant query error', async () => {
        (pool.query as jest.Mock).mockRejectedValueOnce(new Error('DB Error'));

        const res = await request(app).post('/prompt/exp1/variant').send({
            userId: 'user1'
        });

        expect(res.statusCode).toEqual(500);
        expect(res.body.error).toBe('DB Error');
    });

    it('should return 500 on metric query error', async () => {
        (pool.query as jest.Mock).mockRejectedValueOnce(new Error('DB Error Metric'));

        const res = await request(app).post('/prompt/exp1/metric').send({
            userId: 'user1',
            metricName: 'click',
            value: 1
        });

        expect(res.statusCode).toEqual(500);
        expect(res.body.error).toBe('DB Error Metric');
    });
});
