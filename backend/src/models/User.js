import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: true, // The document cannot be saved without this field
        trim: true //Removes whitespace from both ends of the string
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensures that no two documents have the same email
        lowercase: true, // Converts the email to lowercase before saving
        trim: true
    },
    password: {
        type: String,
        select: false, // Excludes the password field from query results by default
    },
    provider: {
        type: String,
        enum: ['local', 'google'], // Restricts the value to either 'local' or 'google'
        default: 'local' // Sets the default value to 'local'
    },
    providerId: {
        type: String,
        default: null // This field is only relevant for users who sign in with Google
    },
    avatar: {
        type: String,
        default: null
    },
    isEmailVerified: {
        type: Boolean,
        default: false // Indicates whether the user's email has been verified
    }
    
}, { timestamps: true }); // MongoDB automatically adds createdAt and updatedAt fields to the schema

userSchema.pre('save', async function () {
    // If the password hasn't changed, skip hashing
    if (!this.isModified("password")) {
        return;
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const salt = await bcrypt.genSalt(saltRounds); // Generate a salt for hashing
    
    this.password = await bcrypt.hash(this.password, salt); // Hash the password before saving
});

const user = mongoose.model('User', userSchema);

export default user;