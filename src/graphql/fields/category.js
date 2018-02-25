import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose';
import { GraphQLString, GraphQLNonNull } from 'graphql';
import { UserTC } from './user';
import wrapResolvers from '../wrapper';
import mongoid from 'graphql-compose-mongoose/lib/types/mongoid';
const CategoryModel = mongoose.model('Category');
// STEP 2: CONVERT MONGOOSE MODEL TO GraphQL PIECES
const customizationOptions = {}; // left it empty for simplicity, described below
const CategoryTC = composeWithMongoose(CategoryModel, customizationOptions);
CategoryTC.addRelation(
    'author',
    {
        resolver: () => UserTC.get('$findById'),
        prepareArgs: {
            _id: source => source.author
        },
        projection: { author: true }
    }
);
CategoryTC.addResolver({
    name: 'removeByName',
    kind: 'mutation',
    args: {
        name: new GraphQLNonNull(GraphQLString),
        author: {
            name: 'author',
            type: new GraphQLNonNull(mongoid)
        }
    },
    type: CategoryTC.get('$removeById').getType(),
    resolve: ({ _, args, context, info }) => {
        const { name, author } = args;
        let user_id;
        try {
            user_id = context.auth.decodedToken.userId;
        } catch (error) {
            user_id = null;
        }
        if (!name) {
            return Promise.reject(new Error('Category.removeById resolver requires args.name value'));
        }
        if (!author) {
            return Promise.reject(new Error('Category.removeById resolver requires args.author value'));
        }
        if (user_id !== author) {
            return Promise.reject(new Error('Permission Denied!'));
        }
        return CategoryModel.findOne({ author: mongoose.Types.ObjectId(author), name }).then(doc => doc).then(doc => {
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
        categoryRemoveById: ['permissionAccess'],
        categoryCreate: ['permissionAccess', 'fieldsAccess'],
        categoryUpdateById: ['permissionAccess', 'fieldsAccess']
    }
};
const categoryQuery = {
    categoryMany: CategoryTC.get('$findMany')
};
const categoryMutation = wrapResolvers({
    categoryRemoveByName: CategoryTC.get('$removeByName'),
    categoryRemoveById: CategoryTC.get('$removeById'),
    categoryCreate: CategoryTC.get('$createOne'),
    categoryUpdateById: CategoryTC.get('$updateById')
}, scopesSchema.mutation);
export { CategoryTC, categoryQuery, categoryMutation };
