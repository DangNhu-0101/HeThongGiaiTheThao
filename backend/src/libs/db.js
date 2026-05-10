import mogoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
    try {
        await mogoose.connect(process.env.MONGODB_CONNECTIONSTRING);
        console.log('connect mongoseDB success')
    }
    catch (error) {
        console.log('error mongoseDB connect', error)
        process.exit(1);
    }
};