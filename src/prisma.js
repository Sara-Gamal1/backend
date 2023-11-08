import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
    if (
        params.model == 'Trends' ||
        params.model == 'Interactions' ||
        params.model == 'User'
    ) {
        if (params.action == 'delete' || params.action == 'deleteMany') {
            params.action =
                params.action === 'delete' ? 'update' : 'updateMany';

            if (params.args.data)
                params.args.data['deletedDate'] = new Date().toISOString();
            else params.args.data = { deletedDate: new Date().toISOString() };
        }
        if (
            params.action == 'findFirst' ||
            params.action == 'findUnique' ||
            params.action == 'findMany' ||
            params.action == 'update' ||
            params.action == 'updateMany'
        ) {
            if (params.args.where) params.args.where['deletedDate'] = null;
            else params.args.where = { deletedDate: null };
        }
    }
    return next(params);
});

export default prisma;
