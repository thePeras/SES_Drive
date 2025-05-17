import { Schema, model } from 'mongoose';

const fileSchema = new Schema({
    name: { type: String, required: true },
    content: { type: String, default: '' },
    type: { type: String, enum: ['file', 'directory'], required: true },
    mimeType: { type: String },  // new field for actual MIME type
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isPublic: { type: Boolean, default: false },
    write: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    read: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    parent: { type: Schema.Types.ObjectId, ref: 'File', default: null },
});

export const findById = async (id) => {
    try {
        const file = await File.findById(id)
            .populate('owner', 'username')
            .populate('write', 'username')
            .populate('read', 'username')
            .populate('parent', 'name');
        return file;
    }
    catch (err) {
        console.error('Error finding file by ID:', err);
        throw err;
    }
    }


export default model('File', fileSchema);