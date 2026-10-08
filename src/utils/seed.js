require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const seedDB = async () => {
  try {
    await connectDB();
    console.log('Seeding Database...');

    const users = [
      {
        name: 'Admin User',
        email: 'admin@crm.com',
        password: 'Admin@123',
        phone: '9876543210',
        role: 'admin',
      },
      {
        name: 'Sales Manager',
        email: 'manager@crm.com',
        password: 'Manager@123',
        phone: '9876543211',
        role: 'sales_manager',
      },
    ];

    let managerId = null;

    for (const u of users) {
      let existingUser = await User.findOne({ email: u.email });
      if (!existingUser) {
        existingUser = await User.create(u);
        console.log(`Created: ${u.email} / ${u.password}`);
      } else {
        console.log(`Already exists: ${u.email}`);
      }
      if (u.role === 'sales_manager') {
        managerId = existingUser._id;
      }
    }

    const execs = [
      {
        name: 'Executive One',
        email: 'exec1@crm.com',
        password: 'Exec@1234',
        phone: '9876543212',
        role: 'sales_executive',
        manager: managerId,
      },
      {
        name: 'Executive Two',
        email: 'exec2@crm.com',
        password: 'Exec@1234',
        phone: '9876543213',
        role: 'sales_executive',
        manager: managerId,
      },
    ];

    for (const exec of execs) {
      let existingExec = await User.findOne({ email: exec.email });
      if (!existingExec) {
        await User.create(exec);
        console.log(`Created: ${exec.email} / ${exec.password}`);
      } else {
        console.log(`Already exists: ${exec.email}`);
      }
    }

    console.log('Seeding Complete');
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
};

seedDB();
