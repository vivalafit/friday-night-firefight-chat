$( document ).ready(function() {
  $('.room-login').modal('show');$('.room-login').modal('show')
  initSocketConnection();
  updateWoundLsevel();
});

const initSocketConnection = () => {
  const socket = io('/');
  socket.on('connect', () => {
    console.log('Successfuly established socket connection');
    socket.emit('init-room-connection', ROOM_ID)
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
  socket.on('goon-added', goonObj => {
      if(goonObj.name !== USER_NAME) {
        addGoon(goonObj.goon.id, goonObj.type);
      }
  })
  socket.on('goon-updated', goonObj => {
   if(goonObj.name !== USER_NAME) {
      const elementUpdated = $(`.${goonObj.type}.${goonObj.goon.id}`)
      if(elementUpdated.length > 0) {
          const goonDiv = $(elementUpdated[0]);
          const goonTemplate = goonObj.goon;
          //update goon values
          goonDiv.find('.head').val(goonTemplate.bodyStats.armor.head);
          goonDiv.find('.torso').val(goonTemplate.bodyStats.armor.torso);
          goonDiv.find('.l-arm').val(goonTemplate.bodyStats.armor.lArm);
          goonDiv.find('.r-arm').val(goonTemplate.bodyStats.armor.rArm);
          goonDiv.find('.l-leg').val(goonTemplate.bodyStats.armor.lLeg);
          goonDiv.find('.r-leg').val(goonTemplate.bodyStats.armor.rLeg);
          goonDiv.find('.head-hp').val(goonTemplate.bodyStats.limbs.head);
          goonDiv.find('.torso-hp').val(goonTemplate.bodyStats.limbs.torso);
          goonDiv.find('.l-arm-hp').val(goonTemplate.bodyStats.limbs.lArm);
          goonDiv.find('.r-arm-hp').val(goonTemplate.bodyStats.limbs.rArm);
          goonDiv.find('.l-leg-hp').val(goonTemplate.bodyStats.limbs.lLeg);
          goonDiv.find('.r-leg-hp').val(goonTemplate.bodyStats.limbs.rLeg);
          //update wound level
          goonDiv.find('.wound-level-number').val(goonTemplate.woundLevel);
          updateWoundLsevel(goonDiv);
          goonDiv.addClass('changed');
          setTimeout(() => goonDiv.removeClass('changed'), 500);

      }
    }
  });
  socket.on('goon-removed', goonObj => {
      removeGoon(goonObj.id, goonObj.type);
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
    const index = $('.goon').length;
    addGoon(index, "goon");
    socket.emit('add-goon', {type: "goon", goonId: index, name: USER_NAME });
  });
  $('.boi-btn').on('click', function() {
    const index = $('.boi').length;
    addGoon(index, "man");
    socket.emit('add-goon', {type: "man", goonId: index, name: USER_NAME});
  });

  //handlers for dynamicaly added elements

  //wounds handler
  $(document.body).on("click", '.category-title i', function() { 
    const goonBlock = $(this).parent().parent().parent();
    const goonBlockClasses = goonBlock.attr("class").split(/\s+/);
    const squares = $(`.${goonBlockClasses[0]}.${goonBlockClasses[1]} .wound-square`);
    const index = squares.index(this);
    squares.removeClass("active-confirmed");
    const goonTemplateObj = formGoonObj(goonBlock);
    socket.emit('update-goon', {type: goonTemplateObj.type, goonTemplate: goonTemplateObj.goonTemplate, name: USER_NAME });
  });
  $(document.body).on("click", '.wound-square', function() { 
    const goonBlock = $(this).parent().parent().parent().parent().parent();
    const goonBlockClasses = goonBlock.attr("class").split(/\s+/);
    const squares = $(`.${goonBlockClasses[0]}.${goonBlockClasses[1]} .wound-square`);
    const index = squares.index(this);
    squares.removeClass("active-confirmed");
    for (let i = 0; i < index+1; i++){
      $(squares[i]).addClass("active-confirmed")
    }
    const goonTemplateObj = formGoonObj(goonBlock);
    socket.emit('update-goon', {type: goonTemplateObj.type, goonTemplate: goonTemplateObj.goonTemplate, name: USER_NAME });
  });
  $(document.body).on("mouseover", '.wound-square', function() { 
    const goonBlockClasses = $(this).parent().parent().parent().parent().parent().attr("class").split(/\s+/);
    const squares =  $(`.${goonBlockClasses[0]}.${goonBlockClasses[1]} .wound-square`);
    const index =  squares.index(this);
    for (let i = 0; i < index; i++){
      $(squares[i]).addClass("active")
    }
  });
  $(document.body).on("mouseout", '.wound-square', function() { 
    $(".wound-square").removeClass('active');
    const goonBlockClasses = $(this).parent().parent().parent().parent().parent().attr("class").split(/\s+/);
    const squares =  $(`.${goonBlockClasses[0]}.${goonBlockClasses[1]} .wound-square`);
    const index =  squares.index(this);
    for (let i = 0; i < index; i++){
      $(squares[i]).removeClass("active");
    }
  });


  $(document.body).on("click", '.remove-goon', function() {
    const goonBlock = $(this).parent().parent().parent();
    const classesArr = goonBlock.attr("class").split(/\s+/);
    const type = classesArr[0];
    const id = classesArr[1];
    console.log("classesArr", classesArr);
    socket.emit('remove-goon', {type: type, id: id, name: USER_NAME });
  });

  $(document.body).on("keyup", '.armor-block input', function() {
    //don`t allow strings + empty values
    if (/\D/g.test(this.value)){
      this.value = this.value.replace(/\D/g, '');
    } 
  });
  $(document.body).on("keyup change focusout", '.armor-block input', debounce(function() {
    const value = $(this).val();
    if(value) {
      const goonBlock = $(this).parent().parent();
      const goonTemplateObj = formGoonObj(goonBlock);
      socket.emit('update-goon', {type: goonTemplateObj.type, goonTemplate: goonTemplateObj.goonTemplate, name: USER_NAME });
    }
  }, 1500));
}

const scrollToBottom = () => {
  const d = $('.main-chat-window');
  d.scrollTop(d.prop("scrollHeight"));
}

function updateWoundLsevel(element) {
    let elements = [];
    if(element) {
      elements.push(element);
    } else {
      elements = $(".goon, .boi");
    }
    if(elements.length > 0) {
      for(let i = 0; i < elements.length; i++){
        const wound = parseInt($(elements[i]).find(".wound-level-number").val());
        const squares =  $(elements[i]).find(".wound-square");
        if(wound > 0) {
          squares.removeClass("active-confirmed");
          for (let i = 0; i < wound; i++){
            $(squares[i]).addClass("active-confirmed")
          }
        } else {
          squares.removeClass("active-confirmed");
        }
      }
    }
}

function addGoon(index, type){
  if(type === "goon") {
    $('.goons-block')
    .append(`
    <div class="goon ${index}">
      <input type="hidden" class="wound-level-number" value="0">
      <div class="armor-block">
        <input type="text" class="head" placeholder="Head Armor Value"  value="0">
        <input type="text" class="torso" placeholder="Torso Armor Value"  value="0">
        <input type="text" class="r-arm" placeholder="R-arm Armor Value"  value="0">
        <input type="text" class="l-arm" placeholder="L-arm Armor Value"  value="0">
        <input type="text" class="r-leg" placeholder="R-leg Armor Value"  value="0">
        <input type="text" class="l-leg" placeholder="L-leg Armor Value"  value="0">
        <input type="text" class="head-hp hp" placeholder="Head hp Value"  value="8">
        <input type="text" class="torso-hp hp" placeholder="Torso hp Value"  value="8">
        <input type="text" class="r-arm-hp hp" placeholder="R-arm hp Value"  value="8">
        <input type="text" class="l-arm-hp hp" placeholder="L-arm hp Value"  value="8">
        <input type="text" class="r-leg-hp hp" placeholder="R-leg hp Value"  value="8">
        <input type="text" class="l-leg-hp hp" placeholder="L-leg hp Value"  value="8">
        <img src="goon-icons/goon.png">
        <div class="buttons-block">
          <button type="button" class="btn btn-danger remove-goon">Kill</button>
          <button type="button" class="btn btn-warning go-afk">AFK</button>
          <button type="button" class="btn btn-info reset-goon">Reset stats</button>
        </div>
      </div>
      <div class="additional-info">
        <h6 class="category-title">
            Wounds
        </h6>
        <div class="wounds-block">
            <div class="wound-block">
              <div class="wound-title">
                  Light
              </div>
              <div class="wound-markers">
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
              </div>
            </div>
            <div class="wound-block">
              <div class="wound-title">
                  Serious
              </div>
              <div class="wound-markers">
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
              </div>
            </div>
            <div class="wound-block">
              <div class="wound-title">
                  Critical
              </div>
              <div class="wound-markers">
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
              </div>
            </div>
            <div class="wound-block">
              <div class="wound-title">
                  Mortal 0
              </div>
              <div class="wound-markers">
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
              </div>
            </div>
            <div class="wound-block">
              <div class="wound-title">
                  Mortal 1
              </div>
              <div class="wound-markers">
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
              </div>
            </div>
            <div class="wound-block">
              <div class="wound-title">
                  Mortal 2
              </div>
              <div class="wound-markers">
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
              </div>
            </div>
            <div class="wound-block">
              <div class="wound-title">
                  Mortal 3
              </div>
              <div class="wound-markers">
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
              </div>
            </div>
            <div class="wound-block">
              <div class="wound-title">
                  Mortal 4
              </div>
              <div class="wound-markers">
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
              </div>
            </div>
            <div class="wound-block">
              <div class="wound-title">
                  Mortal 5
              </div>
              <div class="wound-markers">
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
              </div>
            </div>
            <div class="wound-block">
              <div class="wound-title">
                  Mortal 6
              </div>
              <div class="wound-markers">
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
              </div>
            </div>
        </div>
      </div>
    </div>`);
  } else {
    $('.bois-block')
    .append(`
    <div class="boi ${index}">
      <input type="hidden" class="wound-level-number" value="0">
      <div class="armor-block">
        <input type="text" class="head" placeholder="Head Armor Value"  value="0">
        <input type="text" class="torso" placeholder="Torso Armor Value"  value="0">
        <input type="text" class="r-arm" placeholder="R-arm Armor Value"  value="0">
        <input type="text" class="l-arm" placeholder="L-arm Armor Value"  value="0">
        <input type="text" class="r-leg" placeholder="R-leg Armor Value"  value="0">
        <input type="text" class="l-leg" placeholder="L-leg Armor Value"  value="0">
        <input type="text" class="head-hp hp" placeholder="Head hp Value"  value="8">
        <input type="text" class="torso-hp hp" placeholder="Torso hp Value"  value="8">
        <input type="text" class="r-arm-hp hp" placeholder="R-arm hp Value"  value="8">
        <input type="text" class="l-arm-hp hp" placeholder="L-arm hp Value"  value="8">
        <input type="text" class="r-leg-hp hp" placeholder="R-leg hp Value"  value="8">
        <input type="text" class="l-leg-hp hp" placeholder="L-leg hp Value"  value="8">
        <img src="goon-icons/detective.png">
        <div class="buttons-block">
          <button type="button" class="btn btn-danger remove-goon">Kill</button>
          <button type="button" class="btn btn-warning go-afk">AFK</button>
          <button type="button" class="btn btn-info reset-goon">Reset stats</button>
        </div>
      </div>
      <div class="additional-info">
        <h6 class="category-title">
            Wounds
        </h6>
        <div class="wounds-block">
            <div class="wound-block">
              <div class="wound-title">
                  Light
              </div>
              <div class="wound-markers">
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
              </div>
            </div>
            <div class="wound-block">
              <div class="wound-title">
                  Serious
              </div>
              <div class="wound-markers">
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
              </div>
            </div>
            <div class="wound-block">
              <div class="wound-title">
                  Critical
              </div>
              <div class="wound-markers">
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
              </div>
            </div>
            <div class="wound-block">
              <div class="wound-title">
                  Mortal 0
              </div>
              <div class="wound-markers">
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
              </div>
            </div>
            <div class="wound-block">
              <div class="wound-title">
                  Mortal 1
              </div>
              <div class="wound-markers">
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
              </div>
            </div>
            <div class="wound-block">
              <div class="wound-title">
                  Mortal 2
              </div>
              <div class="wound-markers">
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
              </div>
            </div>
            <div class="wound-block">
              <div class="wound-title">
                  Mortal 3
              </div>
              <div class="wound-markers">
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
              </div>
            </div>
            <div class="wound-block">
              <div class="wound-title">
                  Mortal 4
              </div>
              <div class="wound-markers">
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
              </div>
            </div>
            <div class="wound-block">
              <div class="wound-title">
                  Mortal 5
              </div>
              <div class="wound-markers">
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
              </div>
            </div>
            <div class="wound-block">
              <div class="wound-title">
                  Mortal 6
              </div>
              <div class="wound-markers">
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
                  <div class="wound-square"></div>
              </div>
            </div>
        </div>
      </div>
    </div>`);
  }
}

function removeGoon(index, type){
    $(`.${type}.${index}`).remove();
    const elementsToUpdate = $(`.${type}`);
    if(elementsToUpdate.length > 0) {
      for (let i = index; i < elementsToUpdate.length; i++) {
        $(elementsToUpdate[i]).attr('class', `${type} ${i}`);
      }
    }
}

//move to utility file 
function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

function formGoonObj(goonBlock) {
  const classesArr = goonBlock.attr("class").split(/\s+/);
  const type = classesArr[0];
  const id = classesArr[1];
  //wound level
  const woundLevel =  $(`.${classesArr[0]}.${classesArr[1]} .wound-square.active-confirmed`).length;
  //variables 
  const headArmor = goonBlock.find('.head').val();
  const torsoArmor = goonBlock.find('.torso').val();
  const lArmArmor = goonBlock.find('.l-arm').val();
  const rArmArmor = goonBlock.find('.r-arm').val();
  const lLegArmor = goonBlock.find('.l-leg').val();
  const rLegArmor = goonBlock.find('.r-leg').val();
  const headHP = goonBlock.find('.head-hp').val();
  const torsoHP = goonBlock.find('.torso-hp').val();
  const lArmHP = goonBlock.find('.l-arm-hp').val();
  const rArmHP= goonBlock.find('.r-arm-hp').val();
  const lLegHP = goonBlock.find('.l-leg-hp').val();
  const rLegHP = goonBlock.find('.r-leg-hp').val();
  //template
  const goonTemplate = {
    id: parseInt(id),
    woundLevel: woundLevel,
    bodyStats: {
        armor: {
            head: headArmor ? parseInt(headArmor) : 0,
            torso: torsoArmor ? parseInt(torsoArmor) : 0,
            lArm: lArmArmor ? parseInt(lArmArmor) : 0,
            rArm: rArmArmor ? parseInt(rArmArmor) : 0,
            lLeg: lLegArmor ? parseInt(lLegArmor) : 0,
            rLeg: rLegArmor ? parseInt(rLegArmor) : 0
        }, 
        limbs: {
            head: headHP ? parseInt(headHP) : 0,
            torso: torsoHP ? parseInt(torsoHP) : 0,
            lArm: lArmHP ? parseInt(lArmHP) : 0,
            rArm: rArmHP ? parseInt(rArmHP) : 0,
            lLeg: lLegHP ? parseInt(lLegHP) : 0,
            rLeg: rLegHP ? parseInt(rLegHP) : 0
        }
    }
  };
  return {
    goonTemplate: goonTemplate,
    type: type
  }
}