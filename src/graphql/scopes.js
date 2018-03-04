function isOwnerById(decodedToken, args) {
    const { userId } = decodedToken;
    let isOwner = false;
    if (userId && userId === args._id) {
        isOwner = true;
    }
    return isOwner;
}
function isOwnerByRecordId(decodedToken, args) {
    const { userId } = decodedToken;
    let isOwner = false;
    if (userId && args.record && userId === args.record._id) {
        isOwner = true;
    }
    return isOwner;
}
function isOwnerByCustomId(decodedToken, args, customId = 'record.author') {
    const { userId } = decodedToken;
    let isOwner = false;
    let owner_id = args;
    for (const key of customId.split('.')) {
        if (owner_id[key]) {
            owner_id = owner_id[key];
        } else {
            owner_id = undefined;
            break;
        }
    }
    if (userId && userId === owner_id) {
        isOwner = true;
    }
    return isOwner;
}
function isAdmin(decodedToken) {
    const { role } = decodedToken;
    return role === 'admin';
}
const scopes = {
    query: {
        // 若是自己
        userById(decodedToken, args) {
            return isOwnerById(decodedToken, args) ? 'user:view:self' : 'user:view';
        },
        userMany: 'user:view:all',
        userCount: '',
        userPagination: 'user:view:all',
        tagMany: '',
        tagById: '',
        categoryMany: '',
        categoryById: '',
        articleById: '',
        articleMany: '',
        articlePagination: ''
    },
    mutation: {
        userCreate: '',
        userUpdateById(decodedToken, args) {
            return isOwnerByRecordId(decodedToken, args) ? 'user:update:self' : 'user:update';
        },
        userRemoveById(decodedToken, args) {
            return isOwnerById(decodedToken, args) ? 'user:delete:self' : 'user:delete';
        },
        tagCreate(decodedToken, args) {
            return isOwnerByCustomId(decodedToken, args) ? 'tag:create:self' : 'tag:create';
        },
        tagUpdateById: '',
        tagRemoveById(decodedToken, args) {
            const { userId } = decodedToken;
            rp.beforeRecordMutate = (doc, resolverParams) => {
                if (doc && doc.author.toString() === userId) {
                    return doc;
                }
                return null;
            };
        },
        tagRemoveByName(decodedToken) {
            return isAdmin(decodedToken) ? 'tag:delete' : 'tag:delete:self';
        },
        categoryCreate(decodedToken, args) {
            return isOwnerByCustomId(decodedToken, args) ? 'tag:create:self' : 'tag:create';
        },
        categoryUpdateById: '',
        categoryRemoveById(decodedToken, args) {
            const { userId } = decodedToken;
            rp.beforeRecordMutate = (doc, resolverParams) => {
                if (doc && doc.author.toString() === userId) {
                    return doc;
                }
                return null;
            };
        },
        categoryRemoveByName(decodedToken) {
            return isAdmin(decodedToken) ? 'category:delete' : 'category:delete:self';
        },
        articleCreate: '',
        articleUpdateById: '',
        articleRemoveById(decodedToken, args) {
            const { userId } = decodedToken;
            rp.beforeRecordMutate = (doc, resolverParams) => {
                if (doc && doc.author.toString() === userId) {
                    return doc;
                }
                return null;
            };
        },
        tokenByAccount: '',
        tokenByRefreshToken(decodedToken) {
            return isAdmin(decodedToken) ? 'token:update' : 'token:update:self';
        }
    }
};
export default scopes;
