import resCode from './res-code';
import jwt from 'jsonwebtoken';
import config from 'config';

const { System: { publicKey } } = config;
// data放在第一位，这样子传空数据必须显示传参
const resJson = (data, code = 0, msg = 'done') => {
    //     {
    //     data : { // 请求数据，对象或数组均可
    //         user_id: 123,
    //         user_name: "tutuge",
    //         user_avatar_url: "http://tutuge.me/avatar.jpg"
    //         ...
    //     },
    //     msg : "done", // 请求状态描述，调试用
    //     code: 1001, // 业务自定义状态码
    //     extra : { // 全局附加数据，字段、内容不定
    //         type: 1,
    //         desc: "签到成功！"
    //     }
    // }
    if (code !== 0) {
        msg = resCode[code];
    }
    const res = {
        code,
        msg,
        data
    };
    return res;
};
const getTokenKey = userId => {
    const accessTokenKey = `${userId}a`;
    const refreshTokenKey = `${userId}r`;
    return {
        accessTokenKey, refreshTokenKey
    };
};
const getTokenFromCtx = ctx => {
    let token;
    // 获取请求中的token
    try {
        token = ctx.header.authorization.split(' ')[1];
    } catch (error) {
        // token = '';
    }
    return token;
};

const getUserIdFromCtx = ctx => {
    // 获取请求中的token
    const token = getTokenFromCtx(ctx);
    let userId;
    if (token != null) {
        const decoded = jwt.decode(token, publicKey);
        userId = decoded.userId;
    }
    return userId;
};

export {
    resJson, getTokenKey, getTokenFromCtx, getUserIdFromCtx
};
