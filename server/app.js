require('dotenv').config();
const path = require('path');
const express = require('express');
const compression = require('compression');
const favicon = require('serve-favicon');
const mongoose = require('mongoose');
const expressHandlebars = require('express-handlebars');
//security library for express, sets a bunch of default options for
//us to obscure info from malicious attacks
const helmet = require('helmet');
const session = require('express-session');
const RedisStore = require('connect-redis').RedisStore;
const redis = require('redis');

const router = require('./router.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const dbURI = process.env.MONGODB_URI || 'mongodb+srv://kr7284_db_user:Lj7k!x-LZzWZiKA@cluster0.ya2avs6.mongodb.net/DomoMaker';
mongoose.connect(dbURI).catch((err) => {
    if (err) {
        console.log('Could not connect to a database');
        throw err;
    }
});

const redisClient = redis.createClient({
    url: process.env.REDISCLOUD_URL,
});
redisClient.on('error', err => console.log('Redis Client Error', err));

redisClient.connect().then(() => {

    const app = express();

    app.use(helmet());
    app.use('/assets', express.static(path.resolve(`${__dirname}/../hosted`)));
    app.use(favicon(`${__dirname}/../hosted/img/favicon.png`));
    app.use(compression());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    // takes several configuration options as JSON object
    // Once configured, session module will add a session obj to every
    // request object, accessed by saying “req.session”. This session object
    // can be used to track/store info unique to that user btwn requests
    app.use(session({
        key: 'sessionid',
        // private string used as seed for hashing/creating unique session
        // keys. makes it so ur unique session keys r diff frm other servers
        // using express. can be changed to anything you want, but will invalidate
        // existing session ids (isn’t necessarily huge issue)
        secret: 'Domo Arigato',
        //only send session key back to database if it changes
        resave: false,
        // prevents us from saving uninitialized sessionids to database
        saveUninitialized: false,
    }));
    //key is name of cookie so it can be tracked in requests
    //when browser sends requests, cookies will come too

    app.engine('handlebars', expressHandlebars.engine({ defaultLayout: '' }));
    app.set('view engine', 'handlebars');
    app.set('views', `${__dirname}/../views`);

    router(app);

    app.listen(port, (err) => {
        if (err) { throw err; }
        console.log(`Listening on port ${port}`);
    });

    app.use(session({
        key: 'sessionid',
        store: new RedisStore({
            client: redisClient,
        }),
        secret: 'Domo Arigato',
        resave: false,
        saveUninitialized: false,
    }));
})
