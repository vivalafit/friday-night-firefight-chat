// half a sec
const DEFAULT_TIMER = 200;
const GOON_BLOCK_HEIGHT = 930;
const ADMIN_NAMES = ["MOD", "ADMIN"];
let USER_COLOR, USER_NAME;

$( document ).ready(function() {
  $('.room-login').modal('show');$('.room-login').modal('show')
  initSocketConnection();
  updateWoundLsevel();
  updateChatPositioning();
  addBorderToBottom();
  mapAimMods();
});

const mapAimMods = () => {
  AIM_MODS = JSON.parse(AIM_MODS.replace(/&#34;/g, '"'));
}

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
  socket.on('initiative-calculated', userObj => {
    if(userObj.specMsg) {
      $('.messages').append(`<li class="message"><span><span style="color:${userObj.user.color}" class="name">${userObj.specMsg}<span></li>`);
    } else if(userObj.error){
      $('.messages').append(`<li class="message"><span><span style="color:${userObj.user.color}" class="name">Initiative Count Failed<span></li>`);
    } else {
      $('.messages').append(`<li class="message"><span style="color:${userObj.user.color}" class="name">Initiative queue is ready!</span></li>`);
      $('.messages').append(`<li class="message"><span class="msg">${userObj.result}</span></li>`);
      for(let i = 0; i < userObj.detailedResult.length; i++) {
        $('.messages').append(`<li class="message ${ i === 0 ? "initiative-separator" : ""}"><span class="msg">${userObj.detailedResult[i]}</span></li>`);
      }
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
    //Add admin button to hide details 
    if (isAdmin() && $('.blur-details').length < 1) {
      $('.header-buttons').prepend('<button type="button" class="btn btn-danger blur-details blur"><i class="material-icons">visibility_off</i>Hide Details from Buddys</button>');
      $('.header-buttons').prepend('<button type="button" class="btn btn-primary blur-details unblur inactive"><i class="material-icons">visibility</i>Show Details to your Buddys</button>')
    }
  });
  socket.on('goon-added', goonObj => {
      if(goonObj.name !== USER_NAME) {
        addGoon(goonObj.goon.id, goonObj.type);
      }
      updateShooterList();
  })
  socket.on('goon-updated', goonObj => {
    let nameChanged = false;
    const elementUpdated = $(`.${goonObj.type}.${goonObj.goon.id}`)
    if(elementUpdated.length > 0) {
        const goonDiv = $(elementUpdated[0]);
        const goonTemplate = goonObj.goon;
        const goonMods = goonTemplate.fightStats.selectedMods;
        const prevName = goonDiv.find('.goon-name').attr("data-initial-value");
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
        //update isSoft values
        //$('input[type="checkbox"][name="something"]').prop("checked", false).change();
        goonDiv.find('input[data-place="head"]').prop("checked", goonTemplate.bodyStats.isSoft.head);
        toggleArmorType(goonDiv.find('input[data-place="head"]').parent(), goonTemplate.bodyStats.isSoft.head);
        goonDiv.find('input[data-place="torso"]').prop("checked", goonTemplate.bodyStats.isSoft.torso);
        toggleArmorType(goonDiv.find('input[data-place="torso"]').parent(), goonTemplate.bodyStats.isSoft.torso);
        goonDiv.find('input[data-place="r-arm"]').prop("checked", goonTemplate.bodyStats.isSoft.rArm);
        toggleArmorType(goonDiv.find('input[data-place="r-arm"]').parent(), goonTemplate.bodyStats.isSoft.rArm);
        goonDiv.find('input[data-place="l-arm"]').prop("checked", goonTemplate.bodyStats.isSoft.lArm);
        toggleArmorType(goonDiv.find('input[data-place="l-arm"]').parent(), goonTemplate.bodyStats.isSoft.lArm);
        goonDiv.find('input[data-place="r-leg"]').prop("checked", goonTemplate.bodyStats.isSoft.rLeg);
        toggleArmorType(goonDiv.find('input[data-place="r-leg"]').parent(), goonTemplate.bodyStats.isSoft.rLeg);
        goonDiv.find('input[data-place="l-leg"]').prop("checked", goonTemplate.bodyStats.isSoft.lLeg);
        toggleArmorType(goonDiv.find('input[data-place="l-leg"]').parent(), goonTemplate.bodyStats.isSoft.lLeg);
        //update fighter values
        goonDiv.find('.fighter-stat-row .initial-ref').val(goonTemplate.fightStats.initialRef);
        goonDiv.find('.fighter-stat-row .ref').val(goonTemplate.fightStats.ref);
        goonDiv.find('.fighter-stat-row .initial-body').val(goonTemplate.fightStats.initialBody);
        goonDiv.find('.fighter-stat-row .body').val(goonTemplate.fightStats.body);
        goonDiv.find('.fighter-stat-row .initial-btm').val(goonTemplate.fightStats.initialBtm);
        goonDiv.find('.fighter-stat-row .btm').val(goonTemplate.fightStats.btm);
        goonDiv.find('.fighter-stat-row .wpn').val(goonTemplate.fightStats.wpn);
        goonDiv.find('.fighter-stat-row .def').val(goonTemplate.fightStats.def);
        goonDiv.find('.fighter-stat-row .mods').val(goonTemplate.fightStats.mods);
        //update mods selected ones
        //update additional details
        if (prevName !== goonTemplate.additionalStats.name) {
          nameChanged = true;
        }
        goonDiv.find('.goon-name').val(goonTemplate.additionalStats.name);
        goonDiv.find('.goon-name').attr('data-initial-value', goonTemplate.additionalStats.name);
        //update wound level
        goonDiv.find('.wound-level-number').val(goonTemplate.woundLevel);
        updateWoundLsevel(goonDiv);
        updateGoonMods(goonDiv, goonMods);
        colorDynamicFields(goonDiv);
        if(goonObj.name !== USER_NAME) {
          goonDiv.addClass('changed');
          setTimeout(() => goonDiv.removeClass('changed'), 500);
        }
    }
    if (nameChanged) {
      updateShooterList();
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
  socket.on('blur-details', () => {
    if(!isAdmin()) {
      blurDetails();
    }
  })
  socket.on('unblur-details', () => {
      unblurDetails();
  })
  //import goons handlers 
  socket.on('goons-imported', data => {
    try {
      renderGoons(data);
      importSucceded("Goons");
    } catch(e) {
      console.log(e);
      importFailed();
    }
  })
  socket.on('bois-imported', data => {
    try {
      renderBois(data);
      importSucceded("Bois");
    } catch(e) {
      console.log(e);
      importFailed();
    }
  })
  initHandlers(socket);
}

const colorDynamicFields = (goonDiv) => {
  //ref inputs
  const initRefInput = goonDiv.find('.fighter-stat-row .initial-ref');
  const refInput = goonDiv.find('.fighter-stat-row .ref');
  const refInit = parseInt(initRefInput.val());
  const ref =  parseInt(refInput.val());
  if (ref > refInit) {
    refInput.removeClass("less-than");
    refInput.addClass("more-than");
  } else if (ref < refInit) {
    refInput.removeClass("more-than");
    refInput.addClass("less-than");
  } else {
    refInput.removeClass("more-than").removeClass("less-than");
  }
  //body
  const initBodyInput = goonDiv.find('.fighter-stat-row .initial-body');
  const bodyInput = goonDiv.find('.fighter-stat-row .body');
  const bodyInit = parseInt(initBodyInput.val());
  const body =  parseInt(bodyInput.val());
  if (body > bodyInit) {
    bodyInput.addClass("more-than");
  } else if (body < bodyInit) {
    bodyInput.addClass("less-than");
  } else {
    bodyInput.removeClass("more-than").removeClass("less-than");
  }
  //btm
  const initBtmInput = goonDiv.find('.fighter-stat-row .initial-btm');
  const btmInput = goonDiv.find('.fighter-stat-row .btm');
  const btmInit = parseInt(initBtmInput.val());
  const btm =  parseInt(btmInput.val());
  if (btm > btmInit) {
    btmInput.addClass("more-than");
  } else if (btm < btmInit) {
    btmInput.addClass("less-than");
  } else {
    btmInput.removeClass("more-than").removeClass("less-than");
  }
}

const toggleArmorType = (toggleBlock, value) => {
  if (value === true) {
    toggleBlock.removeClass("off").removeClass("btn-danger").addClass("btn-primary");
  } else {
    toggleBlock.addClass("off").removeClass("btn-primary").addClass("btn-danger");;
  }
}

const renderGoons = (goons) => {
  $(".goons-block").empty();
  for(let i = 0; i < goons.length; i++){
    addGoon(goons[i].id, "goon");
    const elementUpdated = $(`.goon.${goons[i].id}`)
    //move repeatable code to func
    if(elementUpdated.length > 0) {
        const goonDiv = $(elementUpdated[0]);
        const goonTemplate = goons[i];
        const goonMods = goonTemplate.fightStats.selectedMods;
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
         //update isSoft values
         goonDiv.find('input[data-place="head"]').prop("checked", goonTemplate.bodyStats.isSoft.head);
         toggleArmorType(goonDiv.find('input[data-place="head"]').parent(), goonTemplate.bodyStats.isSoft.head);
         goonDiv.find('input[data-place="torso"]').prop("checked", goonTemplate.bodyStats.isSoft.torso);
         toggleArmorType(goonDiv.find('input[data-place="torso"]').parent(), goonTemplate.bodyStats.isSoft.torso);
         goonDiv.find('input[data-place="r-arm"]').prop("checked", goonTemplate.bodyStats.isSoft.rArm);
         toggleArmorType(goonDiv.find('input[data-place="r-arm"]').parent(), goonTemplate.bodyStats.isSoft.rArm);
         goonDiv.find('input[data-place="l-arm"]').prop("checked", goonTemplate.bodyStats.isSoft.lArm);
         toggleArmorType(goonDiv.find('input[data-place="l-arm"]').parent(), goonTemplate.bodyStats.isSoft.lArm);
         goonDiv.find('input[data-place="r-leg"]').prop("checked", goonTemplate.bodyStats.isSoft.rLeg);
         toggleArmorType(goonDiv.find('input[data-place="r-leg"]').parent(), goonTemplate.bodyStats.isSoft.rLeg);
         goonDiv.find('input[data-place="l-leg"]').prop("checked", goonTemplate.bodyStats.isSoft.lLeg);
         toggleArmorType(goonDiv.find('input[data-place="l-leg"]').parent(), goonTemplate.bodyStats.isSoft.lLeg);
        //update fighter values
        goonDiv.find('.fighter-stat-row .initial-ref').val(goonTemplate.fightStats.initialRef);
        goonDiv.find('.fighter-stat-row .ref').val(goonTemplate.fightStats.ref);
        goonDiv.find('.fighter-stat-row .def').val(goonTemplate.fightStats.def);
        goonDiv.find('.fighter-stat-row .initial-body').val(goonTemplate.fightStats.initialBody);
        goonDiv.find('.fighter-stat-row .body').val(goonTemplate.fightStats.body);
        goonDiv.find('.fighter-stat-row .initial-btm').val(goonTemplate.fightStats.initialBtm);
        goonDiv.find('.fighter-stat-row .btm').val(goonTemplate.fightStats.btm);
        goonDiv.find('.fighter-stat-row .wpn').val(goonTemplate.fightStats.wpn);
        goonDiv.find('.fighter-stat-row .mods').val(goonTemplate.fightStats.mods);
        //update mods selected ones
        colorDynamicFields(goonDiv);
        //update additional details
        goonDiv.find('.goon-name').val(goonTemplate.additionalStats.name);
        //update wound level
        goonDiv.find('.wound-level-number').val(goonTemplate.woundLevel);
        updateWoundLsevel(goonDiv);
        updateGoonMods(goonDiv, goonMods);
    }
  }
  updateShooterList();
}

const renderBois = (goons) => {
  $(".bois-block").empty();
  for(let i = 0; i < goons.length; i++){
    addGoon(goons[i].id, "man");
    const elementUpdated = $(`.boi.${goons[i].id}`)
    //move repeatable code to func
    if(elementUpdated.length > 0) {
        const goonDiv = $(elementUpdated[0]);
        const goonTemplate = goons[i];
        const goonMods = goonTemplate.fightStats.selectedMods;
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
        //update isSoft values
        goonDiv.find('input[data-place="head"]').prop("checked", goonTemplate.bodyStats.isSoft.head);
        toggleArmorType(goonDiv.find('input[data-place="head"]').parent(), goonTemplate.bodyStats.isSoft.head);
        goonDiv.find('input[data-place="torso"]').prop("checked", goonTemplate.bodyStats.isSoft.torso);
        toggleArmorType(goonDiv.find('input[data-place="torso"]').parent(), goonTemplate.bodyStats.isSoft.torso);
        goonDiv.find('input[data-place="r-arm"]').prop("checked", goonTemplate.bodyStats.isSoft.rArm);
        toggleArmorType(goonDiv.find('input[data-place="r-arm"]').parent(), goonTemplate.bodyStats.isSoft.rArm);
        goonDiv.find('input[data-place="l-arm"]').prop("checked", goonTemplate.bodyStats.isSoft.lArm);
        toggleArmorType(goonDiv.find('input[data-place="l-arm"]').parent(), goonTemplate.bodyStats.isSoft.lArm);
        goonDiv.find('input[data-place="r-leg"]').prop("checked", goonTemplate.bodyStats.isSoft.rLeg);
        toggleArmorType(goonDiv.find('input[data-place="r-leg"]').parent(), goonTemplate.bodyStats.isSoft.rLeg);
        goonDiv.find('input[data-place="l-leg"]').prop("checked", goonTemplate.bodyStats.isSoft.lLeg);
        toggleArmorType(goonDiv.find('input[data-place="l-leg"]').parent(), goonTemplate.bodyStats.isSoft.lLeg);
        //update fighter values
        goonDiv.find('.fighter-stat-row .initial-ref').val(goonTemplate.fightStats.initialRef);
        goonDiv.find('.fighter-stat-row .ref').val(goonTemplate.fightStats.ref);
        goonDiv.find('.fighter-stat-row .def').val(goonTemplate.fightStats.def);
        goonDiv.find('.fighter-stat-row .initial-body').val(goonTemplate.fightStats.initialBody);
        goonDiv.find('.fighter-stat-row .body').val(goonTemplate.fightStats.body);
        goonDiv.find('.fighter-stat-row .initial-btm').val(goonTemplate.fightStats.initialBtm);
        goonDiv.find('.fighter-stat-row .btm').val(goonTemplate.fightStats.btm);
        goonDiv.find('.fighter-stat-row .wpn').val(goonTemplate.fightStats.wpn);
        goonDiv.find('.fighter-stat-row .mods').val(goonTemplate.fightStats.mods);
        //update mods selected ones
        colorDynamicFields(goonDiv);
        //update additional details
        goonDiv.find('.goon-name').val(goonTemplate.additionalStats.name);
        //update wound level
        goonDiv.find('.wound-level-number').val(goonTemplate.woundLevel);
        updateWoundLsevel(goonDiv);
        updateGoonMods(goonDiv, goonMods);
    }
  }
  updateShooterList();
}

const updateGoonMods = (goonDiv, goonMods) => {
  goonDiv.find('.aim-modifiers-list .modifier').removeClass("active");
  for (let i = 0; i < goonMods.length; i++) {
    goonDiv.find(".modifier-text:contains(" + goonMods[i] + ")").parent().addClass("active");
  }
}

const blurDetails = () => {
  $(`
    .goons-block .additional-info,
    .goons-block .armor-block input
  `).addClass('to-blur');
  $('.logs').addClass('to-blur-light');
}

const unblurDetails = () => {
  $(`
    .goons-block .additional-info,
    .goons-block .armor-block input
  `).removeClass('to-blur');
  $('.logs').removeClass('to-blur-light');
}

const isAdmin = () => {
  return ADMIN_NAMES.includes(USER_NAME);
}

const initHandlers = (socket) => {
  const chatInput = $("#chat-input");

  $('html').on('keydown', function (e) {
    if (e.which == 13 && chatInput.val()) {
      //here
      socket.emit('message', { user : {name: USER_NAME, color: USER_COLOR}, msg: chatInput.val()});
      chatInputWords = chatInput.val().split(" ");
      chatInput.val("");
      //handle roll commmand
      if(chatInputWords[0] === "roll"){
        socket.emit('roll', { user : {name: USER_NAME, color: USER_COLOR}, roll: chatInputWords[1]});
      }
      //handle initiative command
      if(chatInputWords[0] === "initiative") {
        socket.emit('initiative', { user : {name: USER_NAME, color: USER_COLOR}});
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
  $('.close-tutorial').on('click', function() {
    $(this).addClass("inactive");
    $(".open-tutorial, .goons, .bois").removeClass("inactive");
    $(".goons-tutorial").addClass("inactive");
  });
  $('.open-tutorial').on('click', function() {
    $(this).addClass("inactive");
    $(".close-tutorial, .goons-tutorial").removeClass("inactive");
    $(".goons, .bois").addClass("inactive");
  });
  $('.connect-to-room').on('click', function() {
    if($('#punkName').val()) {
      USER_NAME = $('#punkName').val();
      $('.room-login').modal('hide');
      socket.emit('join-chat-room', {name: USER_NAME, socketId: socket.id});
    }
  });
  $('.add-goon').on('click', function() {
    const index = $('.goons-block .goon').length;
    addGoon(index, "goon");
    socket.emit('add-goon', {type: "goon", goonId: index, name: USER_NAME });
  });
  $('.add-boi').on('click', function() {
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
      shotComplexity: parseInt($(".complexity-value").val()),
      range: $(".range").val(),
      ap: $(".ap").val(),  
      //MeleeSelectors
      isMelee: $(".ranged-switch").is(":visible"),
      meleeMod: $(".melee-fire-mod").val(),
      meleeTechnique: $(".melee-fist-type").val(),
      calledShotMelee: $(".called-shot-melee").val(),
      defenderAction: $(".defender-action").val(),
      parryAction: $(".parry-option").val(),
      wpnDmgMelee: $(".wpn-dmg-melee").val(),
      wpnAccMelee: parseInt($(".wpn-acc-melee").val()),
      coverValueMelee: parseInt($(".cover-value-melee").val()) ? parseInt($(".cover-value-melee").val()) : 0,
      wpnHits: parseInt($(".wpn-hits-melee").val()),
      useBody: $(".body-dmg").val(),
      ignoresArmor: $(".ignore-melee-amor").val()
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
    const goonBlock = $(this).parent().parent().parent().parent();
    const classesArr = goonBlock.attr("class").split(/\s+/);
    const type = classesArr[0];
    const id = classesArr[1];
    socket.emit('remove-goon', {type: type, id: id, name: USER_NAME });
  });

  $(document.body).on("click", ".blur", function() {
    $(this).addClass("inactive");
    $('.unblur').removeClass("inactive");
    socket.emit('blur-details', {});
  })
  $(document.body).on("click", ".unblur", function() {
    $(this).addClass("inactive");
    $('.blur').removeClass("inactive");
    socket.emit('unblur-details', {});
  })

  $(document.body).on("change", ".target-select", function() {
    const isShooter = $(this).hasClass("shooter");
    const selectClass = isShooter ? "shooter-selected" : "target-selected";
    $('.people').addClass("fighter-select");
    $('.goon, .boi').removeClass(selectClass);
    const value = $(this).val();
    if (value) { 
      const className = "." + value.split("-").join(".");
      $(className).removeClass("non-target").addClass(selectClass);
    }
    resetTargets()
  });

  $(document.body).on("keyup change focusout", '.armor-block .input-block input', debounce(function() {
    const goonBlock = $(this).closest(".goon, .boi");
    const goonTemplateObj = formGoonObj(goonBlock);
    socket.emit('update-goon', {type: goonTemplateObj.type, goonTemplate: goonTemplateObj.goonTemplate, name: USER_NAME });
  }, DEFAULT_TIMER));
  $(document.body).on("keyup change focusout", '.fighter-stat-row input', debounce(function() {
    const goonBlock = $(this).closest(".goon, .boi");
    const goonTemplateObj = formGoonObj(goonBlock);
    socket.emit('update-goon', {type: goonTemplateObj.type, goonTemplate: goonTemplateObj.goonTemplate, name: USER_NAME });
  }, DEFAULT_TIMER));
  $(document.body).on("keyup change focusout", '.personal-stats input', debounce(function() {
    const goonBlock = $(this).closest(".goon, .boi");
    const goonTemplateObj = formGoonObj(goonBlock);
    socket.emit('update-goon', {type: goonTemplateObj.type, goonTemplate: goonTemplateObj.goonTemplate, name: USER_NAME });
  }, DEFAULT_TIMER));

  //DECREMENT-INCREMENT MODS
  $(document.body).on("click", ".decrement", function() {
    const input = $(this).closest(".input-block").find("input");
    let inputVal = parseInt($(input).val());
    if (isNaN(inputVal)){
      inputVal = 0;
    }
    if (inputVal > 0) {
      inputVal--;
    } else if (inputVal === 0 && $(input).hasClass("hp")) {
      inputVal = "-"; 
    }
    $(input).val(inputVal).trigger("change");
  });

  $(document.body).on("click", ".increment", function() {
    const input = $(this).closest(".input-block").find("input");
    let inputVal = parseInt($(input).val());
    if (isNaN(inputVal)){
      inputVal = 0;
    }
    inputVal++;
    $(input).val(inputVal).trigger("change");
  });

  //AIM MODIFIERS HANDLERS
  $(document.body).on("click", ".modifier", function() {
    const active = $(this).hasClass("active");
    const valueSelected = $(this).find(".modifier-value").text().trim();
    const parentBlock = $(this).parent();
    const goonElem = parentBlock.parent().parent().parent().parent();

    if (active) {
      $(this).removeClass("active");
    } else {
      $(this).addClass("active");
    }
    updateModsString(goonElem, valueSelected, active);
  });

  //EXPORT IMPORT HANDLERS
  $(document.body).on("click", ".export-goons", function () {
    $.ajax({
      type: "GET",
      url: "/" + ROOM_ID + "/export-goons",
      success: function (data) {
        download(data);
        donwloadSucceeded("Goon Pack");
      },
      error: function (e) {
        downloadFailed();
        console.log(e);
      }
    });
  })

  $(document.body).on("click", ".export-bois", function () {
    $.ajax({
      type: "GET",
      url: "/" + ROOM_ID + "/export-bois",
      success: function (data) {
        download(data);
        donwloadSucceeded("Bois Pack");
      },
      error: function (e) {
        downloadFailed();
        console.log(e);
      }
    });
  })

  $(document.body).on("click", ".import-goons", async function () {
    let [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    const contents = await file.text();
    socket.emit("import-goons", JSON.parse(decodeURIComponent(contents)))
  })

  $(document.body).on("click", ".import-bois", async function () {
    let [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    const contents = await file.text();
    socket.emit("import-bois", JSON.parse(decodeURIComponent(contents)))
  })
  //quick target selector
  $(document.body).on("click", ".shooter-selector", function () {
    $(".shooter-selector").not(this).removeClass("active");
    const active = $(this).hasClass("active");
    if (!active) {
      $(this).addClass("active");
      setShooter($(this));
    } else {
      $(this).removeClass("active");
      unsetShooter();
    }
  });
  $(document.body).on("click", ".target-selector", function () {
    $(".target-selector").not(this).removeClass("active");
    const active = $(this).hasClass("active");
    if (!active) {
      $(this).addClass("active");
      setTarget($(this));
    } else {
      $(this).removeClass("active");
      unsetTarget();
    }
  });

  //SWITCH FIGHT MODES
  $(document.body).on("click", ".battle-mode-switcher", function () {
    $(".battle-mode-switcher, .ranged, .melee").toggleClass("inactive");
  });
  //chat commands
  $(document.body).on("click", ".roll", function () {
    var e = $.Event( "keydown", { which: 13 } );
    const command = "roll 1d10";
    chatInput.val(command);
    $("html").trigger(e);
  });
  $(document.body).on("click", ".initiative", function() {
    var e = $.Event( "keydown", { which: 13 } );
    const command = "initiative";
    chatInput.val(command);
    $("html").trigger(e);
  })

  //ARMOR SWITCHER
  $(document.body).on("change", '.toggle input', function(e) {
    const goonBlock = $(this).closest(".goon, .boi");
    const goonTemplateObj = formGoonObj(goonBlock);
    socket.emit('update-goon', {type: goonTemplateObj.type, goonTemplate: goonTemplateObj.goonTemplate, name: USER_NAME });
  });
}

//change inputs for different mods
const handleModChange = (changeToMelee) => {
  if(changeToMelee) {
    $(".ranged").addClass("inactive");
  } else {

  }
  const classToDisable = changeToMelee === true ? "ranged" : "melee";
  const classToEnable = changeToMelee === false ? "melee" : "ranged";
  $("." + classToDisable).addClass("inactive");
  $("." + classToEnable).removeClass("inactive");
}

const setShooter = (element) => {
  const parent = element.parent().parent().parent();
  const valueSelector = parent.attr("class").split(/\s+/).slice(0, 2).join("-");
  $(".shooter").val(valueSelector).change();
}

const unsetShooter = () => {
  $(".shooter").val("").change();
}

const setTarget = (element) => {
  const parent = element.parent().parent().parent();
  const valueSelector = parent.attr("class").split(/\s+/).slice(0, 2).join("-");
  $(".target").val(valueSelector).change();
}

const unsetTarget = () => {
  $(".target").val("").change();
}

const download = (data) => {
  const filename = 'goons.json';
  const jsonStr = JSON.stringify(data, null, 2);
  let element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(jsonStr));
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

const donwloadSucceeded = (packText) => {
  $.toast({
    text: "Successfully Downloaded Template :)", // Text that is to be shown in the toast
    heading: `${packText} Donwloaded`, // Optional heading to be shown on the toast
    icon: 'success', // Type of toast icon
    showHideTransition: 'slide', // fade, slide or plain
    allowToastClose: true, // Boolean value true or false
    hideAfter: 5000, // false to make it sticky or number representing the miliseconds as time after which toast needs to be hidden
    stack: 5, // false if there should be only one toast at a time or a number representing the maximum number of toasts to be shown at a time
    position: {
      right: 40,
      bottom: 35
    }, // bottom-left or bottom-right or bottom-center or top-left or top-right or top-center or mid-center or an object representing the left, right, top, bottom values
    
    textAlign: 'left',  // Text alignment i.e. left, right or center
    loader: true,  // Whether to show loader or not. True by default
    loaderBg: '#9EC600',  // Background color of the toast loader
    beforeShow: function () {}, // will be triggered before the toast is shown
    afterShown: function () {}, // will be triggered after the toat has been shown
    beforeHide: function () {}, // will be triggered before the toast gets hidden
    afterHidden: function () {}  // will be triggered after the toast has been hidden
  });
}

const downloadFailed = () => {
  $.toast({
    text: "Failed to download template", // Text that is to be shown in the toast
    heading: 'Template Download Failed', // Optional heading to be shown on the toast
    icon: 'error', // Type of toast icon
    showHideTransition: 'slide', // fade, slide or plain
    allowToastClose: true, // Boolean value true or false
    hideAfter: 5000, // false to make it sticky or number representing the miliseconds as time after which toast needs to be hidden
    stack: 5, // false if there should be only one toast at a time or a number representing the maximum number of toasts to be shown at a time
    position: {
      right: 40,
      bottom: 35
    }, // bottom-left or bottom-right or bottom-center or top-left or top-right or top-center or mid-center or an object representing the left, right, top, bottom values
    
    
    
    textAlign: 'left',  // Text alignment i.e. left, right or center
    loader: true,  // Whether to show loader or not. True by default
    loaderBg: '#9EC600',  // Background color of the toast loader
    beforeShow: function () {}, // will be triggered before the toast is shown
    afterShown: function () {}, // will be triggered after the toat has been shown
    beforeHide: function () {}, // will be triggered before the toast gets hidden
    afterHidden: function () {}  // will be triggered after the toast has been hidden
});
}

const importSucceded = (packText) => {
  $.toast({
    text: `Successfully Imported ${packText} :)`, // Text that is to be shown in the toast
    heading: `${packText} Imported`, // Optional heading to be shown on the toast
    icon: 'success', // Type of toast icon
    showHideTransition: 'slide', // fade, slide or plain
    allowToastClose: true, // Boolean value true or false
    hideAfter: 5000, // false to make it sticky or number representing the miliseconds as time after which toast needs to be hidden
    stack: 5, // false if there should be only one toast at a time or a number representing the maximum number of toasts to be shown at a time
    position: {
      right: 40,
      bottom: 35
    }, // bottom-left or bottom-right or bottom-center or top-left or top-right or top-center or mid-center or an object representing the left, right, top, bottom values
    
    textAlign: 'left',  // Text alignment i.e. left, right or center
    loader: true,  // Whether to show loader or not. True by default
    loaderBg: '#9EC600',  // Background color of the toast loader
    beforeShow: function () {}, // will be triggered before the toast is shown
    afterShown: function () {}, // will be triggered after the toat has been shown
    beforeHide: function () {}, // will be triggered before the toast gets hidden
    afterHidden: function () {}  // will be triggered after the toast has been hidden
  });
}

const importFailed = () => {
  $.toast({
    text: "Failed to import goons", // Text that is to be shown in the toast
    heading: 'Goons import failed', // Optional heading to be shown on the toast
    icon: 'error', // Type of toast icon
    showHideTransition: 'slide', // fade, slide or plain
    allowToastClose: true, // Boolean value true or false
    hideAfter: 5000, // false to make it sticky or number representing the miliseconds as time after which toast needs to be hidden
    stack: 5, // false if there should be only one toast at a time or a number representing the maximum number of toasts to be shown at a time
    position: {
      right: 40,
      bottom: 35
    }, // bottom-left or bottom-right or bottom-center or top-left or top-right or top-center or mid-center or an object representing the left, right, top, bottom values
    
    
    
    textAlign: 'left',  // Text alignment i.e. left, right or center
    loader: true,  // Whether to show loader or not. True by default
    loaderBg: '#9EC600',  // Background color of the toast loader
    beforeShow: function () {}, // will be triggered before the toast is shown
    afterShown: function () {}, // will be triggered after the toat has been shown
    beforeHide: function () {}, // will be triggered before the toast gets hidden
    afterHidden: function () {}  // will be triggered after the toast has been hidden
});
}

const updateModsString = (goonElem, valueSelected, active) => {
  const modsInput = $(goonElem).find(".mods");
  let modsValue = modsInput.val();
  
  const modsArr = modsValue.split(" ");
  const index = modsArr.indexOf(valueSelected);
  if (index > -1) {
    if(active) {
      modsArr.splice(index, 1);
    } else {
      modsArr.push(valueSelected);
    }
  } else {
    if(!active) { 
      modsArr.push(valueSelected);
    }
  }

  let modifierString = modsArr.join(" ");
  modsInput.val(modifierString).trigger("change");
}

const scrollToBottom = () => {
  const d = $('.main-chat-window');
  d.scrollTop(d.prop("scrollHeight"));
}

const resetTargets = () => {
  if ($(".target-select.shooter").val() === "" && $(".target-select.target").val() === "") {
    $(".people").removeClass("fighter-select");
  }
}

function updateShooterList() {
  $(".shooter-selector, .target-selector").removeClass("active");
  $(".people").removeClass("fighter-select");
  $(".goon, .boi").removeClass("shooter-selected").removeClass("target-selected");  
  $(".target-select").each((i, element) => {
    $(element).empty();
    $(element).append('<option selected value="">Asignee</option>');
    for(let i = 0; i < $(".boi").length; i++){
      const goonElem = $(".boi."+i);
      const name = goonElem.find(".goon-name").val();
      $(element).append(`<option selected value="boi-${i}">${ name ? name : 'Boi ' + i}</option>`);
    }
    for(let i = 0; i < $(".goon").length; i++){
      const goonElem = $(".goon."+i);
      const name = goonElem.find(".goon-name").val();
      $(element).append(`<option selected value="goon-${i}">${ name ? name : 'Goon ' + i}</option>`);
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

function populateAimMods () {
  let htmlString = '';
  for (let mod in AIM_MODS) {
    htmlString += `
        <div class="modifier" id="${mod}">
          <div class="modifier-text">
              ${mod}
          </div>
          <div class="modifier-value">
              ${AIM_MODS[mod]}
          </div>
        </div>
    `
  }
  return htmlString;
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
    <div class="left-info">
      <div class="armor-block">
        <img class="shooter-selector" src="goon-icons/action-icons/gun.svg"/>
        <img class="target-selector" src="goon-icons/action-icons/target.svg"/>
        <div class="input-block armor head-block">
            <span class="input-group-btn">
              <button type="button" class="quantity-left-minus btn btn-danger btn-number decrement"  data-type="minus" data-field="">
                -
              </button>
            </span>
            <input type="number" class="head" placeholder="Head Armor Value"  value="0">
            <span class="input-group-btn">
              <button type="button" class="quantity-right-plus btn btn-success btn-number increment" data-type="plus" data-field="">
                +
              </button>
          </span>
        </div>
        <div class="input-block armor torso-block">
            <span class="input-group-btn">
              <button type="button" class="quantity-left-minus btn btn-danger btn-number decrement"  data-type="minus" data-field="">
                -
              </button>
            </span>
            <input type="number" class="torso" placeholder="Torso Armor Value"  value="0">
            <span class="input-group-btn">
              <button type="button" class="quantity-right-plus btn btn-success btn-number increment" data-type="plus" data-field="">
                +
              </button>
          </span>
        </div>
        <div class="input-block armor r-arm-block">
            <span class="input-group-btn">
              <button type="button" class="quantity-left-minus btn btn-danger btn-number decrement"  data-type="minus" data-field="">
                -
              </button>
            </span>
            <input type="number" class="r-arm" placeholder="R-arm Armor Value"  value="0">
            <span class="input-group-btn">
              <button type="button" class="quantity-right-plus btn btn-success btn-number increment" data-type="plus" data-field="">
                +
              </button>
          </span>
        </div>
        <div class="input-block armor l-arm-block">
            <span class="input-group-btn">
              <button type="button" class="quantity-left-minus btn btn-danger btn-number decrement"  data-type="minus" data-field="">
                -
              </button>
            </span>
            <input type="number" class="l-arm" placeholder="L-arm Armor Value"  value="0">
            <span class="input-group-btn">
              <button type="button" class="quantity-right-plus btn btn-success btn-number increment" data-type="plus" data-field="">
                +
              </button>
          </span>
        </div>
        <div class="input-block armor r-leg-block">
            <span class="input-group-btn">
              <button type="button" class="quantity-left-minus btn btn-danger btn-number decrement"  data-type="minus" data-field="">
                -
              </button>
            </span>
            <input type="number" class="r-leg" placeholder="R-leg Armor Value"  value="0">
            <span class="input-group-btn">
              <button type="button" class="quantity-right-plus btn btn-success btn-number increment" data-type="plus" data-field="">
                +
              </button>
          </span>
        </div>
        <div class="input-block armor l-leg-block">
            <span class="input-group-btn">
              <button type="button" class="quantity-left-minus btn btn-danger btn-number decrement"  data-type="minus" data-field="">
                -
              </button>
            </span>
            <input type="number" class="l-leg" placeholder="L-leg Armor Value"  value="0">
            <span class="input-group-btn">
              <button type="button" class="quantity-right-plus btn btn-success btn-number increment" data-type="plus" data-field="">
                +
              </button>
          </span>
        </div>
        <div class="input-block armor head-hp-block">
            <span class="input-group-btn">
              <button type="button" class="quantity-left-minus btn btn-danger btn-number decrement"  data-type="minus" data-field="">
                -
              </button>
            </span>
            <input type="text" class="head-hp hp" placeholder="Head hp Value"  value="-">
            <span class="input-group-btn">
              <button type="button" class="quantity-right-plus btn btn-success btn-number increment" data-type="plus" data-field="">
                +
              </button>
          </span>
        </div>
        <input type="checkbox" checked data-place="head" data-toggle="toggle" data-on="Soft" data-off="Hard" data-onstyle="primary" data-offstyle="danger">
        <div class="input-block armor torso-hp-block">
            <span class="input-group-btn">
              <button type="button" class="quantity-left-minus btn btn-danger btn-number decrement"  data-type="minus" data-field="">
                -
              </button>
            </span>
            <input type="text" class="torso-hp hp" placeholder="Torso hp Value"  value="-">
            <span class="input-group-btn">
              <button type="button" class="quantity-right-plus btn btn-success btn-number increment" data-type="plus" data-field="">
                +
              </button>
          </span>
        </div>
        <input type="checkbox" checked data-place="torso" data-toggle="toggle" data-on="Soft" data-off="Hard" data-onstyle="primary" data-offstyle="danger">
        <div class="input-block armor r-arm-hp-block">
            <span class="input-group-btn">
              <button type="button" class="quantity-left-minus btn btn-danger btn-number decrement"  data-type="minus" data-field="">
                -
              </button>
            </span>
            <input type="text" class="r-arm-hp hp" placeholder="R-arm hp Value"  value="-">
            <span class="input-group-btn">
              <button type="button" class="quantity-right-plus btn btn-success btn-number increment" data-type="plus" data-field="">
                +
              </button>
          </span>
        </div>
        <input type="checkbox" checked data-place="r-arm" data-toggle="toggle" data-on="Soft" data-off="Hard" data-onstyle="primary" data-offstyle="danger">
        <div class="input-block armor l-arm-hp-block">
            <span class="input-group-btn">
              <button type="button" class="quantity-left-minus btn btn-danger btn-number decrement"  data-type="minus" data-field="">
                -
              </button>
            </span>
            <input type="text" class="l-arm-hp hp" placeholder="L-arm hp Value"  value="-">
            <span class="input-group-btn">
              <button type="button" class="quantity-right-plus btn btn-success btn-number increment" data-type="plus" data-field="">
                +
              </button>
          </span>
        </div>
        <input type="checkbox" checked data-place="l-arm" data-toggle="toggle" data-on="Soft" data-off="Hard" data-onstyle="primary" data-offstyle="danger">
        <div class="input-block armor r-leg-hp-block">
            <span class="input-group-btn">
              <button type="button" class="quantity-left-minus btn btn-danger btn-number decrement"  data-type="minus" data-field="">
                -
              </button>
            </span>
            <input type="text" class="r-leg-hp hp" placeholder="R-leg hp Value"  value="-">
            <span class="input-group-btn">
              <button type="button" class="quantity-right-plus btn btn-success btn-number increment" data-type="plus" data-field="">
                +
              </button>
          </span>
        </div>
        <input type="checkbox" checked data-place="r-leg" data-toggle="toggle" data-on="Soft" data-off="Hard" data-onstyle="primary" data-offstyle="danger">
        <div class="input-block armor l-leg-hp-block">
            <span class="input-group-btn">
              <button type="button" class="quantity-left-minus btn btn-danger btn-number decrement"  data-type="minus" data-field="">
                -
              </button>
            </span>
            <input type="text" class="l-leg-hp hp" placeholder="L-leg hp Value"  value="-">
            <span class="input-group-btn">
              <button type="button" class="quantity-right-plus btn btn-success btn-number increment" data-type="plus" data-field="">
                +
              </button>
          </span>
        </div>
        <input type="checkbox" checked data-place="l-leg" data-toggle="toggle" data-on="Soft" data-off="Hard" data-onstyle="primary" data-offstyle="danger">
        <img src="goon-icons/${goonIcon}.png">
        <div class="buttons-block">
          <button type="button" class="btn btn-danger remove-goon">Kill</button>
        </div>
       
      </div>
      <div class="personal-info">
        <h6 class="category-title personal-title">
          Personal Info <i class="material-icons">control_point</i>
        </h6>
        <div class="personal-stats">
          <div class="form-group fighter-stat-row">
              <label for="goon-name">NAME</label>
              <input type="text" class="form-control goon-name" aria-describedby="name-hint" placeholder="NAME" value="${type} ${index}" data-initial-value="${type} ${index}">
              <small id="name-hint" class="form-text text-muted">You were 0 and still...</small>
          </div>
          <h6 class="category-title personal-title aim-mods-title">
            Fast Aim Modifiers <i class="material-icons">control_point</i>
          </h6>
          <div class="form-group aim-modifiers-list">
            ${populateAimMods()}
          </div>
        </div>
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
         <label for="ref">REF (INITIAL/DYNAMIC)</label>
         <div class="multiple-inputs">
            <div class="input-block">
                <span class="input-group-btn">
                  <button type="button" class="quantity-left-minus btn btn-danger btn-number decrement"  data-type="minus" data-field="">
                    -
                  </button>
                </span>
                <input type="number" class="form-control initial-ref" aria-describedby="ref-hint" placeholder="REF" value="0">
                <span class="input-group-btn">
                  <button type="button" class="quantity-right-plus btn btn-success btn-number increment" data-type="plus" data-field="">
                    +
                  </button>
              </span>
            </div>
            <span class="seperator">
                /
            </span>
            <div class="input-block">
                <span class="input-group-btn">
                  <button type="button" class="quantity-left-minus btn btn-danger btn-number decrement"  data-type="minus" data-field="">
                    -
                  </button>
                </span>
                <input type="number" class="form-control ref" aria-describedby="ref-hint" placeholder="REF" value="0">
                <span class="input-group-btn">
                  <button type="button" class="quantity-right-plus btn btn-success btn-number increment" data-type="plus" data-field="">
                    +
                  </button>
              </span>
            </div>
          </div>
         <small id="ref-hint" class="form-text text-muted">Only dynamic stat is used for calculations.</small>
      </div>
      <div class="form-group fighter-stat-row">
        <label for="body">BODY (INITIAL/DYNAMIC)</label>
        <div class="multiple-inputs">
        <div class="input-block">
           <span class="input-group-btn">
              <button type="button" class="quantity-left-minus btn btn-danger btn-number decrement"  data-type="minus" data-field="">
                -
              </button>
           </span>
           <input type="number" class="form-control initial-body" aria-describedby="body-hint" placeholder="BODY" value="0">
           <span class="input-group-btn">
              <button type="button" class="quantity-right-plus btn btn-success btn-number increment" data-type="plus" data-field="">
                +
              </button>
          </span>
        </div>
        <span class="seperator">
           /
        </span>
        <div class="input-block">
           <span class="input-group-btn">
              <button type="button" class="quantity-left-minus btn btn-danger btn-number decrement"  data-type="minus" data-field="">
                -
              </button>
           </span>
           <input type="number" class="form-control body" aria-describedby="body-hint" placeholder="BODY" value="0">
           <span class="input-group-btn">
              <button type="button" class="quantity-right-plus btn btn-success btn-number increment" data-type="plus" data-field="">
                +
              </button>
          </span>
        </div>
     </div>
        <small id="body-hint" class="form-text text-muted">Only dynamic stat is used for calculations.</small>
      </div>
      <div class="form-group fighter-stat-row">
         <label for="btm">BTM (INITIAL/DYNAMIC)</label>
         <div class="multiple-inputs">
            <div class="input-block">
                <span class="input-group-btn">
                  <button type="button" class="quantity-left-minus btn btn-danger btn-number decrement"  data-type="minus" data-field="">
                    -
                  </button>
                </span>
                <input type="number" class="form-control initial-btm" aria-describedby="btm-hint" placeholder="BTM" value="0">
                <span class="input-group-btn">
                  <button type="button" class="quantity-right-plus btn btn-success btn-number increment" data-type="plus" data-field="">
                    +
                  </button>
              </span>
            </div>
            <span class="seperator">
                /
            </span>
            <div class="input-block">
                <span class="input-group-btn">
                  <button type="button" class="quantity-left-minus btn btn-danger btn-number decrement"  data-type="minus" data-field="">
                    -
                  </button>
                </span>
                <input type="number" class="form-control btm" aria-describedby="btm-hint" placeholder="BTM" value="0">
                <span class="input-group-btn">
                  <button type="button" class="quantity-right-plus btn btn-success btn-number increment" data-type="plus" data-field="">
                    +
                  </button>
              </span>
            </div>
          </div>
         <small id="btm-hint" class="form-text text-muted">Only dynamic stat is used for calculations.</small>
      </div>
      <div class="form-group fighter-stat-row">
         <label for="wpn">Weapon Skill</label>
         <div class="input-block">
            <span class="input-group-btn">
                <button type="button" class="quantity-left-minus btn btn-danger btn-number decrement"  data-type="minus" data-field="">
                  -
                </button>
            </span>
            <input type="number" class="form-control wpn" aria-describedby="wpn-hint" placeholder="Weapon Skill" value="0">
            <span class="input-group-btn">
                <button type="button" class="quantity-right-plus btn btn-success btn-number increment" data-type="plus" data-field="">
                  +
                </button>
            </span>
         </div>
         <small id="wpn-hint" class="form-text text-muted">One good shot can solve any problem.</small>
      </div>
      <div class="form-group fighter-stat-row">
            <label for="def">Defensive Skill</label>
            <div class="input-block">
                <span class="input-group-btn">
                  <button type="button" class="quantity-left-minus btn btn-danger btn-number decrement"  data-type="minus" data-field="">
                    -
                  </button>
                </span>
                <input type="number" class="form-control def" aria-describedby="def-hint" placeholder="Defensive Skill" value="0">
                <span class="input-group-btn">
                  <button type="button" class="quantity-right-plus btn btn-success btn-number increment" data-type="plus" data-field="">
                    +
                  </button>
                </span>
            </div>
            <small id="def-hint" class="form-text text-muted">(Athletics/Parry/Blocking/Brawling, etc.)</small>
        </div>
      <div class="form-group fighter-stat-row">
         <label for="mods">Other Aim Modifiers</label>
         <input type="text" class="form-control mods" aria-describedby="mods-hint" placeholder="Mods" value="">
         <small id="mods-hint" class="form-text text-muted">Write mods with "space" button. For instance : -1 2 -3.</small>
      </div>
      </div>
    </div>
  </div>`);
  console.log("Selector: " + `boi.${index}`)
  console.log($(`.${blockCategory}.${index}`))
  $(`.${blockCategory}.${index} input[type="checkbox"]`).bootstrapToggle();
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

function getActiveModsList(goonBlock) {
  const modsList = [];
  $(goonBlock).find(".modifier.active").each((i, element) => {
    const text = $(element).find(".modifier-text").text().trim();
    modsList.push(text);
  });
  return modsList;
}

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
  //const isSofr toggles
  const headSoft = goonBlock.find('.head-hp-block').next().find('input').prop('checked');
  const torsoSoft = goonBlock.find('.torso-hp-block').next().find('input').prop('checked');
  const lArmSoft = goonBlock.find('.l-arm-hp-block').next().find('input').prop('checked');
  const rArmSoft = goonBlock.find('.r-arm-hp-block').next().find('input').prop('checked');
  const lLegSoft = goonBlock.find('.l-leg-hp-block').next().find('input').prop('checked');
  const rLegSoft = goonBlock.find('.r-leg-hp-block').next().find('input').prop('checked');
  //variables - battle stats
  const initRefStat = goonBlock.find('.fighter-stat-row .initial-ref').val();
  const refStat = goonBlock.find('.fighter-stat-row .ref').val();
  const initBodyStat = goonBlock.find('.fighter-stat-row .initial-body').val();
  const bodyStat = goonBlock.find('.fighter-stat-row .body').val();
  const initBtmStat = goonBlock.find('.fighter-stat-row .initial-btm').val();
  const btmStat = goonBlock.find('.fighter-stat-row .btm').val();
  const wpnStat = goonBlock.find('.fighter-stat-row .wpn').val();
  const defStat = goonBlock.find('.fighter-stat-row .def').val();
  const modStat = goonBlock.find('.fighter-stat-row .mods').val();
  //variables - additioanl stats
  const name = goonBlock.find('.goon-name').val();
  //check for selected mods
  const selectedMods = getActiveModsList(goonBlock);
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
        isSoft: {
            head: headSoft,
            torso: torsoSoft,
            lArm: lArmSoft,
            rArm: rArmSoft,
            lLeg: lLegSoft,
            rLeg: rLegSoft
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
      initialRef: initRefStat ? parseInt(initRefStat) : 0,
      ref: refStat ? parseInt(refStat) : 0,
      initialBody: initBodyStat ? parseInt(initBodyStat) : 0,
      body: bodyStat ? parseInt(bodyStat) : 0,
      initialBtm: initBtmStat ? parseInt(initBtmStat) : 0,
      btm: btmStat ? parseInt(btmStat) : 0,
      wpn: wpnStat ? parseInt(wpnStat) : 0,
      def: defStat ? parseInt(defStat) : 0,
      mods: modStat ? modStat : "",
      selectedMods: selectedMods ? selectedMods : []
    },
    additionalStats: {
      name: name ? name : ""
    }
  };
  return {
    goonTemplate: goonTemplate,
    type: type
  }
}