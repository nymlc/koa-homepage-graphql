import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose';
import wrapResolvers from '../wrapper';
const UserModel = mongoose.model('User');
const customizationOptions = {
    name: 'name',
    fields: {
        // remove: ['_id']
    },
    description: 'description',
    resolvers: {
        findMany: {
            filter: {
                filterTypeName: 'pzpz', // type name for `filter`
                isRequired: false, // set `filter` arg as required (wraps in GraphQLNonNull)
                onlyIndexed: false, // leave only that fields, which is indexed in mongodb
                requiredFields: ['name'], // provide fieldNames, that should be required
                operators: {
                    weight: ['gt']
                }
            },
            sort: {
                sortTypeName: 'pppp'
            },
            limit: {
                defaultValue: 20
            },
            skip: false
        }
    }
};
const UserTC = composeWithMongoose(UserModel, customizationOptions);
// 密码敏感字段，只有自己或者管理员才可以查询
UserTC.extendField('password', {
    description: 'May see only self',
    resolve: (source, args, context) => {
        const { auth } = context;
        if (auth.decodedToken) {
            const { decodedToken: { userId: user_id, role } } = auth;
            return user_id === source._id.toString() || role === 'admin' ? source.password : null;
        } else {
            return null;
        }
    },
    projection: { _id: 1 }
});

const scopesSchema = {
    query: {
        // no special permission needed
        userCount: '',
        // need permission what from scope.js
        userById: ['permissionAccess'],
        userMany: ['permissionAccess'],
        userPagination: ['permissionAccess']
    },
    mutation: {
        // need permission where from scope.js
        userRemoveById: ['permissionAccess'],
        // verify the fields
        userCreate: ['fieldsAccess'],
        // need permission where from scope.js and verify the fields
        userUpdateById: ['permissionAccess', 'fieldsAccess']
    }
};
const userQuery = wrapResolvers({
    userCount: UserTC.get('$count'),
    userById: UserTC.get('$findById'),
    userMany: UserTC.get('$findMany'),
    userPagination: UserTC.get('$pagination')
}, scopesSchema.query);
const userMutation = wrapResolvers({
    userRemoveMany: UserTC.get('$removeMany'),
    userRemoveById: UserTC.get('$removeById'),
    userUpdateById: UserTC.get('$updateById'),
    userCreate: UserTC.get('$createOne')
}, scopesSchema.mutation);
export { UserTC, userQuery, userMutation };
