const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['Student', 'Teacher', 'Admin'];
const ACCOUNT_STATUSES = ['Active', 'Inactive'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: { type: String, enum: ROLES, default: 'Student' },
    profileImage: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, maxlength: [300, 'Bio cannot exceed 300 characters'], default: '' },
    accountStatus: { type: String, enum: ACCOUNT_STATUSES, default: 'Active' },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ accountStatus: 1 });

// Hash the password whenever it is new or changed
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never leak the password hash in JSON responses
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);
User.ROLES = ROLES;
User.ACCOUNT_STATUSES = ACCOUNT_STATUSES;

module.exports = User;
