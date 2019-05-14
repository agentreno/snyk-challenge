const express = require('express')
const cors = require('cors')
const redis = require('redis')
const {promisify} = require('util')
const ls = require('npm-remote-ls').ls
const app = express()
const port = 8000

client = redis.createClient({
  'host': process.env.CACHE_CONNECTION_STRING,
  'connect_timeout': 500
})
client.on('error', err => console.log(err))
const getAsync = promisify(client.get).bind(client)
const setEx = promisify(client.set).bind(client)

app.use(cors())

app.get('/health', (req, res) => {
    res.send('OK')
})

app.get('/package/:package/:version', async function(req, res) {
  const cache_key = 'deps:' + req.params['package'] + '@' + req.params['version']

  try {
    cached_tree = await getAsync(cache_key)
    if (cached_tree) {
      res.send(JSON.parse(cached_tree))
      return
    }
  } catch(err) {
    console.log('Cache get miss / fail')
    console.log(err)
  }

  ls(req.params['package'], req.params['version'], tree => {
    try {
      client.set(cache_key, JSON.stringify(tree), 'EX', 3600)
    } catch(err) {
      console.log('Cache setex miss / fail')
      console.log(err)
    }

    res.send(tree)
  })
})

app.listen(port, () => console.log('Listening...'))
