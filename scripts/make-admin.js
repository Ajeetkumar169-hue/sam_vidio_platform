const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function run() {
  const uri = 'mongodb://127.0.0.1:27017/video-platform';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const users = db.collection('users');
    let admin = await users.findOne({ role: 'admin' });
    if (!admin) {
        let firstUser = await users.findOne({});
        if(firstUser) {
           await users.updateOne({_id: firstUser._id}, { "$set": { role: 'admin' } });
           console.log('Made existing user admin:', firstUser.email);
           admin = await users.findOne({ role: 'admin' });
        } else {
           const hashedPassword = await bcrypt.hash('password123', 12);
           await users.insertOne({
              username: 'admin',
              email: 'admin@example.com',
              password: hashedPassword,
              role: 'admin',
              status: 'active',
              createdAt: new Date(),
              updatedAt: new Date()
           });
           console.log('Created new admin user: admin@example.com / password123');
           admin = await users.findOne({ role: 'admin' });
        }
    } else {
       console.log('Admin already exists:', admin.email);
    }
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
