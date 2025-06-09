import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      // Make password optional but still validate length if provided
      required: function () {
        // Only require password for registered users (those with isVerified true)
        return this.isVerified === true;
      },
      minlength: [6, "Password must be at least 6 characters"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
      default: null,
    },
    verificationCodeExpiry: {
      type: Date,
      default: null,
    },
    verificationToken: String,
    verificationTokenExpiry: Date,
    resetPasswordToken: String,
    resetPasswordTokenExpiry: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    // Payment related fields
    hasValidPayment: {
      type: Boolean,
      default: false,
    },
    paymentExpiryDate: {
      type: Date,
      default: null,
    },
    lastPaymentId: {
      type: String,
      default: null,
    },
    paymentHistory: [
      {
        paymentId: String,
        amount: Number,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Check if verification token is expired
userSchema.methods.isVerificationTokenExpired = function () {
  return (
    this.verificationTokenExpiry && this.verificationTokenExpiry < Date.now()
  );
};

// Check if password reset token is expired
userSchema.methods.isPasswordResetTokenExpired = function () {
  return (
    this.resetPasswordTokenExpiry && this.resetPasswordTokenExpiry < Date.now()
  );
};

const User = mongoose.model("User", userSchema);

export default User;
