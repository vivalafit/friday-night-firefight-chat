const express = require('express');
const app = express();
const rollerController = require('./controllers/roller'); 
const goonController = require('./controllers/goon'); 
const fireFightController = require('./controllers/firefight');

const randomColor = require('randomcolor');
const server = require('http').Server(app);
const io = require('socket.io')(server);

const { v4: uuidV4 } = require('uuid')

app.set('view engine', 'ejs')
app.use(express.static('assets'))


app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.use('/', require('./routes/room'));
//socket connection init
io.on('connection', socket => {
  socket.on('init-room-connection', (roomId) => {
    socket.join(roomId)
    // messages
    socket.on('message', (messageObj) => {
      io.to(roomId).emit('message-created', messageObj)
    }); 
    // disconnect
    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', {name: socket.name, color: socket.color} /*, userId*/)
    });
    // user entered name and joined room
    socket.on('join-chat-room', (userObj) => {
      const color = randomColor();
      socket.name = userObj.name;
      socket.color = color;
      io.to(roomId).emit('user-joined', {name: userObj.name, color: color})
    });
    // roll from chat
    socket.on('roll', (userObj) => {
      rollerController.calculateRoll({...userObj, io: io, roomId: roomId});
    });
    // goon operations
    socket.on('add-goon', (goonObj) => {
      goonController.addGoon({...goonObj, io: io, roomId: roomId});
    })
    socket.on('update-goon', (goonObj) => {
      goonController.updateGoon({...goonObj, io: io, roomId: roomId});
    })
    socket.on('remove-goon', (goonObj) => {
      goonController.removeGoon({...goonObj, io: io, roomId: roomId});
    })
    // firefight count
    socket.on('count-battle', (data) => {
      fireFightController.countBattle({...data, io: io, roomId: roomId});
    })
    socket.on('blur-details', () => {
      socket.to(roomId).broadcast.emit('blur-details');
    })
    socket.on('unblur-details', () => {
      socket.to(roomId).broadcast.emit('unblur-details');
    })
  })
})

server.listen(process.env.PORT|| 3000)
