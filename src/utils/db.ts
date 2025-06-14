import mongoose, { Document, Types } from 'mongoose';

interface ConnectionState {
    isConnected?: number | boolean;
}

const connection: ConnectionState = {};
async function connect() {
    if (connection.isConnected) {
        console.log('already connected');
        return;
    }
    if (mongoose.connections.length > 0) {
        connection.isConnected = mongoose.connections[0].readyState;
        if (connection.isConnected === 1) {
            console.log('use previous connection');
            return;
        }
        await mongoose.disconnect();
    }
    const db = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('new connection');
    connection.isConnected = db.connections[0].readyState;
}
async function disconnect() {
    if (connection.isConnected) {
        if (process.env.NODE_ENV === 'production') {
            await mongoose.disconnect();
            connection.isConnected = false;
        } else {
            console.log('not disconnected');
        }
    }
}
interface HasId extends Document {
    _id: Types.ObjectId; // Ensure _id is recognized as ObjectId
    createdAt?: Date;
    updatedAt?: Date;
}
function convertDocToObj<T extends HasId>(doc: T) {
    return {
        ...doc.toObject(), // Convert to plain object
        _id: doc._id.toString(), // Convert ObjectId to string
        createdAt: doc.createdAt ? doc.createdAt.toISOString() : undefined,
        updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : undefined,
    };
}
const db = { connect, disconnect, convertDocToObj };
export default db;