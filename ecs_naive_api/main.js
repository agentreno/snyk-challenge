const express = require('express')
const ls = require('npm-remote-ls').ls
const app = express()
const port = 8000

app.get('/health', (req, res) => {
    res.send('OK')
})

app.get('/package/:package/:version', (req, res) => {
  ls(req.params['package'], req.params['version'], tree => {
    res.send(tree)
  })
})

app.listen(port, () => console.log('Listening...'))
