let goonsCount = 0;
let boisCount = 0;
$( document ).ready(function() {
  goonsCount = $('.goon').length;
  boisCount = $('.boi').length;
  $('.room-login').modal('show');$('.room-login').modal('show')
  initSocketConnection();
});

const initSocketConnection = () => {
  const socket = io('/');
  socket.on('connect', () => {
    console.log('Successfuly established socket connection');
    socket.emit('init-room-connection', ROOM_ID)
    
    //emit to server-side
    ///socketConnection.emit("initConnection", { access_token: Cookies.get('access_token') });
  });
  
  socket.on('message-created', messageObj => {
    $('.messages').append(`<li class="message"><span><span style="color:${messageObj.user.color}" class="name">${messageObj.user.name}: </span><span class="msg">${messageObj.msg}</span></span></li>`);
    scrollToBottom()
  })
  socket.on('roll-calculated', userObj => {
    if(userObj.specMsg) {
      $('.messages').append(`<li class="message"><span><span style="color:${userObj.user.color}" class="name">${userObj.specMsg}<span></li>`);
    } else if(userObj.error){
      $('.messages').append(`<li class="message"><span><span style="color:${userObj.user.color}" class="name">Roll failed: inadequade roll value! <span></li>`);
    } else {
      $('.messages').append(`<li class="message"><span><span style="color:${userObj.user.color}" class="name">${userObj.user.name} rolled: </span><span class="msg">${userObj.roll.join(', ')} (${userObj.result})</span></li>`);
    }
  });
  socket.on('user-disconnected', userObj => {
    if(userObj.name) {
      $('.messages').append(`<li class="message-centered"><span style="color: ${userObj.color}">${userObj.name} disconnected!</span></li>`);
    }
  })
  socket.on('user-joined', userObj => {
    if(userObj.name === USER_NAME){
      USER_COLOR = userObj.color;
    }
    $('.messages').append(`<li class="message-centered"><span style="color: ${userObj.color}">${userObj.name} connected!</span></li>`);
  });
  initHandlers(socket);
}

const initHandlers = (socket) => {
  const chatInput = $("#chat-input");

  $('html').on('keydown', function (e) {
    if (e.which == 13 && chatInput.val()) {
      socket.emit('message', { user : {name: USER_NAME, color: USER_COLOR}, msg: chatInput.val()});
      chatInputWords = chatInput.val().split(" ");
      chatInput.val("");
      if(chatInputWords[0] === "roll"){
        socket.emit('roll', { user : {name: USER_NAME, color: USER_COLOR}, roll: chatInputWords[1]});
      }
    }
  });
  $('.connect-to-room').on('click', function() {
    if($('#punkName').val()) {
      USER_NAME = $('#punkName').val();
      $('.room-login').modal('hide');
      socket.emit('join-chat-room', {name: USER_NAME, socketId: socket.id});
    }
  });
  $('.goon-btn').on('click', function() {
    $('.goons-block')
    .append(`
    <div class="goon" id="${goonsCount}">
      <div class="armor-block">
        <input type="text" class="head" placeholder="Head Armor Value"  value="0">
        <input type="text" class="torso" placeholder="Torso Armor Value"  value="0">
        <input type="text" class="r-arm" placeholder="R-arm Armor Value"  value="0">
        <input type="text" class="l-arm" placeholder="L-arm Armor Value"  value="0">
        <input type="text" class="r-leg" placeholder="R-leg Armor Value"  value="0">
        <input type="text" class="l-leg" placeholder="L-leg Armor Value"  value="0">
        <input type="text" class="l-leg" placeholder="L-leg Armor Value"  value="0">
        <input type="text" class="head-hp hp" placeholder="Head hp Value"  value="8">
        <input type="text" class="torso-hp hp" placeholder="Torso hp Value"  value="8">
        <input type="text" class="r-arm-hp hp" placeholder="R-arm hp Value"  value="8">
        <input type="text" class="l-arm-hp hp" placeholder="L-arm hp Value"  value="8">
        <input type="text" class="r-leg-hp hp" placeholder="R-leg hp Value"  value="8">
        <input type="text" class="l-leg-hp hp" placeholder="L-leg hp Value"  value="8">
        <img src="goon-icons/goon.png">
      </div>
    </div>`);
    goonsCount += 1;
    socket.emit('add-goon', {type: "goon", goonId: goonsCount});
  });
  $('.boi-btn').on('click', function() {
    $('.bois-block')
    .append(`
    <div class="boi" id="${boisCount}">
      <div class="armor-block">
        <input type="text" class="head" placeholder="Head Armor Value"  value="0">
        <input type="text" class="torso" placeholder="Torso Armor Value"  value="0">
        <input type="text" class="r-arm" placeholder="R-arm Armor Value"  value="0">
        <input type="text" class="l-arm" placeholder="L-arm Armor Value"  value="0">
        <input type="text" class="r-leg" placeholder="R-leg Armor Value"  value="0">
        <input type="text" class="l-leg" placeholder="L-leg Armor Value"  value="0">
        <input type="text" class="l-leg" placeholder="L-leg Armor Value"  value="0">
        <input type="text" class="head-hp hp" placeholder="Head hp Value"  value="8">
        <input type="text" class="torso-hp hp" placeholder="Torso hp Value"  value="8">
        <input type="text" class="r-arm-hp hp" placeholder="R-arm hp Value"  value="8">
        <input type="text" class="l-arm-hp hp" placeholder="L-arm hp Value"  value="8">
        <input type="text" class="r-leg-hp hp" placeholder="R-leg hp Value"  value="8">
        <input type="text" class="l-leg-hp hp" placeholder="L-leg hp Value"  value="8">
        <img src="goon-icons/detective.png">
      </div>
    </div>`);
    boisCount += 1;
    socket.emit('add-goon', {type: "man", goonId: boisCount});
  });
}

const scrollToBottom = () => {
  const d = $('.main-chat-window');
  d.scrollTop(d.prop("scrollHeight"));
}