const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// A user can bookmark a given resource only once
bookmarkSchema.index({ user: 1, resource: 1 }, { unique: true });
bookmarkSchema.index({ resource: 1 });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
