import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const getSatellites = async (req: Request, res: Response) => {
    try {
        const pageQuery = req.query.page as string | undefined;
        const limitQuery = req.query.limit as string | undefined;

        const page = parseInt(pageQuery || '1', 10);
        const limit = parseInt(limitQuery || '20', 10);
        const skip = (page - 1) * limit;

        const satellites = await prisma.satellite.findMany({
            skip,
            take: limit,
            include: {
                tles: {
                    orderBy: { fetchedAt: 'desc' },
                    take: 1
                }
            }
        });

        const total = await prisma.satellite.count();

        res.json({
            data: satellites,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch satellites' });
    }
};

export const getSatelliteById = async (req: Request, res: Response) => {
    try {
        const noradIdStr = req.params.noradId as string;
        const noradId = parseInt(noradIdStr, 10);
        if (isNaN(noradId)) {
            res.status(400).json({ error: 'Invalid NORAD ID' });
            return;
        }

        const satellite = await prisma.satellite.findUnique({
            where: { noradId },
            include: {
                tles: {
                    orderBy: { fetchedAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!satellite) {
            res.status(404).json({ error: 'Satellite not found' });
            return;
        }

        res.json(satellite);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch satellite' });
    }
};

export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.satellite.groupBy({
            by: ['category'],
            _count: {
                category: true
            }
        });

        const result = categories.map((c: any) => ({
            name: c.category,
            count: c._count.category
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

export const searchSatellites = async (req: Request, res: Response) => {
    try {
        const { q } = req.body;

        if (!q || typeof q !== 'string') {
            res.status(400).json({ error: 'Search query required' });
            return;
        }

        const satellites = await prisma.satellite.findMany({
            where: {
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { noradId: { equals: parseInt(q) || -1 } }
                ]
            },
            take: 20
        });

        res.json(satellites);
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
};
