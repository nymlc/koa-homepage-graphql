import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }, // 类别
    created_at: {
        type: Date,
        default: Date.now
    }
});
const Category = mongoose.model('Category', CategorySchema);
export default Category;
