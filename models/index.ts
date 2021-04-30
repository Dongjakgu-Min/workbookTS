import mongoose from 'mongoose';
import surveySchema from './schema/survey';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';
import isWsl from 'is-wsl';
import autoIncrement from 'mongoose-auto-increment';

dotenv.config({ path: path.join(process.cwd(), '.env') });

mongoose.Promise = global.Promise;

if (isWsl) {
    const URI = dns.getServers()[0];
    mongoose.connect('mongodb://' + URI + ':27017/test', { 
            auth: {
                user: process.env.MONGO_USERNAME as string,
                password: process.env.MONGO_PASSWORD as string
            },
            useNewUrlParser: true, useUnifiedTopology: true 
        })
        .then(() => console.log('MongoDB Connected'))
        .catch(err => console.log(err));
}
else
    mongoose.connect('mongodb://localhost:27017/test', { 
            auth: {
                user: process.env.MONGO_USERNAME as string,
                password: process.env.MONGO_PASSWORD as string
            },
            useNewUrlParser: true, useUnifiedTopology: true 
        })
        .then(() => console.log('MongoDB Connected'))
        .catch(err => console.log(err));

autoIncrement.initialize(mongoose.connection);

const db = {...surveySchema(autoIncrement)};

export default db;