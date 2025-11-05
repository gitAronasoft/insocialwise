const mongoose = require('mongoose');
const uri = 'mongodb+srv://insocialwise:insocialwise@cluster0.vybqi.mongodb.net/insocialwise?retryWrites=true&w=majority&appName=Cluster0';

try {
    mongoose.connect(uri);           
    console.log('Connected to MongoDB');
} catch (error) {
    console.error('Error connecting to MongoDB:', error.message);        
    process.exit(1);     
}


