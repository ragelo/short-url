require('dotenv').config()

const bodyParser = require('body-parser')
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const shortid = require('shortid');
const Redis = require('ioredis');
const validator = require('validator');
const rateLimit = require("express-rate-limit");


const redis = new Redis(process.env.REDIS_URL)
const port = process.env.PORT || 4242
const serverDomain = process.env.DOMAIN || `http://localhost:${port}/`

const app = express()

app.enable("trust proxy"); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS if you use an ELB, custom Nginx setup, etc)

app.use(morgan('tiny'))
app.use(helmet())
app.use(cors())

app.use(express.static('public'))

const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10 // limit each IP to 10 requests per windowMs
});

app.post(
    '/api/url',
    bodyParser.json(),
    limiter,
    async (request, response, next) => {
        console.log(request.body)
        if (!validator.isURL(request.body.originalURL, {
            require_valid_protocol: true,
            protocols: ['https'],
        })) {
            next(new Error('URL should be not empty and use https protocol'))
            return;
        }

        // validate originalURL
        const id = shortid.generate();
        await redis.set(id, request.body.originalURL)

        response.json({
            id: id,
            url: `${serverDomain}${id}`,
            originalURL: request.body.originalURL,
        })
    }
)

app.get('/:id', async (request, response, next) => {
    const url = await redis.get(request.params.id)
    if (!url) {
        response.redirect('/')
    } else {
        response.redirect(url)
    }
})

app.get('*', (request, response) => {
    response.redirect('/')
})

app.use((error, requests, response, next) => {
    console.error(error)
    response.json({
        message: error.message,
    })
})

app.listen(port, () => {
    console.log(`Listening at localhost:${port}`)
})
