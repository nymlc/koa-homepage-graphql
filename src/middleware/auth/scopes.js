const admin = [
    'user:create',
    'user:update',
    'user:delete',
    'user:view',
    'user:view:all',
    'tag:create',
    'tag:update',
    'tag:delete',
    'tag:view',
    'tag:view:all',
    'category:create',
    'category:update',
    'category:delete',
    'category:view',
    'category:view:all',
    'article:create',
    'article:update',
    'article:delete',
    'article:view',
    'article:view:all',
    'token:update',
    'token:view:all'
];

const user = [
    'user:view:self',
    'user:update:self',
    'user:delete:self',
    'tag:create:self',
    'tag:view:self',
    'tag:update:self',
    'tag:delete:self',
    'category:create:self',
    'category:view:self',
    'category:update:self',
    'category:delete:self',
    'article:create:self',
    'article:view:self',
    'article:update:self',
    'article:delete:self',
    'token:update:self'
];

const guest = [
    'tag:view:all',
    'category:view:all',
    'article:view:all'
];
export default {
    admin: admin.concat(user, guest),
    user: user.concat(guest),
    guest
};
