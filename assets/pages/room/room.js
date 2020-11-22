// half a sec
const DEFAULT_TIMER = 1500;
const GOON_BLOCK_HEIGHT = 930;

$( document ).ready(function() {
  $('.room-login').modal('show');$('.room-login').modal('show')
  initSocketConnection();
  updateWoundLsevel();
  updateChatPositioning();
  addBorderToBottom();
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
      updateShooterList();
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
          //update fighter values
          goonDiv.find('.fighter-stat-row .ref').val(goonTemplate.fightStats.ref);
          goonDiv.find('.fighter-stat-row .body').val(goonTemplate.fightStats.body);
          goonDiv.find('.fighter-stat-row .btm').val(goonTemplate.fightStats.btm);
          goonDiv.find('.fighter-stat-row .wpn').val(goonTemplate.fightStats.wpn);
          goonDiv.find('.fighter-stat-row .mods').val(goonTemplate.fightStats.mods);
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
      updateShooterList()
  });
  socket.on('calculation-completed', data => {
    $("#battleLog .logs")
    .empty()
    .append(data.logStr)
    .addClass('changed');
    setTimeout(() => $("#battleLog .logs").removeClass('changed'), 500);
  })
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
  $('.close-chat').on('click', function() {
    $(this).addClass("inactive");
    $(".open-chat").removeClass("inactive");
    $(".main-right").addClass("inactive");
    $(".main-left").addClass("full-width");
  });
  $('.open-chat').on('click', function() {
    $(this).addClass("inactive");
    $(".close-chat").removeClass("inactive");
    $(".main-right").removeClass("inactive");
    $(".main-left").removeClass("full-width");
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
  // battle ground handler 
  $(".rumble-button").on('click', function() {
    const data = {
      shooter: $(".step1 .target-select").val(),
      target: $(".step2 .target-select").val(),
      coverValue: parseInt($(".cover-value").val()) ? parseInt($(".cover-value").val()) : 0,
      fireMod: $(".fire-mod").val(),
      calledShot: $(".called-shot").val(),
      wpnDmg: $(".wpn-dmg").val(),
      wpnAcc: parseInt($(".wpn-acc").val()),
      wpnBullets: parseInt($(".wpn-bullets").val()),
      shotComplexity: parseInt($(".complexity-value").val())
    }
    socket.emit('count-battle', {data: data});
  });
  //handlers for dynamicaly added elements

  //wounds handler
  $(document.body).on("click", '.category-title i', function() { 
    const goonBlock = $(this).parent().parent().parent();
    const goonBlockClasses = goonBlock.attr("class").split(/\s+/);
    const squares = $(`.${goonBlockClasses[0]}.${goonBlockClasses[1]} .wound-square`);
    squares.removeClass("active-confirmed");
    const goonTemplateObj = formGoonObj(goonBlock);
    socket.emit('update-goon', {type: goonTemplateObj.type, goonTemplate: goonTemplateObj.goonTemplate, name: USER_NAME });
  });
  $(document.body).on("click touchstart touchend touchmove", '.wound-square', function() { 
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

  // allow users input strings for aromor inputs
  // $(document.body).on("keyup", '.armor-block input', function() {
  //   //don`t allow strings + empty values
  //   if (/\D/g.test(this.value)){
  //     this.value = this.value.replace(/\D/g, '');
  //   } 
  // });

  $(document.body).on("keyup change focusout", '.armor-block input', debounce(function() {
    const value = $(this).val();
    if(value) {
      const goonBlock = $(this).parent().parent();
      const goonTemplateObj = formGoonObj(goonBlock);
      socket.emit('update-goon', {type: goonTemplateObj.type, goonTemplate: goonTemplateObj.goonTemplate, name: USER_NAME });
    }
  }, DEFAULT_TIMER));
  $(document.body).on("keyup change focusout", '.fighter-stat-row input', debounce(function() {
    const value = $(this).val();
    if(value) {
      const goonBlock = $(this).parent().parent().parent().parent();
      const goonTemplateObj = formGoonObj(goonBlock);
      socket.emit('update-goon', {type: goonTemplateObj.type, goonTemplate: goonTemplateObj.goonTemplate, name: USER_NAME });
    }
  }, DEFAULT_TIMER));
}

const scrollToBottom = () => {
  const d = $('.main-chat-window');
  d.scrollTop(d.prop("scrollHeight"));
}

function updateShooterList() {
  $(".target-select").each((i, element) => {
    $(element).empty();
    $(element).append('<option selected value="">Asignee</option>');
    for(let i = 0; i < $(".boi").length; i++){
      $(element).append(`<option selected value="boi-${i}">Boi ${i}</option>`);
    }
    for(let i = 0; i < $(".goon").length; i++){
      $(element).append(`<option selected value="goon-${i}">Goon ${i}</option>`);
    }
    $(element).val("");
  });
}

function addBorderToBottom() {
    if($(".goons-block").height() === GOON_BLOCK_HEIGHT){
      $(".goons-block").addClass("bottom-bordered");
    }
    if($(".bois-block").height() === GOON_BLOCK_HEIGHT){
      $(".bois-block").addClass("bottom-bordered");
    }
}

function updateChatPositioning () {
  const containerWidth = $(window).width();
  if(containerWidth <= 1024){
    $('.close-chat').trigger("click");
  }
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
  let category = "";
  let blockCategory = "";
  let goonIcon = "";
  if(type === "goon") {
    category = ".goons-block";
    blockCategory = "goon";
    goonIcon = "goon";
  } else {
    category = ".bois-block";
    blockCategory = "boi";
    goonIcon = "detective";
  }
  $(category)
  .append(`
  <div class="${blockCategory} ${index}">
    <input type="hidden" class="wound-level-number" value="0">
    <div class="armor-block">
      <input type="text" class="head" placeholder="Head Armor Value"  value="0">
      <input type="text" class="torso" placeholder="Torso Armor Value"  value="0">
      <input type="text" class="r-arm" placeholder="R-arm Armor Value"  value="0">
      <input type="text" class="l-arm" placeholder="L-arm Armor Value"  value="0">
      <input type="text" class="r-leg" placeholder="R-leg Armor Value"  value="0">
      <input type="text" class="l-leg" placeholder="L-leg Armor Value"  value="0">
      <input type="text" class="head-hp hp" placeholder="Head hp Value"  value="-">
      <input type="text" class="torso-hp hp" placeholder="Torso hp Value"  value="-">
      <input type="text" class="r-arm-hp hp" placeholder="R-arm hp Value"  value="-">
      <input type="text" class="l-arm-hp hp" placeholder="L-arm hp Value"  value="-">
      <input type="text" class="r-leg-hp hp" placeholder="R-leg hp Value"  value="-">
      <input type="text" class="l-leg-hp hp" placeholder="L-leg hp Value"  value="-">
      <img src="goon-icons/${goonIcon}.png">
      <div class="buttons-block">
        <button type="button" class="btn btn-danger remove-goon">Kill</button>
        <button type="button" class="btn btn-warning go-afk">AFK</button>
        <button type="button" class="btn btn-info reset-goon">Reset stats</button>
      </div>
    </div>
    <div class="additional-info">
      <h6 class="category-title">
          Wounds <i class="material-icons reset-wounds">replay</i>
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
          <div class="wound-hint">
              Stun=0
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
          <div class="wound-hint">
              Stun=-1
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
          <div class="wound-hint">
              Stun=-2
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
          <div class="wound-hint">
              Stun=-3
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
          <div class="wound-hint">
              Stun=-4
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
          <div class="wound-hint">
              Stun=-5
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
          <div class="wound-hint">
              Stun=-6
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
          <div class="wound-hint">
              Stun=-7
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
          <div class="wound-hint">
              Stun=-8
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
          <div class="wound-hint">
              Stun=-9
          </div>
        </div>
      </div>
      <h6 class="category-title">
      Fighter Stats <i class="material-icons">control_point</i>
   </h6>
   <div class="fighter-stats">
      <div class="form-group fighter-stat-row">
         <label for="ref">REF</label>
         <input type="number" class="form-control ref" aria-describedby="ref-hint" placeholder="REF" value="0">
         <small id="ref-hint" class="form-text text-muted">Better fast, than dead..</small>
      </div>
      <div class="form-group fighter-stat-row">
        <label for="body">BODY</label>
        <input type="number" class="form-control body" aria-describedby="body-hint" placeholder="BODY" value="<%=room.goons[i].fightStats.body%>">
        <small id="body-hint" class="form-text text-muted">Healthy body, healthy mind...</small>
      </div>
      <div class="form-group fighter-stat-row">
         <label for="btm">BTM</label>
         <input type="number" class="form-control btm" aria-describedby="btm-hint" placeholder="BTM" value="0">
         <small id="btm-hint" class="form-text text-muted">Being spongy doesn't hurt at all.</small>
      </div>
      <div class="form-group fighter-stat-row">
         <label for="wpn">Weapon Skill</label>
         <input type="number" class="form-control wpn" aria-describedby="wpn-hint" placeholder="Weapon Skill" value="0">
         <small id="wpn-hint" class="form-text text-muted">One good shot can solve any problem.</small>
      </div>
      <div class="form-group fighter-stat-row">
         <label for="mods">Other Aim Modifiers</label>
         <input type="text" class="form-control mods" aria-describedby="mods-hint" placeholder="Mods" value="0">
         <small id="mods-hint" class="form-text text-muted">Write mods with "space" button. For instance : -1 2 -3.</small>
      </div>
      </div>
    </div>
  </div>`);
  if(type === "goon") {
    if($(".goons-block").height() === GOON_BLOCK_HEIGHT){
      $(".goons-block").addClass("bottom-bordered");
    }
  } else {
    if($(".bois-block").height() === GOON_BLOCK_HEIGHT){
      $(".bois-block").addClass("bottom-bordered");
    }
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
    if(type === "goon") {
      if($(".goons-block").height() < GOON_BLOCK_HEIGHT){
        $(".goons-block").removeClass("bottom-bordered");
      }
    } else {
      if($(".bois-block").height() < GOON_BLOCK_HEIGHT){
        $(".bois-block").removeClass("bottom-bordered");
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
  //variables - limbs/ armor
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
  //variables - battle stats
  const refStat = goonBlock.find('.fighter-stat-row .ref').val();
  const bodyStat = goonBlock.find('.fighter-stat-row .body').val();
  const btmStat = goonBlock.find('.fighter-stat-row .btm').val();
  const wpnStat = goonBlock.find('.fighter-stat-row .wpn').val();
  const modStat = goonBlock.find('.fighter-stat-row .mods').val();
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
            head: headHP ? headHP : "",
            torso: torsoHP ? torsoHP : "",
            lArm: lArmHP ? lArmHP : "",
            rArm: rArmHP ? rArmHP : "",
            lLeg: lLegHP ? lLegHP : "",
            rLeg: rLegHP ? rLegHP : ""
        }
    },
    fightStats: {
      ref: refStat ? parseInt(refStat) : 0,
      body: bodyStat ? parseInt(bodyStat) : 0,
      btm: btmStat ? parseInt(btmStat) : 0,
      wpn: wpnStat ? parseInt(wpnStat) : 0,
      mods: modStat ? modStat : "0"
    }
  };
  return {
    goonTemplate: goonTemplate,
    type: type
  }
}