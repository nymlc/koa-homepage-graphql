import { graphqlKoa, graphiqlKoa } from 'apollo-server-koa';

import schema from '@/graphql';
import KoaRouter from 'koa-router';
// import jwt from 'jsonwebtoken';
// import config from '@/config';
// import _console from '@/utils/console';
// const { System: { publicKey } } = config;

const router = new KoaRouter();

router.post('/graphql', async(ctx, next) => {
    await graphqlKoa({
        schema,
        context: { auth: ctx.auth },
        formatResponse(data, schema, a, b) {
            return data;
        },
        formatError: err => {
            if (err.originalError && err.originalError.error_message) {
                err.message = err.originalError.error_message;
            }
            return err;
        }
    })(ctx, next);
})
    .get('/graphql', async(ctx, next) => {
        await graphqlKoa({
            schema,
            context: { auth: ctx.auth },
            formatError: err => {
                if (err.originalError && err.originalError.error_message) {
                    err.message = err.originalError.error_message;
                }
                return err;
            },
            formatResponse(data, schema) {
                return data;
            }
        })(ctx, next);
    })
    .get('/graphiql', graphiqlKoa({
        endpointURL: '/graphql',
        passHeader: '"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1OWEyZWQ3ODg2NTI1ODQ2ZTU3NjI5NGIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE1MjAxMzA2MDcsImV4cCI6MTUyMDEzMjQwN30.3gEl4XgM6jwnCc9UHIDanK-IrEmg7gDnktZ4Mhe_tuI"'
        // passHeader: '"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1YTY0YTk4MmI3MThlOWEzMmJjNTJkODUiLCJyb2xlIjoidXNlciIsImlhdCI6MTUxOTU3MzQ0NCwiZXhwIjoxNTE5NTc1MjQ0fQ.ZJqcn2CxNpRFa-GPe5miTCeWEk8whGMUL4wrGEADjno"'
    }));
export default router;
