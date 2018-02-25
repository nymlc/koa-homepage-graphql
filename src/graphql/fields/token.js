import mongoose from 'mongoose';
import { GraphQLString, GraphQLNonNull } from 'graphql';
import { TypeComposer } from 'graphql-compose';
import jwt from 'jsonwebtoken';
import redis from '@/utils/db/redisdb';
import config from '@/config';
import { getTokenKey } from 'utils/api/res-utils';
import wrapResolvers from '../wrapper';
const { System: { expire_access_token, expire_refresh_token, publicKey } } = config;
// 创建token
const createTonken = (payload, expiresIn) => {
    const token = jwt.sign(payload, publicKey, {
        expiresIn // 过期时间设置为60妙。那么decode这个token的时候得到的过期时间为 : 创建token的时间+设置的值
    });
    return token;
};
// 保存token在redis
const saveToken = (accessToken, refreshToken, key) => {
    const { accessTokenKey, refreshTokenKey } = getTokenKey(key);
    redis.set(accessTokenKey, accessToken);
    redis.expire(accessTokenKey, expire_access_token);
    redis.set(refreshTokenKey, refreshToken);
    redis.expire(refreshTokenKey, expire_refresh_token);
};
const createTokenResponse = (userId, role) => {
    const payload = { userId, role };
    const accessToken = createTonken(payload, expire_access_token);
    const refreshToken = createTonken(payload, expire_refresh_token);
    saveToken(accessToken, refreshToken, userId);
    return {
        access_token: accessToken,
        refresh_token: refreshToken
    };
};
const UserModel = mongoose.model('User');
const TokenTC = TypeComposer.create(`
  type City {
    access_token: String!,
    refresh_token: String!
  }
`);
TokenTC.addResolver({
    kind: 'mutation',
    name: 'singnIn',
    args: {
        username: new GraphQLNonNull(GraphQLString),
        password: new GraphQLNonNull(GraphQLString)
    },
    type: TokenTC,
    resolve: async({ _, args, context, info }) => {
        const { username, password } = args;
        const user = await UserModel.findOne({ username });
        if (!user) {
            return {
                access_token: '1',
                refresh_token: '1'
            };
        } else {
            const { password: dbPassword, _id: userId, role } = user;
            if (dbPassword === password) {
                return createTokenResponse(userId, role);
            } else {
                return {
                    access_token: '2',
                    refresh_token: '2'
                };
            }
        }
    }
});
TokenTC.addResolver({
    kind: 'mutation',
    name: 'refreshToken',
    // args: {
    //     refreshToken: GraphQLString
    // },
    type: TokenTC,
    resolve: async({ _, args, context, info }) => {
        const { auth: { decodedToken: { user_id, role } } } = context;
        console.log(user_id, role);
        return createTokenResponse(user_id, role);
    }
});

const scopesSchema = {
    mutation: {
        tokenByAccount: '',
        tokenByRefreshToken: ['permissionAccess']
    }
};
const tokenMutation = wrapResolvers({
    tokenByAccount: TokenTC.get('$singnIn'),
    tokenByRefreshToken: TokenTC.get('$refreshToken')
}, scopesSchema.mutation);
export { TokenTC, tokenMutation };
