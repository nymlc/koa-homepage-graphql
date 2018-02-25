import verify from 'koa-jwt/lib/verify';
import getSecret from 'koa-jwt/lib/get-secret';
import resolveAuthHeader from 'koa-jwt/lib/resolvers/auth-header';
import resolveCookies from 'koa-jwt/lib/resolvers/cookie';
import scopes from './scopes';

export default (opts = {}) => {
    const { getToken, isRevoked, key = 'user', tokenKey } = opts;
    const tokenResolvers = [resolveCookies, resolveAuthHeader];

    if (getToken && typeof getToken === 'function') {
        tokenResolvers.unshift(getToken);
    }

    const middleware = async function jwt(ctx, next) {
        let token;
        tokenResolvers.find(resolver => token = resolver(ctx, opts));

        // 无token
        if (!token) {
            // ctx.throw(401, debug ? 'Token not found' : 'Authentication Error');
            ctx.auth = { isAuthenticated: false, scope: null };
            return next();
        }

        let { state: { secret = opts.secret } } = ctx;
        let decodedToken;
        try {
            if (typeof secret === 'function') {
                secret = await getSecret(secret, token);
            }
            // 无密钥
            if (!secret) {
                // ctx.throw(401, 'Secret not provided');
                ctx.auth = { isAuthenticated: false, scope: null };
                return await next();
            }

            decodedToken = await verify(token, secret, opts);
            // 无效判定
            if (isRevoked) {
                tokenRevoked = await isRevoked(ctx, decodedToken, token);
                if (tokenRevoked) {
                    // throw new Error('Token revoked');
                    ctx.auth = { isAuthenticated: false, scope: null };
                    return await next();
                }
            }

            ctx.state[key] = decodedToken;
            if (tokenKey) {
                ctx.state[tokenKey] = token;
            }
        } catch (e) {
            // const msg = debug ? e.message : 'Authentication Error';
            // ctx.throw(401, msg);
            ctx.auth = { isAuthenticated: false, scope: null };
            return next();
        }
        // 至此decodedToken就绪
        ctx.auth = { isAuthenticated: true, scope: scopes[decodedToken.role], decodedToken, token };
        await next();
    };
    return middleware;
};
