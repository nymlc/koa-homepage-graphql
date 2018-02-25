import 'module-alias/register';
import Koa2 from 'koa';
import config from 'config';
import 'models';
import middlewares from './middleware';

// fix DNS timeout
process.env.UV_THREADPOOL_SIZE = 128;

// global catch
process.on('uncaughtException', err => {
    console.error('uncaughtException ' + err);
});
const { System: SystemConfig } = config;
const app = new Koa2();
app.use(middlewares);

// global onerror
app.on('error', (err, ctx) => {
    ctx.body = {
        code: -1,
        msg: 'System error!',
        data: err.message
    };
});
app.listen(SystemConfig.api_server_port);

console.log('Server on port ' + SystemConfig.api_server_port + '...');

export default app;
