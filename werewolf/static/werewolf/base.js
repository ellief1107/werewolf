 
//add shadow effect to card element when hover
$(document).ready(function() {
    $( ".card" ).hover(
        function() {
            $(this).addClass('shadow-lg').css('cursor', 'pointer'); 
        }, 
        function() {
            $(this).removeClass('shadow-lg');
        }
    ); 
});


//copy room information to clipboard
function copy(){
    var id = document.getElementById("roomID").innerHTML;
    var pw = document.getElementById("password").innerHTML;
    var message = "RoomID: " + id + ", Password: " + pw;
    navigator.clipboard.writeText(message);
}


//require data from models every 1 second.
function getData() {
    var dataNow = new Date();
    var databefore = new Date(dataNow.getTime() - 5000);
    var isotime = databefore.toISOString();
    $.ajax({
        url: "/werewolf/refresh-page",
        data: "last_refresh="+isotime,
        dataType : "json",
        success: updateComments
    });
}



//update comments board.
function updateComments(response) {
    console.log("get data")
    var roomID = $("#roomID").val();
    var userID =
    console.log("At roomID = " + roomID )
    length = response.length;

    var roomPk = 0;   //index of the data we want in the response.
    if (roomID != null) {
        for (i = 0; i < response.length; i++) {
            if (response[i].model == "werewolf.room") {
                if (response[i].pk == roomID) {
                    var numberOfPlayers = response[i].fields.numOfPlayer;
                    roomPk = i;
                }
            }
        }
    }


    //update the comment and game-log in the main game page and data is from the response.
    if ($("#comment-board").val() != null) {
        console.log(response[roomPk].fields.comment_board);
        $("#comment-board").text(response[roomPk].fields.comment_board);
        $("#game-log").text(response[roomPk].fields.game_log);
        console.log($("#comment-board").val());
        console.log($("#game_log").val());
    }


    if (roomID != null) {
        if (response[roomPk].fields.game_log == "wolf starts kill.") {
            setTimeout(function() { wolf_kill(response); }, 2000);
            updateStatus(response);
        }

        //let the wolf choose the same victim.
        if (response[roomPk].fields.game_log == "wolf choose again.") {
            setTimeout(function() { wolf_kill_again(response); }, 2000);
            updateStatus(response);

        }

        if (response[roomPk].fields.game_log == "wolves finished killing.") {
            setTimeout(function() { doctor(response); }, 2000);
            updateStatus(response);
        }

        if (response[roomPk].fields.game_log == "seer has checked one role's id.") {
            setTimeout(function() { day_conclude_wolf(response); }, 2000);
            updateStatus(response);

        }

        //when the game log becomes seers starts to work, execute function seer();
        if (response[roomPk].fields.game_log == "seer starts to work.") {
            setTimeout(function() { seer(response); }, 2000);
            updateStatus(response);
        }

       if (response[roomPk].fields.game_log == "Day conclude wolf killing part finished.") {
           day_speak(response);
           display_audio(response);
           updateStatus(response)
       }

       if (response[roomPk].fields.game_log == "Finish speaking.") {
           setTimeout(function() { vote_day(response);}, 2000);
           updateStatus(response);
       }

       if (response[roomPk].fields.game_log == "vote finish.") {
           setTimeout(function() { end_game(response); }, 2000);
           updateStatus(response);

       }
       if (response[roomPk].fields.game_log == "not end") {
            setTimeout(function() { start_game(response); }, 2000);
            updateStatus(response);
       }
    }
}


window.onload = getData;
window.setInterval(getData, 1000);


function updateStatus(response) {
    var roomID = $("#roomID").val();
    var player_id = []
    var player_status = []
    for (var i = 0; i < response.length; i++) {
        if (response[i].fields.currentRoom == roomID) {
            player_id.push(response[i].pk)
            player_status.push(response[i].fields.status_txt)
        }
    }
    console.log(player_status)
    console.log(player_id)
    var userID = $("#currentUserId").val();
    for (var i = 0; i < player_id.length; i++) {
        $("#status_" + player_id[i]+ "_" + roomID).text("Status: " + player_status[i]);
    }
}


var map = new Map();
function getPlayers(roomID) {
    var readyNum;
    map.set(roomID, []);
    $.ajax({
        url: "/werewolf/get-players/" + roomID,
        dataType : "json",
        async: false,
        success: function(response) {
            readyNum = response.length;
            for(i = 0; i < response.length; i++) {
                var userID = response[i].fields.user;
                var username = getUsername(userID);
                map.get(roomID).push(username);
            }
        }
    });
    $("#ready-num_"+roomID).text(readyNum);
    //compute missing number of players
    var total = $("#totalplayers_"+roomID).text();
    var missing = parseInt(total) - parseInt(readyNum);
    $("#missing_"+roomID).text(missing);
    //update room members information
    $("#members_"+roomID).empty();
    for(i = 0; i < map.get(roomID).length; i++) {
        $("#members_"+roomID).append("<span class='room_members'>"+map.get(roomID)[i]+"</span><br>");
    }
    if (missing > 0) {
        $("#joinButton_" + roomID).show();
        $("#startButton_" + roomID).hide();
    }
    if (missing == 0) {
        $("#joinButton_" + roomID).hide();
        $("#startButton_" + roomID).show();
    }
}


function check_card(roomID, userID) {
    $.ajax({
    url:"/werewolf/check_card/" + roomID,
    dataType:"text",
    async:false,
    success: function(response) {
        role = response;
        }
    });
    $("#current_role").text(role);
    $("#check_card_" + roomID + "_" + userID).hide();
    console.log("check hide")
    $("#check_card_" + roomID + "_" + userID).attr("disabled", true);
    console.log("check disabled")
    $("#check_txt_" + roomID + "_" + userID).hide();
    console.log("check text hide")
    $("#current_role").append("<div><input class='ready_button btn btn-dark' type = 'button' onclick='ready(" + roomID + "," + userID +")'"+ "id = 'ready_" + roomID + "_"+ userID + "' value='Ready'></div>");
}



function ready(roomID, userID) {
    var readyNum;
    $.ajax({
    url:"/werewolf/ready/" + roomID,
    dataType:"json",
    async:false,
    success: function(response) {
        }
    });
    $("#ready_" + roomID + "_" + userID).hide();
    $("#ready_" + roomID + "_" + userID).attr("disabled", true);
}


function wolf_kill(response) {

    console.log("function wolf kill");
    var role = $("#currentUserRole").val();
    console.log("wolf_kill_role_get "+ role)
    var roomID = $("#roomID").val();
    console.log("wolf_kill_roomID_get"+ roomID)
    var userID = $("#currentUserId").val();
    console.log("wolf kill currentID get")
    $("#current_role").text(role);

    $("#check_card_" + roomID + "_" + userID).hide();
    console.log("check hide")

    $("#check_card_" + roomID + "_" + userID).attr("disabled", true);
    console.log("check disabled")

    $("#check_txt_" + roomID + "_" + userID).hide();


    //remove all the vote button (in case)
    var button_array2 = document.getElementsByClassName("vote");
    for(var i = 0, len = button_array2.length; i < len; i++){
        console.log("remove " + i)
        $(button_array2[i]).remove();
    }

    var role_status;
    for (var i = 0; i < response.length; i++) {
        if (response[i].fields.user == userID) {
            role_status = response[i].fields.status_txt;
        }
    }

    console.log("check text hide")
    if (role == "wolf") {
        if (role_status == "live") {
            $("#chat-log2").show();
            console.log("chat-log 2 show")
            $("#chat-log").hide();
            console.log("chat log 1 hide")
            //********************BEGIN*********************************
            //enable text input
            $("#chat-message-input").attr("disabled", false);
            $("#chat-message-input").css({'background-color' : '#ffffff'})
            $("#chat-message-submit").attr("disabled", false);
            $("#chat-message-submit").css({'background-color' : ''})
            //********************END*********************************
            if (roomID != null) {
                console.log("roomID is " + roomID)
                for (i = 0; i < response.length; i++) {
                    if (response[i].model == "werewolf.room") {
                        if (response[i].pk == roomID) {
                            var numberOfPlayers = response[i].fields.numOfPlayers;
                            console.log("get number of players in this room which is "+ numberOfPlayers)
                        }
                    }
                }
            }
            var arr = [];
            var arr_lived = new Array();
            for (i = 0; i < response.length; i++) {
                if (response[i].model == "werewolf.profile") {
                    if (response[i].fields.currentRoom == roomID) {
                        console.log(response[i].fields.currentRoom)
                        arr.push(response[i].pk);
                        if (response[i].fields.status == false) {
                            arr_lived.push(response[i].pk);
                        }
                    }
                }
            }
            console.log("get players id "+ arr)
            console.log("get lived players id " + arr_lived)
            for (i = 0; i < numberOfPlayers; i++) {
                if (getRole(arr[i]) == "wolf") {
                    console.log("player"+arr[i]+" is a wolf");
                    if (document.getElementById('wolf_' + arr[i] + '_' + roomID) == null) {
                        console.log('wolf_' + arr[i] + '_' + roomID)
                        $("#card_" + arr[i] + "_" + roomID).append("<h3 class= 'card-text' id ='wolf_" + arr[i] + '_' + roomID  + "'>  wolf </h3>");
                        console.log(arr[i] + "is wolf and success append wolf tag")
                    }
                }
            }
            for (i = 0; i < arr_lived.length; i++) {
                if (document.getElementById('wolf_kill_1_' + arr_lived[i]) == null) {
                     console.log('wolf_kill_1_' + arr_lived[i])
                     $("#card_" + arr_lived[i] + "_" + roomID).append("<div><input width = 100% type='button' class = 'row btn btn-warning kill' value = 'Kill' onclick='wolf_kill_1(" + roomID + "," + userID + "," +arr_lived[i] + ")'" + "id='wolf_kill_1_" + arr_lived[i]+ "'></div>")
                     console.log("player "+ arr_lived[i] + "is wolf and append kill button.")
                }
            }
        }
    }
 }





function wolf_kill_1(roomID, userID, killedID) {
    console.log("at room " +roomID + ", " + userID + " killed " + killedID);
    var button_array = document.getElementsByClassName("kill");
    for(var i = 0, len = button_array.length; i < len; i++){
        $(button_array[i]).hide();
        $(button_array[i]).attr("disabled", true);
//        $(button_array[i]).remove();
    }
    $.ajax({
        url: "/werewolf/wolf_kill_1/" + roomID + "/"  + userID + "/" + killedID,
        dataType: "text",
        async: false,
        success: function(response) {
            console.log(response)
        }
    });

    console.log("at room " +roomID + ", " + userID + " killed " + killedID + " success")
}

function wolf_kill_again(response) {
    var role = $("#currentUserRole").val();
    var roomID = $("#roomID").val();
    if (role == "wolf") {
        console.log("is wolf")
        var button_array = document.getElementsByClassName("kill");
        for(var i = 0, len = button_array.length; i < len; i++) {
            $(button_array[i]).remove();
        }
    }
    $.ajax({
        url: "/werewolf/kill_again/" + roomID,
        dataType: "text",
        async: false,
        success: function(response) {
            console.log(response)
        }
    });

}


function doctor(response) {
    //**********************BEGIN******************************************
    //disable text input and change background
    $("#chat-message-input").attr("disabled", true);
    $("#chat-message-input").css({'background-color' : '#b3b3b3'})
    $("#chat-message-submit").attr("disabled", true);
    $("#chat-message-submit").css({'background-color' : '#b3b3b3'})
    //**********************END********************************************
    var role = $("#currentUserRole").val();
    var roomID = $("#roomID").val();
    var userID = $("#currentUserId").val();
    console.log(role + " in function doctor")
    console.log(roomID + " in function doctor")
    console.log(userID + " in function doctor")
    $("#check_card_" + roomID + "_" + userID).hide();
    console.log("check hide")
    $("#check_card_" + roomID + "_" + userID).attr("disabled", true);
    console.log("check disabled")
    $("#check_txt_" + roomID + "_" + userID).hide();
    console.log("check text hide")
    $("#current_role").text(role);
    //remove all the kill button
    kill_button_array = document.getElementsByClassName("kill")
    for (var i = 0; i < kill_button_array.length; i++) {
        $(kill_button_array[i]).remove()
    }
    //to see the status of the doctor
    var rolePk;
    for (var i = 0; i < response.length; i++) {
        if (response[i].model == "werewolf.profile") {
            if (response[i].fields.currentRoom == roomID) {
                if (response[i].fields.role == "doctor") {
                   rolePk = i;
                }
            }
        }
    }
    if (role == "doctor") {
        if (response[rolePk].fields.status_txt == "live") {
        console.log("role is doctor.")
        for (var i = 0; i < response.length; i++) {
            if (response[i].model == "werewolf.room") {
                console.log("model is werewolf.room")
                if (response[i].pk == roomID) {
                    console.log("roomID == " + response[i].pk)
                    console.log("doctor_heal_or_not "+response[i].fields.doctor_heal_or_not)
                    if (response[i].fields.doctor_heal_or_not == false) {
                        console.log("doctor_heal_or_not "+response[i].fields.doctor_heal_or_not)
                        doctor_heal_player(response);
                        console.log("function doctor_heal_player starts.")
                    }
                    if (response[i].fields.doctor_heal_or_not == true) {
                        doctor_not_heal_player(response);
                    }
                }
            }
        }
    }
        if (response[rolePk].fields.status_txt != "live") {
         doctor_die(response);
        }
    }
}


function doctor_heal_player(response) {
    var role = $("#currentUserRole").val();
    var roomID = $("#roomID").val();
    var userID = $("#currentUserId").val();
    var killedUser;
    for (var i = 0; i < response.length; i++) {
        if (response[i].model == "werewolf.room") {
            if (response[i].pk == roomID) {
                killedUser = response[i].fields.wolf_kill_1[0];
                console.log("killed user is  "+killedUser)
            }
        }
    }
    if(role == "doctor") {
        if(roomID != null) {
            //add 'Heal' and 'Not Heal' buttons
            if (document.getElementById("heal_"+roomID+"_"+userID) == null) {
                if (document.getElementById("not_heal_"+roomID+"_"+userID) == null) {
                console.log("append in doctor")
                $("#card_" + killedUser + "_" + roomID).append("<div><button class='heal btn btn-warning' id = 'heal_" + roomID + "_" +userID
                + "' onclick='doctor_heal(" + roomID + "," + userID + "," + killedUser + ")'>Heal</button></div>"
                + "<div><button class='heal btn btn-warning' id = 'not_heal_" + roomID + "_" + userID
                +"' onclick='doctor_not_heal(" + roomID + "," + userID + "," + killedUser + ")'>Not Heal</button></div>")
                }
            }
//            if ($("#heal_"+roomID+"_"+userID) != null) {
//                if ($("#not_heal_"+roomID+"_"+userID) != null) {
//                    console.log("reshow")
//                    if ($("#heal_"+roomID+"_"+userID).is(":visible") == false) {
//                        $("#heal_"+roomID+"_"+userID).show();
//                    }
//                    if ($("#not_heal_"+roomID+"_"+userID).is(":visible") == false) {
//                        $("#not_heal_"+roomID+"_"+userID).show();
//                    }
//                }
//            }
        }
    }
}


function doctor_heal(roomID, userID, healedID) {
    console.log("at room " +roomID + ", " + userID + " healed " + healedID);
    var button_array = document.getElementsByClassName("heal");
    for(var i = 0, len = button_array.length; i < len; i++){
        $(button_array[i]).hide();
        $(button_array[i]).attr("disabled", true);
    }
    console.log("buttons disappear")
    $.ajax({
        url: "/werewolf/doctor_heal/" + roomID + "/"  + userID + "/" + healedID,
        dataType: "text",
        async: false,
        success: function(response) {
        }
    });
}


function doctor_not_heal(roomID, userID, healedID) {
    console.log("at room " +roomID + ", " + userID + " healed " + healedID);

    var button_array = document.getElementsByClassName("heal");
        for(var i = 0, len = button_array.length; i < len; i++){
            $(button_array[i]).hide();
            $(button_array[i]).attr("disabled", true);
        }
    console.log("disappear")
    $.ajax({
        url: "/werewolf/doctor_not_heal/" + roomID + "/"  + userID + "/" + healedID,
        dataType: "text",
        async: false,
        success: function(response) {
        }
    });
}


function doctor_not_heal_player(response) {
    var role = $("#currentUserRole").val();
    var roomID = $("#roomID").val();
    var userID = $("#currentUserId").val();
    $("#remind").text("You have only one chance to heal a player and you have used it.");
    if(document.getElementById("doctor_heal2") == null) {
        $("#remind").append("<input type='button', class = 'btn btn-warning' value = 'Got it' onclick= 'doctor_heal2(" + roomID + "," + userID + ")'" + "id='doctor_heal2'>")
    }
    //$("#doctor_heal2").attr("disabled", false);
//    $("#chat_log").append("<div><h3 class= 'card-text' id ='remind" + userID + "_" + roomID  + "'>  You have only one chance to heal a player to know his role and you have used it.</h3></div>");
}


function doctor_heal2(roomID, userID) {
    $("#remind").empty();
    $("#doctor_heal2").hide();
    $("#doctor_heal2").attr("disabled", true);
    $.ajax({
        url:"/werewolf/doctor_heal2/" + roomID + "/" + userID,
        dataType:"text",
        async:false,
        success: function(response) {
        }
    });
}

function doctor_die(response) {
    var role = $("#currentUserRole").val();
    var roomID = $("#roomID").val();
    var userID = $("#currentUserId").val();
    $("#remind").text("You are died and you can't heal people");
    if(document.getElementById("doctor_heal2") == null) {
        $("#remind").append("<input type='button', class = 'btn btn-warning' value = 'Got it' onclick= 'doctor_heal2(" + roomID + "," + userID + ")'" + "id='doctor_heal2'>")
    }
    //$("#doctor_heal2").attr("disabled", false);

}


//to decide whether the seer has used the only opportunity to see others role.
function seer(response) {
    $("#remind").empty();
    $("#doctor_heal2").remove();
    var role = $("#currentUserRole").val();
    var roomID = $("#roomID").val();
    var userID = $("#currentUserId").val();
    $("#check_card_" + roomID + "_" + userID).hide();
    console.log("check hide")
    $("#check_card_" + roomID + "_" + userID).attr("disabled", true);
    console.log("check disabled")
    $("#check_txt_" + roomID + "_" + userID).hide();
    console.log("check text hide")
    $("#current_role").text(role);
    var rolePk;
    // remove all the heal buttonls
    var heal_button_array = document.getElementsByClassName("heal")
    for (var i = 0 ; i < heal_button_array.length; i++) {
        $(heal_button_array[i]).remove();
    }

    for (var i = 0; i < response.length; i++) {
        if (response[i].model == "werewolf.profile") {
            if (response[i].fields.currentRoom == roomID) {
                if (response[i].fields.role == "seer") {
                   rolePk = i;
                }
            }
        }
    }
    console.log("role of seer pk is " + rolePk)
    if (role == "seer") {
        if (response[rolePk].fields.status_txt == "live") {
            for (var i = 0; i < response.length; i++) {
                if (response[i].model == "werewolf.room") {
                    if (response[i].pk == roomID) {
                        if (response[i].fields.seer_select == false) {
                            seer_select_player(response);
                        }
                        if (response[i].fields.seer_select == true) {
                            seer_not_select(response);
                            console.log("true")
                        }
                    }
                }
            }
        }
        if (response[rolePk].fields.status_txt != "live") {
        console.log("seer die.")
        seer_die(response);
        }
    }
}


// seer_save part
function seer_select_player(response){
    console.log("reach seer select player function")
    var role = $("#currentUserRole").val();
    var roomID = $("#roomID").val();
    var userID = $("#currentUserId").val();
    var arr = [];
    for (var i = 0; i < response.length; i++) {
        if (response[i].model = "werewolf.profile") {
            arr.push(response[i].pk);
        }
    }
    for (var i = 0; i < arr.length; i++) {
        if (document.getElementById('seer_select_' + arr[i]) == null) {
            $("#card_" + arr[i] + "_" + roomID).append("<div><input width = 100% type='button' class = 'row btn btn-warning select' value = 'Select' onclick='seer_select(" + roomID + "," + userID + "," +arr[i] + ")'" + "id='seer_select_" + arr[i]+ "'></div>");
        }
    }
}


function seer_select(roomID, userID, selectedID) {
    var button_array = document.getElementsByClassName("select");
    for(var i = 0, len = button_array.length; i < len; i++){
        $(button_array[i]).hide();
        $(button_array[i]).attr("disabled", true);
    }
    $.ajax({
        url: "/werewolf/seer_select/" + roomID + "/"  + userID + "/" + selectedID,
        dataType: "text",
        async: false,
        success: function(response) {
             $("#card_" + selectedID + "_" + roomID).append("<h3 class= 'card-text' id ='seer_selected_role_" + selectedID + '_' + roomID  + "'>" + response + "</h3>");
        }
    });
}


//if seer did not sa
function seer_not_select(response) {
    var role = $("#currentUserRole").val();
    var roomID = $("#roomID").val();
    var userID = $("#currentUserId").val();
    console.log("will show")
    $("#remind").text("You have only one chance to check a player's role and you have used it.");
    if(document.getElementById("seer_select2") == null) {
        $("#remind").append("<input type='button', class = 'btn btn-warning' value = 'Got it' onclick= 'seer_select2(" + roomID + "," + userID + ")'" + "id='seer_select2'>")
    }
    //$("#seer_select2").attr("disabled", false);
    //$("#remind").append("<input type='button', class = 'btn btn-warning' value = 'Got it' onclick= 'seer_select2(" + roomID + "," + userID + ")'" + "id='seer_select2'>")
//    $("#chat_log").append("<div><h3 class= 'card-text' id ='remind" + userID + "_" + roomID  + "'>  You have only one chance to select a player to know his role and you have used it.</h3></div>");
    console.log("show")
}


function seer_die(response) {
    var role = $("#currentUserRole").val();
    var roomID = $("#roomID").val();
    var userID = $("#currentUserId").val();
    console.log("remind")
    $("#remind").text("You are died, so you can't check others role.   ");
    if(document.getElementById("seer_select2") == null) {
        $("#remind").append("<input type='button', class = 'btn btn-warning' value = 'Got it' onclick= 'seer_select2(" + roomID + "," + userID + ")'" + "id='seer_select2'>")
    }
    //$("#seer_select2").attr("disabled", false);
    //$("#remind").append("<input type='button', class = 'btn btn-warning' value = 'Got it' onclick= 'seer_select2(" + roomID + "," + userID + ")'" + "id='seer_select2'>")
}

function seer_select2(roomID, userID) {
//    $("#remind").css('display', 'none');
    //$("#remind").text("");
    //$("#remind").empty();
    //$("#seer_select2").remove();
//    $("#seer_select2").hide();
//    $("#seer_select2").attr("disabled", true);

    $("#remind").empty();
    $("#seer_select2").hide();
    $("#seer_select2").attr("disabled", true);
    $.ajax({
        url:"/werewolf/seer_select2/" + roomID + "/" + userID,
        dataType:"text",
        async:false,
        success: function(response) {
        }
    });

}



function day_conclude_wolf(response) {
    $("#remind").empty();
    $("#seer_select2").remove();
    var roomID = $("#roomID").val();
    $.ajax({
        url: "/werewolf/day_conclude_wolf/" + roomID,
        dataType: "text",
        async: false,
        success: function(response) {
//            if (response != "") {
//                killedID = parseInt(response);
//                console("update status.")
//                $("#status_"+killedID+"_"+roomID).text("Status: Died");
//            }
        }
    });
}


function day_speak(response) {
    console.log("day speak");
    var roomID = $("#roomID").val();
    var userID = $("#currentUserId").val();
    var username = $("#currentUsername").val();
    var role = $("#currentUserRole").val();
    console.log($("#comment-board").val());
    $("#check_card_" + roomID + "_" + userID).hide();
    console.log("check hide")
    $("#check_card_" + roomID + "_" + userID).attr("disabled", true);
    console.log("check disabled")
    $("#check_txt_" + roomID + "_" + userID).hide();
    console.log("check text hide")
    $("#current_role").text(role);
    if($("#comment-board").val().includes(username + " speaking")) {
        //enable text input
        $("#chat-message-input").attr("disabled", false);
        $("#chat-message-input").css({'background-color' : '#ffffff'})
        $("#chat-message-submit").attr("disabled", false);
        $("#chat-message-submit").css({'background-color' : ''})
        //enable speak button and change background
        $("#voice_btn").attr("disabled", false);
        $("#stop_btn").attr("disabled", false);
        $("#voice_btn").css({'background-color' : ''})
        $("#stop_btn").css({'background-color' : ''})

        //get counter
        $.ajax({
            url: "/werewolf/day_speak/" + roomID + "/" +userID,
            dataType: "text",
            async: false,
            success: function(response) {
                console.log(response);
                $("#counter").text(response);
            }
        });
    }
    else {
        //disable text input and change background
        $("#chat-message-input").attr("disabled", true);
        $("#chat-message-input").css({'background-color' : '#b3b3b3'})
        $("#chat-message-submit").attr("disabled", true);
        $("#chat-message-submit").css({'background-color' : '#b3b3b3'})
        //disable speak button and change background
        $("#voice_btn").attr("disabled", true);
        $("#stop_btn").attr("disabled", true);
        $("#voice_btn").css({'background-color' : '#b3b3b3'})
        $("#stop_btn").css({'background-color' : '#b3b3b3'})
    }
}

function voice_chat() {
    var speak_btn = document.getElementById("voice_btn");
    var end_btn = document.getElementById("stop_btn");
    var mediaRecorder;

    //get audio permit
    navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(
            {
                audio: true
            })
            // Success callback
            .then(function (stream) {
                record(stream);
            })
            // Error callback
            .catch(function (err) {
            }
            );
    } else {
        console.log("No audio permision");
    }

    //audio permit success, add listener to speak and stop button
    function record(stream) {
        console.log("audio success");
        mediaRecorder = new MediaRecorder(stream);
        //add listener to speak button
        speak_btn.addEventListener('click', function (ev) {
            console.log("start recording");
            ev.preventDefault();
            this.classList.add('activeBtn');
            mediaRecorder.start();
        }, false);
        //add listener to stop button
        end_btn.addEventListener('click', function (ev) {
            console.log("end recording");
            ev.preventDefault();
            this.classList.remove('activeBtn');
            mediaRecorder.stop();
        }, false);

    //save the recording to model
    mediaRecorder.ondataavailable = function (e) {
        var speaking_userID = $("#currentUserId").val();
        var audioURL = window.URL.createObjectURL(e.data);
        
        $.ajax({
            url: "/werewolf/voice_chat",
            type: "POST",
            data: "userID="+speaking_userID+"&audioURL="+audioURL+"&csrfmiddlewaretoken="+getCSRFToken(),
            dataType: "text",
            success: function(response) {
                console.log(response);
            }
        });
    };
}
}

function display_audio(response) {
    console.log("display audio");
    var roomID = $("#roomID").val();
    for (i = 0; i < response.length; i++) {
        if (response[i].model == "werewolf.recording") {
            var room = response[i].fields.belong_room;
            if(room == roomID) {
                if(document.getElementById("audio_"+response[i].pk) == null) {
                    var speakID = response[i].fields.belong_to;
                    var speakName = getUsername(speakID);
                    document.getElementById('chat-log').innerHTML += '<span class="chat_msg" id="audio_'+response[i].pk+'">'+speakName+': Audio Message...</span>';
                    document.getElementById('chat-log2').innerHTML += '<span class="chat_msg" id="audio_'+response[i].pk+'">'+speakName+': Audio Message...</span>';
                    //play audio message
                    var audio = document.createElement('audio');
                    audio.setAttribute('controls', '');
                    var audioURL = response[i].fields.audioURL;
                    audio = new Audio(audioURL);
                    audio.play();
                }
            }
        }
    }
    
}


function getCSRFToken() {
    var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
        c = cookies[i].trim();
        if (c.startsWith("csrftoken=")) {
            return c.substring("csrftoken=".length, c.length);
        }
    }
    return "unknown";
}


function vote_day(response) {
    var roomID = $("#roomID").val();
    var userID = $("#currentUserId").val();
    var role = $("#currentUserRole").val();
    $("#check_card_" + roomID + "_" + userID).hide();
    console.log("check hide")
    $("#check_card_" + roomID + "_" + userID).attr("disabled", true);
    console.log("check disabled")
    $("#check_txt_" + roomID + "_" + userID).hide();
    console.log("check text hide")
    $("#current_role").text(role);
    var arr_lived = [];
    for (i = 0; i < response.length; i++) {
        if (response[i].model == "werewolf.profile") {
            if (response[i].fields.currentRoom == roomID) {
                if (response[i].fields.status == false) {
                    arr_lived.push(response[i].pk);
                }
            }
        }
    }
    var status_txt;
    for (var i = 0; i < response.length; i++) {
        if (response[i].fields.currentRoom == roomID) {
            if (response[i].fields.user == userID) {
                status_txt = response[i].fields.status_txt;
            }
        }
    }
    if (status_txt == "live") {
        for (var i = 0; i < arr_lived.length; i++) {
            if (document.getElementById('vote_' + arr_lived[i]) == null) {
                $("#card_" + arr_lived[i] + "_" + roomID).append("<div><input width = 100% type='button' class = 'row btn btn-warning vote' value = 'vote' onclick='vote(" + roomID + "," + userID + "," + arr_lived[i] + ")'" + "id='vote_" + arr_lived[i]+ "'></div>")
            }
        }
    }

}


function vote(roomID, userID,voteID) {
    var roomID = $("#roomID").val();
    var userID = $("#currentUserId").val();
    var role = $("#currentUserRole").val();
    $("#check_card_" + roomID + "_" + userID).hide();
    console.log("check hide")
    $("#check_card_" + roomID + "_" + userID).attr("disabled", true);
    console.log("check disabled")
    $("#check_txt_" + roomID + "_" + userID).hide();
    console.log("check text hide")
    $("#current_role").text(role);
    var button_array = document.getElementsByClassName("vote");
    for(var i = 0, len = button_array.length; i < len; i++){
        $(button_array[i]).hide();
        $(button_array[i]).attr("disabled", true);
    }
    $.ajax({
            url: "/werewolf/vote/" + roomID + "/"  + userID + "/" + voteID,
            dataType: "text",
            async: false,
            success: function(response) {
                console.log(response)
//                if (response == "vote finish") {
//                     console.log(response)
//                     var button_array2 = document.getElementsByClassName("vote");
//                     for(var i = 0, len = button_array2.length; i < len; i++){
//                         console.log("remove " + i)
//                         $(button_array2[i]).remove();
//                     }
//                }
            }
        });

}

function start_game(response) {
    var roomID = $("#roomID").val();
    var userID = $("#currentUserId").val();
    $("#check_card_" + roomID + "_" + userID).hide();
    console.log("check hide")
    $("#check_card_" + roomID + "_" + userID).attr("disabled", true);
    console.log("check disabled")
    $("#check_txt_" + roomID + "_" + userID).hide();
    console.log("check text hide")
    $.ajax({
        url: "/werewolf/start_game_again/" + roomID,
        dataType: "text",
        async: false,
        success: function(response) {
            console.log(response)
        }
    });
}


function end_game(response) {
    var roomID = $("#roomID").val();
    var userID = $("#currentUserId").val();
    for (var i = 0; i < response.length; i++) {
        if (response[i].fields.currentRoom == roomID) {
            if (response[i].fields.user == userID) {
                $("#status_" + userID + "_" + roomID).text(response[i].fields.status_txt);
            }
        }
    }
    $.ajax({
    url: "/werewolf/end_game/" + roomID,
    dataType: "text",
    async: false,
    success: function(response) {

    }
    });


}


function getUsername(userID) {
    var un;
    $.ajax({
        url: "/werewolf/get-username/" + userID,
        dataType : "text",
        async: false,
        success: function(response) {
            un = response;
        }
    });
    return un;
}


function getUserNumber(roomID) {
    var num;
    $.ajax({
        url: "/werewolf/get-Usernumber/" + roomID,
        dataType: "text",
        async: false,
        success: function(response) {
            num = response;
        }
    });
    return num;
}


function getRole(userID) {
    var role;
    $.ajax({
        url: "/werewolf/get-role/" + userID,
        dataType: "text",
        async: false,
        success: function(response) {
            role = response;
        }
    });
    return role;
}


function searchRoom() {
    $(".errors").text('');
    id = $("#room-id").val();
    pw = $("#room-pw").val();
    //search by room id and password
    var roomID;
    if(id != '' && pw != '') {
        $.ajax({
            url: "/werewolf/search-by-id/" + id + "/" + pw,
            dataType : "json",
            async: false,
            success: function(response) {
                if(response.length == 0) {
                    $(".errors").text('No room found with room id = ' + id + ' , password = ' + pw);
                }
                else {
                    roomID = response[0].pk;
                    $(".all-rooms").each(function() {
                        room_id = $(this).attr("id").substring(5);
                        if(room_id != id){
                            $(this).remove();
                        }
                    });
                }
            }
        });
        $("#room-id").val('');
        $("#room-pw").val('');
    }
    else {
        diff = $("#room-difficulty").val();
        num = $("#room-players").val();
        $.ajax({
            url: "/werewolf/search-by-mode/" + diff + "/" + num,
            dataType : "text",
            async: false,
            success: function(response) {
                if(response.length == '') {
                    $(".errors").text('No room found with difficulty = ' + diff + ' , number of players = ' + num);
                }
                else {
                    idList = response.split(",");
                    $(".all-rooms").each(function() {
                        room_id = $(this).attr("id").substring(5);
                        if(!idList.includes(room_id)){
                            $(this).remove();
                        }
                    });  
                }
            }
        });
        $("#room-difficulty").val('All');
        $("#room-players").val('All');
    }
}


function refreshLobby() {
    $.ajax({
        url: "/werewolf/refresh-lobby",
        dataType : "json",
        success: updateLobby
    });
}

function updateLobby(updates) {
    $(updates).each(function() {
        if(this.model == "werewolf.room"){
            id = "room_" + this.pk;
            if(document.getElementById(id) == null) {
                $("#rooms-all").prepend(
                    '<div id="room_'+this.pk+'" class="all-rooms col-4"> <div class="card"> <div class="card-container">' +
                    '<img id="'+this.pk+'" src="'+this.fields.pictureURL+'" class="card-img-top card-image" onload="getPlayers('+this.pk+')">' +
                    '<div class="card-body">' + 
                    '<h5 class="card-title">'+this.fields.difficulty+' &nbsp;| &nbsp; <span id="totalplayers_'+this.pk+'">'+this.fields.numOfPlayers+'</span> Players</h5>' +
                    '<p class="card-text"><span id="ready-num_'+this.pk+'"></span> players ready. Waiting for <span id="missing_'+this.pk+'" class="missing-player"><b>'+this.fields.numOfPlayers+'</b></span> more players.</p>' +
                    '</div><div class="overlay"><div class="overlay-text">Room members</div><br>' +
                    '<div id="members_'+this.pk+'" class="members"></div>' +
                    '<form method="POST" action="/werewolf/join-room/'+this.pk+'">' +
                    '<button class="btn btn-outline-warning overlay-button" id="joinButton_'+this.pk+'">Join</button>' +
                    '<input type="hidden" name="csrfmiddlewaretoken" value="'+getCSRFToken()+'">' +
                    '</form><form method="POST" action="/werewolf/start/'+this.pk+'">' +
                    '<button class="btn btn-outline-warning overlay-button" id = "startButton_'+this.pk+'">Start</button>' +
                    '<input type="hidden" name="csrfmiddlewaretoken" value="'+getCSRFToken()+'">' +
                    '</form> <form method="POST" action="/werewolf/exit-room/'+this.pk+'">' +
                    '<button class="btn btn-outline-warning overlay-button" id="exitButton_'+this.pk+'">Exit</button>' +
                    '<input type="hidden" name="csrfmiddlewaretoken" value="'+getCSRFToken()+'">'+
                    '</form></div></div></div></div>'
                );
            }
            else {
                imageElement = document.getElementById(this.pk);
                getPlayers(this.pk);
                imageElement.innerHTML = '<img id="'+this.pk+'" src="'+this.fields.pictureURL+'" class="card-img-top card-image" onload="getPlayers('+this.pk+')">';
            }
            //remove the room if it is empty
            var readyNum = getReadyPlayer(this.pk);
            if(readyNum == 0) {
                console.log("*******");
                $("#"+id).remove();
                // $.ajax({
                //     url: "/werewolf/remove_empty_room",
                //     type: "POST",
                //     data: "roomID="+this.pk+"&csrfmiddlewaretoken="+getCSRFToken(),
                //     dataType: "text",
                //     success: function(response) {
                //         console.log(response);
                //     }
                // });
            }
        }
    })
}

function getReadyPlayer(roomID) {
    var readyNum;
    $.ajax({
        url: "/werewolf/get-players/" + roomID,
        dataType : "json",
        async: false,
        success: function(response) {
            readyNum = response.length;
        }
    });
    return readyNum;
}
