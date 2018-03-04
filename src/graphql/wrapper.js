import _ from 'lodash';
import scopes from './scopes';
import redis from '@/utils/db/redisdb';
import { getTokenKey } from '@/utils/api/res-utils';

class ContextError extends Error {
    constructor(message = '`auth` property not found on context!') {
        super(message);
        this.message = message;
        this.name = 'ContextError';
    }
}

class AuthorizationError extends Error {
    constructor(message = 'Permission Denied!') {
        super(message);
        this.message = message;
        this.name = 'AuthorizationError';
    }
}
class FieldFormatError extends Error {
    constructor(message = 'The field you provided is improperly formatted!') {
        super(message);
        this.message = message;
        this.name = 'FieldFormatError';
    }
}
/*
class UniqueError extends Error {
    constructor(message = 'The data you provided is exist!') {
        super(message);
        this.message = message;
        this.name = 'UniqueError';
    }
}
*/

function validateScope(required, provided) {
    let hasScope = false;

    required.forEach(scope => {
        provided.forEach(perm => {
            // user:* -> user:create, user:view:self
            const permRe = new RegExp('^' + perm.replace('*', '.*') + '$');
            if (permRe.exec(scope)) hasScope = true;
        });
    });

    return hasScope;
}
/*
// token=>userId     args=>recode=>_id     args=>_id
// token=>userId     args=>recode=>author
const ownerAccess = (rp, field = 'author') => {
    const { context: { auth }, args: { record } } = rp;
    if (!auth) return new ContextError();
    const { decodedToken } = auth;
    // 若token存在
    if (decodedToken) {
        const { userId } = decodedToken;
        if (record && record[field].toString() === ) {

        } else {
            return new AuthorizationError();
        }
    } else {
        return new AuthorizationError();
    }
};

// for the unique data
const uniqueAccess = async(rp, source) => {
    const { args: { record } } = rp;
    const { fields, model } = source;
    const conditions = {};
    fields && fields.forEach(field => {
        if (record && record[field]) {
            conditions[field] = record[field];
        }
    });
    const doc = await model.findOne(conditions);
    if (doc) {
        if (conditions.password) {
            conditions.password = '******';
        }
        return new UniqueError(`The data what ${JSON.stringify(conditions)} is exist!`);
    }
}; */
const fieldsAccess = (rp, model) => {
    const fieldsReg = {
        user: {
            password: /^\w{6,15}$/
        }
    };
    model = model || rp.info.fieldName.match(/^[a-z]+?(?=[A-Z])/)[0];
    for (const field in rp.args.record) {
        const fieldReg = fieldsReg[model] && fieldsReg[model][field];
        const value = rp.args.record[field];
        if (fieldReg) {
            if (_.isRegExp(fieldReg) && fieldReg.test(value)) {
                // do nothing
            } else {
                return new FieldFormatError(`The field of ${field} is improperly formatted!`);
            }
        }
    }
};
/**
 *
 *
 * @param {any} rp
 * @returns
 */
const permissionAccess = async rp => {
    const { context: { auth }, args, info: { fieldName, operation: { operation } } } = rp;
    if (!auth) return new ContextError();
    let requiredScope = scopes[operation][fieldName];
    if (requiredScope && typeof requiredScope === 'function') {
        const { decodedToken } = auth;
        requiredScope = await Promise.resolve().then(() => requiredScope(decodedToken || {}, args, rp));
    }
    // 若需要权限
    if (requiredScope &&
        ((_.isArray(requiredScope) && requiredScope.length) || (_.isString(requiredScope) && requiredScope !== ''))) {
        const { token, decodedToken } = auth;
        // 若请求者token验证未过
        if (!auth.isAuthenticated) {
            return new AuthorizationError('Not Authenticated!');
        }
        // 若请求者token被删除
        if (!token || !decodedToken) {
            return new AuthorizationError('Not Find Token!');
        }
        const { accessTokenKey, refreshTokenKey } = getTokenKey(decodedToken.userId);
        // 若是刷新token
        if (fieldName === 'tokenByRefreshToken') {
            let refreshToken;
            // 获取内存中的refreshtoken
            await redis.get(refreshTokenKey).then(result => {
                refreshToken = result;
            });
            if (refreshToken !== token) {
                return new AuthorizationError('Not Authenticated!');
            }
        } else {
            let accessToken;
            // 获取内存中的accesstoken
            console.log(accessTokenKey);
            await redis.get(accessTokenKey).then(result => {
                accessToken = result;
            });
            console.log(accessToken);
            console.log(token);
            if (accessToken !== token) {
                return new AuthorizationError('Not Authenticated!');
            }
        }
        if (_.isString(requiredScope)) {
            requiredScope = [requiredScope];
        }
        // 若请求者无权限或者请求者权限与当前服务所需权限不匹配
        if (!auth.scope || !validateScope(requiredScope, auth.scope)) {
            return new AuthorizationError();
        }
        // return next(rp)
    } else {
        // return next(rp)
    }
};

// wrapper
const wrapper = (cbs = []) => next => async rp => {
    if (!_.isArray(cbs)) {
        cbs = [cbs];
    }
    for (const cb of cbs) {
        let cbr;
        if (_.isFunction(cb)) {
            cbr = await cb.call(this, rp);
        } else if (cb.method) {
            cbr = await cb.method.call(this, rp, cb.args);
        }
        if (cbr) {
            return cbr;
        }
    }
    return next(rp);
};
const accessSchema = {
    permissionAccess,
    fieldsAccess
};
const wrapResolvers = (resolvers, scopesSchema = {}) => {
    Object.keys(resolvers).forEach(k => {
        let scopeSchema = scopesSchema[k];
        if (_.isString(scopeSchema)) {
            scopeSchema = [scopeSchema];
        }
        if (_.isArray(scopeSchema) && scopeSchema.length) {
            const access = scopeSchema.map(_scopeSchema => accessSchema[_scopeSchema]).filter(value => value != null);
            resolvers[k] = resolvers[k].wrapResolve(wrapper(access));
        }
    });
    return resolvers;
};
export default wrapResolvers;
