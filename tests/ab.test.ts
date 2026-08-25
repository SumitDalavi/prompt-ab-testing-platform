import request from 'supertest';

jest.mock('pg', () => {
    const mPool = {
        query: jest.fn(),
    };
    return { Pool: jest.fn(() => mPool) };
});

import { app, pool } from '../src/index';

describe('Prompt A/B Testing Platform', () => {
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
});
