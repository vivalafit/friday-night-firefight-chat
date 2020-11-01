$( document ).ready(function() {
  //variables
  const socket = io('/');
  const chatInput = $("#chat-input");


  $('html').keydown(function (e) {
    if (e.which == 13 && chatInput.val().length !== 0) {
      socket.emit('message', chatInput.val());
      chatInput.val('');
    }
  });
  socket.on('connect', () => {
    console.log('Successfuly established socket connection');
    socket.emit('join-room', ROOM_ID)
    
    //emit to server-side
    ///socketConnection.emit("initConnection", { access_token: Cookies.get('access_token') });
  });
    socket.on('user-connected', userId => {
      connectToNewUser(userId, stream)
    })
    socket.on("createMessage", message => {
      $("ul").append(`<li class="message"><b>user</b><br/>${message}</li>`);
      scrollToBottom()
    })
  
  socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close()
  })
  
  
});

const scrollToBottom = () => {
  const d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}