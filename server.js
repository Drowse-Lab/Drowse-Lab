require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');

const app = express();
const clientID = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;
const redirectURI = 'http://localhost:3000/callback';

// セキュリティヘッダーの設定
app.use(helmet());

// CORSの設定
app.use(cors({ origin: 'http://localhost:3000' }));

app.get('/login', (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    const githubAuthURL = `https://github.com/login/oauth/authorize?client_id=${clientID}&redirect_uri=${redirectURI}&state=${state}`;
    res.redirect(githubAuthURL);
});

app.get('/callback', async (req, res) => {
    const { code, state } = req.query;

    try {
        const tokenResponse = await axios.post(`https://github.com/login/oauth/access_token`, {
            client_id: clientID,
            client_secret: clientSecret,
            code: code
        }, {
            headers: {
                accept: 'application/json'
            }
        });

        const accessToken = tokenResponse.data.access_token;
        res.redirect(`/app?token=${accessToken}`);
    } catch (error) {
        console.error('Error during GitHub OAuth callback:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/commits', async (req, res) => {
    const token = req.query.token;

    try {
        const usernameResponse = await axios.get(`https://api.github.com/user`, {
            headers: {
                Authorization: `token ${token}`
            }
        });

        const username = usernameResponse.data.login;
        const today = new Date().toISOString().split('T')[0];
        const commitsResponse = await axios.get(`https://api.github.com/search/commits?q=author:${username}+committer-date:${today}`, {
            headers: {
                Accept: 'application/vnd.github.cloak-preview',
                Authorization: `token ${token}`
            }
        });

        res.json(commitsResponse.data.items);
    } catch (error) {
        console.error('Error fetching commits:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
