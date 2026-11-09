const mongoose = require('mongoose');

const STATUSES = ['Pending', 'Approved', 'Rejected'];

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: [true, 'Subject is required'] },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be between 1 and 12'],
      max: [12, 'Semester must be between 1 and 12'],
      validate: { validator: Number.isInteger, message: 'Semester must be a whole number' },
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: [true, 'Category is required'] },
    tags: { type: [String], default: [] },
    originalFileName: { type: String, required: true },
    storedFileName: { type: String, required: true, unique: true },
    filePath: { type: String, required: true },
    fileType: { type: String, required: true, lowercase: true },
    fileSize: { type: Number, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: STATUSES, default: 'Pending' },
    rejectionReason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

// Indexes for the common filters, sorting and "my uploads" queries.
// Keyword search uses case-insensitive partial matching on title/description/tags.
resourceSchema.index({ status: 1, createdAt: -1 });
resourceSchema.index({ status: 1, subject: 1, semester: 1, category: 1 });
resourceSchema.index({ uploadedBy: 1, createdAt: -1 });
resourceSchema.index({ fileType: 1 });
resourceSchema.index({ tags: 1 });
resourceSchema.index({ title: 1 });

resourceSchema.virtual('downloadUrl').get(function downloadUrl() {
  return `/api/resources/${this._id}/download`;
});

// Do not expose server-side file locations; clients use downloadUrl instead
resourceSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.filePath;
    delete ret.storedFileName;
    delete ret.__v;
    delete ret.id;
    return ret;
  },
});

const Resource = mongoose.model('Resource', resourceSchema);
Resource.STATUSES = STATUSES;

module.exports = Resource;
