import mongoose from 'mongoose';
import composeWithMongoose from 'graphql-compose-mongoose';
// import { GraphQLString, GraphQLNonNull } from 'graphql';
import { UserTC } from './user';
import { CategoryTC } from './category';
import { TagTC } from './tag';
import wrapResolvers from '../wrapper';
// import mongoid from 'graphql-compose-mongoose/lib/types/mongoid';
const ArticleModel = mongoose.model('Article');
// STEP 2: CONVERT MONGOOSE MODEL TO GraphQL PIECES
const customizationOptions = {}; // left it empty for simplicity, described below
const ArticleTC = composeWithMongoose(ArticleModel, customizationOptions);
ArticleTC.addRelation(
    'author',
    {
        resolver: () => UserTC.get('$findById'),
        prepareArgs: {
            _id: source => source.author
        },
        projection: { author: true }
    }
);
ArticleTC.addRelation(
    'categorys',
    {
        resolver: () => CategoryTC.get('$findByIds'),
        prepareArgs: {
            _ids: source => source.categorys
        },
        projection: { categorys: true }
    }
);
ArticleTC.addRelation(
    'tags',
    {
        resolver: () => TagTC.get('$findByIds'),
        prepareArgs: {
            _ids: source => source.tags
        },
        projection: { tags: true }
    }
);
const scopesSchema = {
    mutation: {
        articleRemoveById: ['permissionAccess'],
        articleCreate: ['permissionAccess', 'fieldsAccess'],
        articleUpdateById: ['permissionAccess', 'fieldsAccess']
    }
};
const articleQuery = {
    articleMany: ArticleTC.get('$findMany')
};
const articleMutation = wrapResolvers({
    // articleRemoveByName: ArticleTC.get('$removeByName'),
    articleRemoveById: ArticleTC.get('$removeById'),
    articleCreate: ArticleTC.get('$createOne'),
    articleUpdateById: ArticleTC.get('$updateById')
}, scopesSchema.mutation);
export { ArticleTC, articleQuery, articleMutation };
