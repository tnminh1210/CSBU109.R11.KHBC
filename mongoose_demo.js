require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shop_mongoose_db';
mongoose.connect(MONGO_URI)
    .then(() => console.log("-> Connected to MongoDB successfully via Mongoose ODM!"))
    .catch(err => console.error("MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        minlength: [2, 'Full name must be at least 2 characters long']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        validate: {
            validator: function(v) {
                return /^(03|05|07|08|09)[0-9]{8}$/.test(v);
            },
            message: props => `${props.value} is not a valid Vietnamese phone number!`
        }
    },
    age: {
        type: Number,
        min: [18, 'User age must be at least 18'],
        max: [100, 'Invalid age']
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'manager'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userSchema.virtual('displayInfo').get(function() {
    return `${this.fullName} <${this.email}> [${this.role.toUpperCase()}]`;
});

userSchema.statics.findActiveByRole = function(roleName) {
    return this.find({ role: roleName, isActive: true }).sort({ fullName: 1 });
};

userSchema.methods.softDelete = async function() {
    this.isDeleted = true;
    this.isActive = false;
    return await this.save();
};


userSchema.pre(/^find/, function() {
    this.where({ isDeleted: { $ne: true } });
});

userSchema.pre('save', function() {
    console.log(`[Middleware Pre-save] Preparing to save user: ${this.fullName}`);
});

const User = mongoose.model('User', userSchema);

async function runMongooseCRUD() {
    try {
        await User.deleteMany({});

        const newUser = await User.create({
            fullName: "Nguyen Van Hung",
            email: "hung.nguyen@example.com",
            phone: "0912345678",
            age: 22,
            role: "admin"
        });
        console.log("1. [CREATE] Successfully created user:", newUser.displayInfo);

        let foundBefore = await User.findOne({ email: "hung.nguyen@example.com" });
        console.log("2. [READ BEFORE DELETE] Found user:", foundBefore ? foundBefore.fullName : "Not found");

        console.log("\n-> Executing soft delete on user...");
        await newUser.softDelete();

        let foundAfter = await User.findOne({ email: "hung.nguyen@example.com" });
        console.log("3. [READ AFTER SOFT DELETE] Found user (Expected null due to query hook):", foundAfter);

    } catch (error) {
        console.error("Mongoose validation/operation error:", error.message);
    } finally {
        await mongoose.connection.close();
        console.log("-> Mongoose connection closed.");
    }
}

runMongooseCRUD();