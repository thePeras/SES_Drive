import { Schema, model } from 'mongoose';

const fileSchema = new Schema({
    name: { type: String, required: true },
    content: { type: String, default: '' },
    type: { type: String, enum: ['file', 'directory'], required: true },
    mimeType: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isPublic: { type: Boolean, default: false },
    permissions: [
        {
            user: { type: Schema.Types.ObjectId, ref: 'User' },
            access: { type: String, enum: ['read', 'write'], required: true },
        },
    ],
    parent: { type: Schema.Types.ObjectId, ref: 'File', default: null },
});

const File = model('File', fileSchema);

export const findById = async (id) => {
    try {
        const file = await File.findById(id)
            .populate('owner', 'username')
            .populate('permissions.user', 'username')
            .populate('parent', 'name');
        return file;
    } catch (err) {
        console.error('Error finding file by ID:', err);
        throw err;
    }
};


export default File;
