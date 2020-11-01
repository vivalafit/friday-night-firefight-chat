const express = require('express')
const app = express()

const server = require('http').Server(app)
const io = require('socket.io')(server)

const { v4: uuidV4 } = require('uuid')


app.set('view engine', 'ejs')
app.use(express.static('assets'))


app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

//socket
io.on('connection', socket => {
  socket.on('join-room', (roomId/*, userId*/) => {
    socket.join(roomId)
    //socket.to(roomId).broadcast.emit('user-connected', userId);
    // messages
    socket.on('message', (message) => {
      //send message to the same room
      io.to(roomId).emit('createMessage', message)
  }); 
  
    socket.on('sendStream', (stream) => {
      const a = stream
      io.to(roomId).emit('emitStream', message)
    })
    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected'/*, userId*/)
    })
  })
})

server.listen(process.env.PORT|| 3000)
