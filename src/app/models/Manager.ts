import mongoose, { Schema } from 'mongoose';

const ManagerSchema: Schema = new mongoose.Schema({
  // --- No changes to these fields ---
  id: {
    type: Number,
    index: true,
  },
  cognitoId: {
    type: String,
    unique: true,
    required: [true, 'Cognito ID is required.'],
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Name is required.'],
  },
  email: {
    type: String,
    required: [true, 'Email is required.'],
  },
  phoneNumber: {
    type: String,
    // Note: If your form sends empty strings, `required: false` is fine.
    // If it might send `null` or `undefined`, you can remove `required` entirely.
  },
  properties: {
    type: [Number],
    default: [],
  },
  applications: {
    type: [Number],
    default: [],
  },

  // --- ADD THESE NEW FIELDS (Copied from Landlord) ---
  companyName: {
    type: String,
  },
  address: {
    type: String,
  },
  description: {
    type: String,
  },
  businessLicense: {
    type: String, // Storing URL or Base64 string
  },
  profileImage: {
    type: String, // Storing URL or Base64 string
  },
  status: {
    type: String,
    enum: ['approved', 'pending', 'rejected'],
    default: 'pending',
  },
  businessAddress: {
    type: String,
    required: [false, 'Business address is not required.'],
  },
  postalCode: {
    type: String,
    required: [false, 'Postal code is not required.'],
  },
  cityName: {
    type: String,
    required: [false, 'City name is not required.'],
  },
  country: {
    type: String,
    required: [false, 'Country is not required.'],
  },
  vatId: {
    type: String,
    required: [false, 'VAT ID is not required.'],
  },
  website: {
    type: String,
    required: [false, 'Website is not required.'],
    validate: {
      validator: function(v : any) {
        if (!v) return true; // Allow empty/null values
        // Basic URL validation
        const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
        return urlPattern.test(v);
      },
      message: 'Please enter a valid website URL'
    }
  },
  // 'agency' field from original Manager model removed as it seems replaced by companyName
}, {
  timestamps: true, // This adds createdAt and updatedAt automatically
});

const Manager = mongoose.models.Manager || mongoose.model('Manager', ManagerSchema);
export default Manager;