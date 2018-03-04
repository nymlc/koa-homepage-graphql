import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose';
import { GraphQLString, GraphQLNonNull } from 'graphql';
import { UserTC } from './user';
import wrapResolvers from '../wrapper';
import mongoid from 'graphql-compose-mongoose/lib/types/mongoid';
import { getDecodedTokenFromContext } from '@/utils/graphql-utils';
const TagModel = mongoose.model('Tag');
// STEP 2: CONVERT MONGOOSE MODEL TO GraphQL PIECES
const customizationOptions = {}; // left it empty for simplicity, described below
const TagTC = composeWithMongoose(TagModel, customizationOptions);
TagTC.addRelation(
    'author',
    {
        resolver: () => UserTC.get('$findById'),
        prepareArgs: {
            _id: source => source.author
        },
        projection: { author: true }
    }
);
TagTC.addResolver({
    name: 'removeByName',
    kind: 'mutation',
    args: {
        name: new GraphQLNonNull(GraphQLString),
        author: {
            name: 'author',
            type: new GraphQLNonNull(mongoid)
        }
    },
    type: TagTC.get('$removeById').getType(),
    resolve: ({ _, args, context, info }) => {
        const { name, author } = args;
        const decodedToken = getDecodedTokenFromContext(context);
        const { userId } = decodedToken;
        if (!name) {
            return Promise.reject(new Error('Tag.removeById resolver requires args.name value'));
        }
        if (!author) {
            return Promise.reject(new Error('Tag.removeById resolver requires args.author value'));
        }
        if (userId !== author) {
            return Promise.reject(new Error('Permission Denied!'));
        }
        return TagModel.findOne({ author: mongoose.Types.ObjectId(author), name }).then(doc => doc).then(doc => {
            if (!doc) {
                return Promise.reject(new Error('Document not found!'));
            }
            return doc.remove();
        }).then(record => {
            if (record) {
                return {
                    record,
                    recordId: record._id
                };
            }
            return {
                recordId: record._id
            };
        });
    }
});
const scopesSchema = {
    mutation: {
        tagRemoveById: ['permissionAccess'],
        tagCreate: ['permissionAccess', 'fieldsAccess'],
        tagUpdateById: ['permissionAccess', 'fieldsAccess']
    }
};
const tagQuery = {
    tagMany: TagTC.get('$findMany')
};
const tagMutation = wrapResolvers({
    tagRemoveByName: TagTC.get('$removeByName'),
    tagRemoveById: TagTC.get('$removeById'),
    tagCreate: TagTC.get('$createOne'),
    tagUpdateById: TagTC.get('$updateById')
}, scopesSchema.mutation);
export { TagTC, tagQuery, tagMutation };
