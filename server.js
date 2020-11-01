const express = require('express');
const app = express();

const randomColor = require('randomcolor');
const server = require('http').Server(app);
const io = require('socket.io')(server);

const { v4: uuidV4 } = require('uuid')

const allClients = [];

app.set('view engine', 'ejs')
app.use(express.static('assets'))


app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.use('/', require('./routes/room'));
//socket
io.on('connection', socket => {
  socket.on('init-room-connection', (roomId) => {
    socket.join(roomId)
    //socket.to(roomId).broadcast.emit('user-connected', userId);
    // messages
    socket.on('message', (messageObj) => {
      //send message to the same room
      io.to(roomId).emit('message-created', messageObj)
    }); 
  
    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', {name: socket.name, color: socket.color} /*, userId*/)
    })
    socket.on('join-chat-room', (userObj) => {
      const color = randomColor();
      socket.name = userObj.name;
      socket.color = color;
      io.to(roomId).emit('user-joined', {name: userObj.name, color: color})
    })
  })
})
app.io = io;

// socket.on('initConnection', data => {
//   if(data.access_token){
//     const payload = tokenService.verifyToken(data.access_token);
//     if (payload) {
//       socket.email = payload.email;
//     }
//   }
// })

// const sendCallEnded = async (activeSocketConnections, twilioBody) => {
//   try {
//       const usersParams = {
//           inboundTN: twilioBody.From
//       };
//       const users = await jobsUserService.getUsersInJob(usersParams);
//       const emails = users.map(user => user.email);
//       for (const socketId in activeSocketConnections) {
//           const connection = activeSocketConnections[socketId];
//           if (connection.email && emails.includes(connection.email)) {
//               connection._events.sendCallEnded({ initialNumber: twilioBody.To });
//           }
//       }
//   } catch (e) {
//       throw e;
//   }
// }

server.listen(process.env.PORT|| 3000)
