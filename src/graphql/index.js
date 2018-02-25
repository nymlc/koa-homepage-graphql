// import mongoose from 'mongoose';
// import fs from 'fs';
// import path from 'path';
// import { printSchema } from 'graphql/utilities';
import { GQC } from 'graphql-compose';
import { userQuery, userMutation } from './fields/user';
import { tagQuery, tagMutation } from './fields/tag';
import { categoryQuery, categoryMutation } from './fields/category';
import { articleQuery, articleMutation } from './fields/article';
import { tokenMutation } from './fields/token';
GQC.rootQuery().addFields({
    ...userQuery,
    ...articleQuery,
    ...tagQuery,
    ...categoryQuery
});
GQC.rootMutation().addFields({
    ...userMutation,
    ...articleMutation,
    ...tagMutation,
    ...categoryMutation,
    ...tokenMutation
});
const graphqlSchema = GQC.buildSchema();
// Save user readable type system shorthand of schema
// const gqlFile = path.join(__dirname, './schema.graphql');
// fs.writeFileSync(gqlFile, printSchema(graphqlSchema));
export default graphqlSchema;
/*
schemaComposer.rootQuery().addFields({
  userById: UserTC.getResolver('findById'),
  userByIds: UserTC.getResolver('findByIds'),
  userOne: UserTC.getResolver('findOne'),
  userMany: UserTC.getResolver('findMany'),
  userCount: UserTC.getResolver('count'),
  userConnection: UserTC.getResolver('connection'),
  userPagination: UserTC.getResolver('pagination'),
});

schemaComposer.rootMutation().addFields({
  userCreate: UserTC.getResolver('createOne'),
  userUpdateById: UserTC.getResolver('updateById'),
  userUpdateOne: UserTC.getResolver('updateOne'),
  userUpdateMany: UserTC.getResolver('updateMany'),
  userRemoveById: UserTC.getResolver('removeById'),
  userRemoveOne: UserTC.getResolver('removeOne'),
  userRemoveMany: UserTC.getResolver('removeMany'),
});
*/
