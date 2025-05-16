const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    content: { type: String, default: '' },
    type: { type: String, enum: ['file', 'directory'], required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublic: { type: Boolean, default: false },
    write: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    read: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'File', default: null }, // new
});


module.exports = mongoose.model('File', fileSchema);