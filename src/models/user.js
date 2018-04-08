import mongoose from 'mongoose';
// import Dao from 'utils/action-dao';

// 声明schema
const UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: String,
    role: {
        type: String
        // enum: ['admin', 'user', 'guest']
    },
    avatar: {
        type: String
    }
});
// 根据schema生成model
const UserModelName = 'User';
const User = mongoose.model(UserModelName, UserSchema);
// const UserDao = Dao(User);
// UserDao.findByUsername = async username => {
//     const user = await User.findOne({ username });
//     return user;
// };
export { User };
