const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const uri = process.env.MONGO_URI;
const adminEmail = process.env.ADMIN_EMAIL || 'sam@shaikhameermaviyagmail.com';
const adminPassword = process.env.ADMIN_PASSWORD || 'Wellcom33';
const adminUsername = process.env.ADMIN_USERNAME || 'sam_admin';

async function run() {
  if (!uri) {
    console.error('❌ MONGO_URI is missing in .env.local');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    const db = client.db();
    const users = db.collection('users');
    const channels = db.collection('channels');

    let user = await users.findOne({ email: adminEmail });
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    if (user) {
      console.log('ℹ️ User found. Updating password and ensuring Admin role...');
      await users.updateOne(
        { _id: user._id },
        { 
          $set: { 
            password: hashedPassword,
            role: 'admin',
            status: 'active',
            updatedAt: new Date()
          } 
        }
      );
      console.log('✅ User successfully updated.');
    } else {
      console.log('ℹ️ User not found. Creating new Admin account...');
      const result = await users.insertOne({
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      user = { _id: result.insertedId };
      console.log('✅ Admin account created successfully.');
    }

    // Check for corresponding channel
    const channel = await channels.findOne({ owner: user._id });
    if (!channel) {
      console.log('ℹ️ Creating channel for admin user...');
      const channelSlug = adminUsername.toLowerCase().replace(/[^a-z0-9]/g, '-');

      await channels.insertOne({
        owner: user._id,
        name: `${adminUsername}'s Channel`,
        slug: channelSlug,
        description: 'Official Admin Channel',
        logo: '',
        banner: '',
        subscriberCount: 0,
        videoCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Admin Channel created successfully.');
    } else {
      console.log('✅ Admin Channel already exists.');
    }

    console.log('\n🎉 Admin setup complete!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

run();
