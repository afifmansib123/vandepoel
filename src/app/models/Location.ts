// src/lib/models/Location.js
import mongoose , {Schema} from 'mongoose';

const LocationSchema = new mongoose.Schema({
  // Field from your existing dummy data, to store the numeric ID
  id: {
    type: Number,
    index: true,
  },
  address: {
    type: String,
    required: [true, 'Address is required.'],
  },
  city: {
    type: String,
    required: [true, 'City is required.'],
  },
  state: {
    type: String,
    required: [true, 'State is required.'],
  },
  country: {
    type: String,
    required: [true, 'Country is required.'],
  },
  postalCode: {
    type: String,
    required: [true, 'Postal code is required.'],
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      // required: true, // Temporarily make not required if WKT string causes validation fail
    },
    coordinates: { // [longitude, latitude]
      type: [Number],
      // required: true, // Temporarily make not required
    },
  },
}, {
  timestamps: true,
  // IMPORTANT: If your MongoDB collection name is not 'locations', specify it:
  // collection: 'location_data'
});

// Create a 2dsphere index IF the 'coordinates' field successfully stores GeoJSON.
// If 'coordinates' is null due to WKT string, this index won't be effective on that field.
LocationSchema.index({ "coordinates": '2dsphere' });

const Location =  mongoose.models.Location || mongoose.model('Location', LocationSchema);
export default Location;