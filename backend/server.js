const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = 'mongodb://127.0.0.1:27017/mental_health_app';
const SECRET_KEY = 'your_secret_key';
const EMAIL_SECRET = 'your_email_secret_key';  // Use a different secret key for email verification

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema and Model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  profile: {
    age: Number,
    gender: String,
    preferences: String,
  }
});

const User = mongoose.model('User', userSchema);

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'your_email@gmail.com', // Replace with your email
    pass: 'your_app_password', // Replace with your app password
  },
});

// Middleware to authenticate requests
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  console.log('Authenticating token:', token);
  if (!token) {
    console.log('No token provided, access denied.');
    return res.status(401).send('Access denied');
  }
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.userId = decoded.userId;
    console.log('Token authenticated, user ID:', req.userId);
    next();
  } catch (err) {
    console.log('Invalid token:', err.message);
    res.status(400).send('Invalid token');
  }
};

// Helper functions to validate email and password
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

const validatePassword = (password) => {
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return re.test(password);
}

// Register Route
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  console.log(`Received registration request with body: ${JSON.stringify(req.body)}`);  // Log the request body

  if (!email || !password) {
    console.log('Email or password missing');
    return res.status(400).send('Email and password are required');
  }

  if (!validateEmail(email)) {
    console.log('Invalid email format');
    return res.status(400).send('Invalid email format');
  }

  if (!validatePassword(password)) {
    console.log('Password does not meet criteria');
    return res.status(400).send('Password must be at least 8 characters long and include an upper case letter, a lower case letter, a number, and a special character');
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already registered:', email);
      return res.status(400).send('User already registered. Try signing in.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    console.log(`User registered: ${email}`);

    // Create email verification token
    const emailToken = jwt.sign({ userId: user._id }, EMAIL_SECRET, { expiresIn: '1d' });

    // Send verification email
    const url = `http://localhost:5000/verify-email?token=${emailToken}`;
    await transporter.sendMail({
      to: email,
      subject: 'Verify your email',
      html: `Please click this link to verify your email: <a href="${url}">${url}</a>`,
    });

    res.status(201).send('User registered. Verification email sent.');
  } catch (error) {
    console.error('Error registering user:', error.message);
    res.status(500).send('Error registering user');
  }
});

// Email Verification Route
app.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token, EMAIL_SECRET);
    console.log('Decoded token:', decoded);

    const user = await User.findByIdAndUpdate(decoded.userId, { isVerified: true }, { new: true });
    if (!user) {
      console.log('User not found for verification');
      return res.status(400).send('User not found for verification');
    }

    console.log('User verified:', user);
    res.send('Email verified successfully. You can now log in.');
  } catch (error) {
    console.error('Email verification error:', error.message);
    res.status(400).send('Email verification failed.');
  }
});

// Login Route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`Received login request for: ${email}`);
  try {
    const user = await User.findOne({ email });
    console.log(`User found: ${user}`); // Log user object
    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(401).send('Invalid credentials');
    }
    if (!user.isVerified) {
      console.log(`User not verified: ${email}`);
      return res.status(401).send('Email not verified. Please check your email.');
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log(`Password match: ${passwordMatch}`); // Log password match result
    if (!passwordMatch) {
      console.log(`Invalid password for user: ${email}`);
      return res.status(401).send('Invalid credentials');
    }
    const token = jwt.sign({ userId: user._id }, SECRET_KEY);
    console.log(`User logged in: ${email}`);
    res.json({ token });
  } catch (error) {
    console.error('Error logging in user:', error.message);
    res.status(500).send('Error logging in user');
  }
});

// Update Profile Route
app.put('/profile', authenticate, async (req, res) => {
  const { age, gender, preferences } = req.body;
  console.log(`Received profile update request for user ID: ${req.userId}`);
  try {
    const user = await User.findByIdAndUpdate(req.userId, { profile: { age, gender, preferences } }, { new: true });
    console.log(`Profile updated for user: ${user.email}`);
    res.json(user);
  } catch (error) {
    console.error('Error updating profile:', error.message);
    res.status(500).send('Error updating profile');
  }
});

// Initial Assessment Route
app.post('/assessment', authenticate, (req, res) => {
  const { answers } = req.body;
  console.log(`Received assessment request for user ID: ${req.userId} with answers: ${answers}`);

  const options = {
    mode: 'text',
    pythonOptions: ['-u'], // get print results in real-time
    args: [JSON.stringify(answers)]
  };

  PythonShell.run('predict.py', options, (err, result) => {
    if (err) {
      console.error(`Assessment error for user ID: ${req.userId} - ${err.message}`);
      return res.status(500).send('Assessment error');
    }
    console.log(`Assessment result for user ID: ${req.userId} - ${result[0]}`);
    res.json({ result: result[0] });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
