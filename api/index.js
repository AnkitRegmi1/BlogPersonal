const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');

const uploadMiddleware = multer({ dest: 'uploads/' });

const salt = bcrypt.genSaltSync(10);
const secret = 'adfojror45okmkfn0r';

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

mongoose.connect('mongodb+srv://pp16241:ZFvihc1PyBSmEuny@cluster0.eb5qtvr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userDoc = await User.create({
            username,
            password: bcrypt.hashSync(password, salt),
        });
        res.json(userDoc);
    } catch (e) {
        res.status(400).json(e.message);
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const userDoc = await User.findOne({ username });

    if (!userDoc) {
        return res.status(400).json('incorrect username or password');
    }

    const passOk = bcrypt.compareSync(password, userDoc.password);

    if (passOk) {
        jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token).json('ok');
        });
    } else {
        res.status(400).json('incorrect username or password');
    }
});

app.get('/profile', (req, res) => {
    const { token } = req.cookies;
    jwt.verify(token, secret, {}, (err, info) => {
        if (err) throw err;
        res.json(info);
    });
});

app.post('/logout', (req, res) => {
    res.cookie('token', '').json('logged out');
});

app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
    try {
        console.log('File:', req.file); // Log the file information
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { originalname, path } = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        const newPath = path + '.' + ext;
        fs.renameSync(path, newPath);

        const { token } = req.cookies;
        jwt.verify(token, secret, {}, async (err, info) => {
            if (err) throw err;
            const { title, summary, content } = req.body;
            const postDoc = await Post.create({
                title,
                summary,
                content,
                cover: newPath,
                author: info.id,
            });
            res.json(postDoc);
        });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
    let newPath = null;
    if (req.file) {
        const { originalname, path } = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        newPath = path + '.' + ext;
        fs.renameSync(path, newPath);
    }

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;

        const { id, title, summary, content } = req.body;

        try {
            const postDoc = await Post.findById(id);

            if (!postDoc) {
                return res.status(404).json({ error: 'Post not found' });
            }

            const isAuthor = postDoc.author.equals(info.id);
            if (!isAuthor) {
                return res.status(400).json('You are not the author');
            }

            // Update the post document
            postDoc.title = title;
            postDoc.summary = summary;
            postDoc.content = content;
            postDoc.cover = newPath ? newPath : postDoc.cover;
            await postDoc.save();

            res.json(postDoc);
        } catch (error) {
            console.error('Error updating post:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
});




app.get('/post', async (req, res) => {
    res.json(
        await Post.find()
            .populate('author', ['username'])
            .sort({ createdAt: -1 })
            .limit(20)
    );
});

app.get('/post/:id', async (req, res) => {
    const { id } = req.params;
    const postDoc = await Post.findById(id).populate('author',['username']);
    res.json(postDoc);
});

app.listen(4000, () => {
    console.log('Server is running on port 4000');
});
