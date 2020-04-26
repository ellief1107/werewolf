from django.shortcuts import render, redirect, reverse, get_object_or_404
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from werewolf.forms import *
from werewolf.models import *
from django.utils import timezone
from django.http import HttpResponse, Http404
from django.core import serializers
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.dateparse import parse_datetime
import random
import string
import json
import time


picture_urls = [
    'https://vignette.wikia.nocookie.net/powerlisting/images/0/03/Werewolf_HD.jpg/revision/latest?cb=20140117043025',
    'https://miro.medium.com/max/1024/1*kIfC-oYEzUPoaL-fJOrCQg.png',
    'https://store-images.s-microsoft.com/image/apps.9124.13584607337211761.95e02c87-cb7d-4eb0-953f-77c630bed3a7.9c761a54-43ac-4528-a5f5-ff40bcdea3f6?mode=scale&q=90&h=1080&w=1920',
    'https://i.pinimg.com/564x/44/d7/49/44d749dadacf3971870ca79de46872db.jpg',
    'https://realescapegame.jp/events/upload/wwv_cropcover.jpg',
    'https://steamcdn-a.akamaihd.net/steam/apps/1153880/header.jpg?t=1576026700',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTyw2ZZ1pij6Ap4x3rYAun36h6_wfXv75YA68erKgPGfgl--VZ7',
    'https://upload.wikimedia.org/wikipedia/en/9/96/The_Wolf_Among_Us_cover_art.jpg',
    'https://d2jcw5q7j4vmo4.cloudfront.net/TEKGOL8RL-qdPXIs_FA9NgYdE-jiYIDSuI2-x6V3TSMlfsmtvAO48AUwLDz7IDdTCzA=w300',
    'https://i0.wp.com/www.forbiddenplanetnyc.com/wp-content/uploads/2019/01/My-Post8.jpg?resize=678%2C381&ssl=1',
    'https://ksr-ugc.imgix.net/assets/026/550/011/5af4cf34cdfa71b53b5285f46a58efb7_original.jpg?ixlib=rb-2.1.0&crop=faces&w=1552&h=873&fit=crop&v=1569005362&auto=format&frame=1&q=92&s=4454ceeb56cecc524fbebc025a735055',
    'https://www.vrheads.com/sites/vrheads.com/files/styles/large/public/field/image/2016/12/werewolves-within-hero.jpg?itok=E5oYGuY2',
    'https://images-eu.ssl-images-amazon.com/images/I/61ciWcdEMhL.png',
    'https://apprecs.org/gp/images/app-icons/300/6b/com.sharejoy.werewolf.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTKcKzIpcwZ1unx39grdwt4niFItmYTnyT96CKJhUQ2Jyk3RnI0',
    'https://media.indiedb.com/images/games/1/35/34822/111wolfhowlSTART.jpg',
    'https://2.bp.blogspot.com/_i5W2m9XNB3w/RvVF-oqEdTI/AAAAAAAAAn4/xcWlxm2rl4Y/s320/ist2_2094440_werewolf.jpg',
    'https://media.mtgsalvation.com/attachments/152/728/635968960971119054.jpg'
]


# Create your views here.
@ensure_csrf_cookie
def getHomePage(request):
    return render(request, 'werewolf/home.html')


@ensure_csrf_cookie
def rule(request):
    return render(request, 'werewolf/rule.html')


@ensure_csrf_cookie
def character(request):
    return render(request, 'werewolf/character.html')


@ensure_csrf_cookie
def login_action(request):
    context = {}
    if request.method == "GET":
        context['form'] = LoginForm()
        return render(request, 'werewolf/login.html', context)
    form = LoginForm(request.POST)
    context['form'] = form
    if not form.is_valid():
        return render(request, 'werewolf/login.html', context)
    new_user = authenticate(username=form.cleaned_data['username'], password=form.cleaned_data['password'])
    login(request, new_user)
    return redirect(reverse('lobby'))


@ensure_csrf_cookie
def register_action(request):
    context = {}
    if request.method == "GET":
        context['form'] = RegisterForm()
        return render(request, 'werewolf/register.html', context)
    form = RegisterForm(request.POST)
    context['form'] = form
    if not form.is_valid():
        return render(request, 'werewolf/register.html', context)
    new_user = User.objects.create_user(username=form.cleaned_data['username'],
                                        password=form.cleaned_data['password'],
                                        email=form.cleaned_data['email'],
                                        first_name=form.cleaned_data['first_name'],
                                        last_name=form.cleaned_data['last_name']
                                        )
    new_user.save()
    new_user = authenticate(username=form.cleaned_data['username'],
                            password=form.cleaned_data['password'])
    login(request, new_user)
    # add a default profile for the newly registered user
    new_profile = Profile(user=request.user)
    new_profile.save()
    return redirect(reverse('lobby'))


@login_required
@ensure_csrf_cookie
def logout_action(request):
    logout(request)
    return redirect(reverse('login'))


@login_required
@ensure_csrf_cookie
def getGameLobby(request):
    context = {}
    errors = []
    if 'errors' in request.session:
        errors = request.session['errors']
        del request.session['errors']
    user = request.user
    context['user'] = user
    context['errors'] = errors
    context['rooms'] = Room.objects.all()
    context['myRoom'] = Profile.objects.filter(user=request.user)[0].currentRoom
    return render(request, 'werewolf/lobby.html', context)


@login_required
@ensure_csrf_cookie
def createRoom(request):
    context = {}
    errors = []
    if 'difficulty' not in request.POST or not request.POST['difficulty']:
        errors.append('Difficulty cannot be null')
    if 'playerNum' not in request.POST or not request.POST['playerNum']:
        errors.append('Number of Players cannot be null')
    if Profile.objects.filter(user=request.user)[0].currentRoom is not None:
        errors.append('You are already in a room!')
    else:
        new_room = Room(
            created_by=request.user,
            created_time=timezone.now(),
            difficulty=request.POST['difficulty'],
            numOfPlayers=request.POST['playerNum']
        )
        # randomly choose a 4-digit password
        lettersAndDigits = string.ascii_letters + string.digits
        new_room.password = ''.join(random.choice(lettersAndDigits) for i in range(4))
        # randomly choose a picture url from the list
        new_room.pictureURL = random.choice(picture_urls)
        new_room.save()
        new_room.players.add(User.objects.get(id=request.user.id))
        new_room.save()
        profile = Profile.objects.filter(user=request.user)[0]
        profile.currentRoom = new_room
        profile.save()
        roleList = ['seer', 'doctor', 'villager', 'villager', 'wolf', 'wolf']
        profile.role = random.choice(roleList)
        profile.save()
    request.session['errors'] = errors
    return redirect(reverse('lobby'))


@login_required
@ensure_csrf_cookie
def getPlayers(request, roomID):
    room = Room.objects.filter(id=roomID)[0]
    players = Profile.objects.filter(currentRoom=room)
    response_text = serializers.serialize('json', players)
    return HttpResponse(response_text, content_type="application/json")


@login_required
@ensure_csrf_cookie
def getUsername(request, userID):
    username = User.objects.filter(id=userID)[0].username
    return HttpResponse(username, content_type="test/plain")


@login_required
@ensure_csrf_cookie
def getUsernumber(request, roomID):
    room = Room.objects.get(id=roomID)
    numOfPlayers = room.numOfPlayers
    return HttpResponse(numOfPlayers, content_type="test/plain")


@login_required
@ensure_csrf_cookie
def getRole(request, userID):
    player = Profile.objects.get(id=userID)
    role = player.role
    return HttpResponse(role, content_type="text/plain")


@login_required
@ensure_csrf_cookie
def searchByRoomID(request, id, pw):
    response_text = json.dumps('')
    if Room.objects.filter(id=id).count() != 0:
        rooms = Room.objects.filter(id=id)
        if rooms[0].password == pw:
            response_text = serializers.serialize('json', rooms)
    return HttpResponse(response_text, content_type="application/json")


@login_required
@ensure_csrf_cookie
def searchByMode(request, diff, num):
    response_text = []
    if diff == 'All' and num == 'All':
        rooms = Room.objects.all()
        for r in rooms:
            response_text.append(str(r.id) + ",")
    elif diff == 'All':
        rooms = Room.objects.filter(numOfPlayers=int(num))
        for r in rooms:
            response_text.append(str(r.id) + ",")
    elif num == 'All':
        rooms = Room.objects.filter(difficulty=diff)
        for r in rooms:
            response_text.append(str(r.id) + ",")
    else:
        rooms = Room.objects.filter(difficulty=diff).filter(numOfPlayers=int(num))
        for r in rooms:
            response_text.append(str(r.id) + ",")
    return HttpResponse(response_text, content_type="test/plain")


@login_required
@ensure_csrf_cookie
def joinRoom(request, roomID):
    profile = Profile.objects.filter(user=request.user)[0]
    profile.currentRoom = Room.objects.filter(id=roomID)[0]
    profile.save()
    room = Room.objects.get(id=roomID)
    room.players.add(User.objects.get(id=request.user.id))
    room.save()

    assigned_role = []
    for profile in Profile.objects.filter(currentRoom=Room.objects.get(id=roomID)):
        if profile.role is not None:
            assigned_role.append(profile.role)
    if profile.role is None:
        if Room.objects.get(id=roomID).difficulty == 'Easy':
            if Room.objects.get(id=roomID).numOfPlayers == 6:
                roleList = ['seer', 'doctor', 'villager', 'villager', 'wolf', 'wolf']
                remained_role_list = roleList
                if assigned_role:
                    for i in assigned_role:
                        remained_role_list.remove(i)
                    random_role = random.choice(remained_role_list)
                    profile.role = random_role
                    profile.save()
                else:
                    random_role = random.choice(remained_role_list)
                    profile.role = random_role
                    profile.save()
    return redirect(reverse('lobby'))


@login_required
@ensure_csrf_cookie
def exitRoom(request, roomID):
    profile = Profile.objects.filter(user=request.user)[0]
    profile.currentRoom = None
    profile.role = None
    profile.check_role = False
    profile.ready = False
    profile.save()
    room = Room.objects.get(id=roomID)
    room.players.remove(User.objects.get(id=request.user.id))
    return redirect(reverse('lobby'))


@login_required
@ensure_csrf_cookie
def assign_role(request):
    # the role is assigned after the room is filled and begin game.
    # it will assign tole to the gamer randomly.
    return


@login_required
@ensure_csrf_cookie
def select_card(request):
    # when the game start, gamer first enter into the selectcard.html
    # this function is to open the selectcard.html
    if request.method == 'GET':
        return render(request, 'werewolf/selectcard.html')


@login_required
@ensure_csrf_cookie
def check_card(request, roomID):
    # after clicking the "check button", gamer will enter the startgame.html webpage
    # Since the roles have been already assign in the previous step (assign_role),
    # if we know the request.User, we will know their role, and render the corresponding content in the startgame.html
    print(request.user.id)
    role = Profile.objects.filter(id=request.user.id)[0].role
    user = Profile.objects.filter(id=request.user.id)[0]
    roleList = ['seer', 'doctor', 'villager', 'villager', 'wolf', 'wolf']
    assigned_role = []
    for player in Profile.objects.filter(currentRoom=roomID):
        if player.role is not None:
            assigned_role.append(player.role)
    for i in assigned_role:
        roleList.remove(i)
    if role is None:
        role = random.choice(roleList)
    user.role = role
    user.save()
    user.check_role = True
    user.save()
    players = Profile.objects.filter(currentRoom=roomID, check_role=True)
    room = Room.objects.get(id=roomID)
    text = ""
    for player in players:
        text = text + player.user.username + " has checked the role." + "\n"
    room.comment_board = text
    room.save()
    if len(players) == room.numOfPlayers:
        room.game_log = "all the players have checked the role."
        room.comment_board = "All the players have checked the role."
        room.save()
    else:
        room.game_log = "players are checking roles"
    return HttpResponse(role, content_type="test/plain")


@login_required
@ensure_csrf_cookie
def start_game(request, roomID):
    # after clicking the "Next" button in the startgame.html, the gamer will enter into the maingame.html
    if request.method == 'POST':
        room = Room.objects.get(id=roomID)
        comment_board = room.comment_board
        game_log = room.game_log
        users = Profile.objects.filter(currentRoom=roomID)
        context = {'users': Profile.objects.filter(currentRoom=roomID),
                   'currentUser': Profile.objects.filter(id=request.user.id)[0], 'currentRoomID': roomID,
                   'comment_board': comment_board, "game_log": game_log}
        return render(request, 'werewolf/maingame.html', context)


@login_required
@ensure_csrf_cookie
def wolf_kill_1(request, roomID, userID, killedID):
    # return HttpResponse("killed failed", content_type="text/plain")
    if Profile.objects.get(id=userID).role == "wolf":
        if Profile.objects.get(id=userID).currentRoom.id == roomID:
            room = Room.objects.get(id=roomID)
            room.wolf_kill_1.add(User.objects.get(id=killedID))
            room.wolf_kill_number = room.wolf_kill_number + 1
            room.save()
            wolf_player = Profile.objects.filter(currentRoom=roomID).filter(role="wolf").filter(status=False)
            if len(wolf_player) == 1:
                if room.wolf_kill_number == 1:
                    room.comment_board = "The wolves have picked a victim" + "\n" + "Doctor, please open your eyes." + "\n" + \
                                         "Doctor, someone has died, would you like to heal him?"
                    room.save()
                    killedUser = Profile.objects.get(id=killedID)
                    killedUser.status = True
                    # killedUser.status_txt = "killed by wolf"
                    killedUser.save()
                    message = "The wolves have picked a victim."
                    room.game_log = "wolves finished killing."
                    room.save()
                    return HttpResponse(message, content_type="text/plain")
                if room.wolf_kill_number > 1:
                    message = "This night the wolves failed to kill a person."
                    room.comment_board = message + "Doctor, please open your eyes." + "\n" + \
                                         "Doctor, who would you like to heal?"
                    for user in room.wolf_kill_1.all():
                        room.wolf_kill_1.remove(user)
                    room.wolf_kill_number = 0
                    room.game_log = "wolves finished killing."
                    room.save()
                    return HttpResponse(message, content_type="text/plain")

            if len(wolf_player) == 2:
                if room.wolf_kill_number == 2:
                    if len(room.wolf_kill_1.all()) == 1:
                        room.comment_board = "The wolves have picked a victim" + "\n" + "Doctor, please open your eyes." + "\n" + \
                                             "Doctor, someone has died, would you like to heal him?"
                        room.save()
                        killedUser = Profile.objects.get(id=killedID)
                        killedUser.status = True
                        # killedUser.status_txt = "killed by wolf"
                        killedUser.save()
                        message = "The wolves have picked a victim."
                        room.game_log = "wolves finished killing."
                        room.save()
                        return HttpResponse(message, content_type="text/plain")
                    if len(room.wolf_kill_1.all()) > 1:
                        message = "Please choose the same victim."
                        room.comment_board = "Please choose the same victim."
                        room.game_log = "wolf choose again."
                        room.save()
                        for i in room.wolf_kill_1.all():
                            room.wolf_kill_1.remove(i)
                            room.save()
                        room.wolf_kill_number = 0
                        room.save()
                        return HttpResponse(message, content_type="text/plain")
                if room.wolf_kill_number == 1:
                    message = "One wolf has chosen a victim."
                    room.comment_board = message
                    print(room.comment_board)
                    room.save()
                    return HttpResponse(message, content_type="text/plain")
                if room.wolf_kill_number == 0:
                    message = "The wolves are picking a victim"
                    room.comment_board = message
                    room.save()
                    return HttpResponse(message, content_type="text/plain")
                else:
                    message = "This night the wolves failed to kill a person."
                    room.comment_board = message + "Doctor, please open your eyes." + "\n" + \
                                         "Doctor, who would you like to heal?"
                    for user in room.wolf_kill_1.all():
                        room.wolf_kill_1.remove(user)
                    room.wolf_kill_number = 0
                    room.game_log = "wolves finished killing."
                    room.save()
                    return HttpResponse(message, content_type="text/plain")


def kill_again(request, roomID):
    room = Room.objects.get(id=roomID)
    room.game_log = "wolf starts kill."
    room.save()
    return HttpResponse("", content_type="text")


@login_required
@ensure_csrf_cookie
def doctor_heal(request, roomID, userID, healedID):
    room = Room.objects.get(id=roomID)
    healed_player = Profile.objects.get(id=healedID)
    message = ""
    print(healed_player.status)
    if healed_player.status is True:
        healed_player.status = False
        healed_player.save()
        room.doctor_heal_or_not = True
        room.save()
        room.doctor_heal = User.objects.get(id=healedID)
        room.save()
        room.game_log = "seer starts to work."
        room.comment_board = "Doctor, close your eyes." + "\n" + "Seer, open your eyes and pick someone to verify his identity."
        room.save()
        return HttpResponse(message, content_type="text/plain")
    if healed_player.status is False:
        room.comment_board = "Doctor didn't heal the player successfully."
        room.game_log = "seer starts to work."
        room.save()
        return HttpResponse(message, content_type="text/plain")


@login_required
@ensure_csrf_cookie
def doctor_heal2(request, roomID, userID):
    room = Room.objects.get(id=roomID)
    room.game_log = "seer starts to work."
    room.comment_board = "Doctor, close your eyes." + "\n" + "Seer, open your eyes and pick someone to verify his identity."
    room.save()
    return HttpResponse("", content_type="text/plain")


@login_required
@ensure_csrf_cookie
def doctor_not_heal(request, roomID, userID, healedID):
    room = Room.objects.get(id=roomID)
    message = "doctor not heal."
    room.game_log = "seer starts to work."
    room.comment_board = "Doctor, close your eyes." + "\n" + "Seer, open your eyes and pick someone to verify his identity."
    room.save()
    return HttpResponse(message, content_type="text/plain")


@login_required
@ensure_csrf_cookie
def ready(request, roomID):
    requestPlayer = Profile.objects.get(id=request.user.id)
    requestPlayer.ready = True
    requestPlayer.save()
    room = Room.objects.get(id=roomID)
    players = Profile.objects.filter(currentRoom=roomID, ready=True)
    text = ""
    for player in players:
        text = text + player.user.username + " is ready." + "\n"
    room.comment_board = text
    room.save()
    response_text = serializers.serialize('json', players)
    if len(players) == room.numOfPlayers:
        room.game_log = "wolf starts kill."
        room.comment_board = "All the players are ready." + '\n' + "All the players close your eyes." \
                             + "\n" + "Werewolves, open your eyes and pick someone to kill." + "\n"
        room.save()
    else:
        room.game_log = "players are ready."
    return HttpResponse(response_text, content_type="application/json")


@login_required
@ensure_csrf_cookie
def refresh_page(request):
    all_objects = [*Room.objects.all(), *Profile.objects.all(), *Recording.objects.all()]
    response = serializers.serialize('json', all_objects)
    return HttpResponse(response, content_type='application/json')


@login_required
@ensure_csrf_cookie
def seer_select(request, roomID, userID, selectedID):
    room = Room.objects.get(id=roomID)
    profile = Profile.objects.get(id=selectedID)
    room.seer_select_player = profile.user
    room.seer_select = True
    room.save()
    response = ""
    if profile.role != "wolf":
        response = "Not Wolf"
    if profile.role == "wolf":
        response = "Wolf"
    room.game_log = "seer has checked one role's id."
    room.comment_board = "Seer has checked one player's identity." + "\n" + "Everybody open your eyes, it's daytime."
    room.save()
    return HttpResponse(response, content_type="text/plain")


@login_required
@ensure_csrf_cookie
def seer_select2(request, roomID, userID):
    room = Room.objects.get(id=roomID)
    room.game_log = "seer has checked one role's id."
    room.comment_board = "Seer has checked one player's identity." + "\n" + "Everybody open your eyes, it's daytime."
    room.save()
    return HttpResponse("", content_type="text/plain")


def day_conclude_wolf(request, roomID):
    room = Room.objects.get(id=roomID)
    alive_profiles = Profile.objects.filter(currentRoom=roomID).filter(status=False)
    alive_users = []
    for prof in alive_profiles:
        alive_users.append(prof.user)
    print(alive_users)
    print(alive_users[0].username)
    msg = "All alive players, please express your opinion repectively. " + "\n" + alive_users[0].username + " speaking."
    if room.wolf_kill_1 is None:
        room.comment_board = "Last night, wolves didn't kill any one." + "\n" + msg
        room.game_log = "Day conclude wolf killing part finished."
        room.save()
        return HttpResponse("", content_type="text/plain")
    if len(room.wolf_kill_1.all()) == 1:
        killed_player = room.wolf_kill_1.all()[0]
        name = killed_player.username
        killed_user_profile = Profile.objects.get(id=killed_player.id)
        print(killed_user_profile.status)
        if killed_user_profile.status is True:
            killed_user_profile.status_txt = "killed by wolves"
            killed_user_profile.save()
            killed_player.save()
            room.comment_board = "Last night, " + name + " was killed" + "\n" + msg
            room.game_log = "Day conclude wolf killing part finished."
            room.save()
            for user in room.wolf_kill_1.all():
                room.wolf_kill_1.remove(user)
            room.wolf_kill_number = 0
            room.save()
            # id = killed_player.id
            # print(id)
            return HttpResponse("", content_type="text/plain")
        if killed_user_profile.status is False:
            room.comment_board = "Last night, no one died." + "\n" + msg
            room.game_log = "Day conclude wolf killing part finished."
            room.save()
            for user in room.wolf_kill_1.all():
                room.wolf_kill_1.remove(user)
            room.wolf_kill_number = 0
            room.save()
            message = ""
            return HttpResponse(message, content_type="text/plain")
        return HttpResponse("", content_type="text/plain")
    if len(room.wolf_kill_1.all()) > 1:
        room.comment_board = "Last night, wolves made some mistakes, and didn't kill anyone successfully."
        room.game_log = "Day concludes wolf killing part finished."
        room.save()
        for user in room.wolf_kill_1.all():
            room.wolf_kill_1.remove(user)
        room.wolf_kill_number = 0
        room.save()
        return HttpResponse("", content_type="text/plain")
    return HttpResponse("", content_type="text/plain")


@login_required
@ensure_csrf_cookie
def day_speak(request, roomID, userID):
    room = Room.objects.get(id=roomID)
    user_ = User.objects.get(id=userID)
    profile = Profile.objects.get(user=user_)
    alive_profiles = Profile.objects.filter(currentRoom=roomID).filter(status=False)
    alive_users = []
    index = -1
    for prof in alive_profiles:
        alive_users.append(prof.user)
    print(alive_users)
    for i in range(len(alive_users)):
        if alive_users[i].id == int(userID):
            index = i
    if index + 1 < len(alive_users):
        next_user = alive_users[index + 1]
    else:
        next_user = None
    if profile.counter > 0:
        time.sleep(1)
        profile.counter -= 1
        profile.save()
        return HttpResponse(str(profile.counter), content_type="text/plain")
    else:
        if next_user is not None:
            room.comment_board = next_user.username + " speaking."
            room.save()
        else:
            room.comment_board = "Finish speaking." + "\n" + \
                                 "Please vote a player most likely to be a wolf." + "\n" + \
                                 "The player with the highest number of votes is eliminated."
            room.game_log = "Finish speaking."
            room.save()
            players = Profile.objects.filter(currentRoom=roomID)
            for player in players:
                player.counter = 30
                player.save()
        return HttpResponse("", content_type="text/plain")


@login_required
@ensure_csrf_cookie
def start_game_again(request, roomID):
    room = Room.objects.get(id=roomID)
    room.comment_board = "All the players are ready." + '\n' + "All the players close your eyes." \
                         + "\n" + "Werewolves, open your eyes and pick someone to kill." + "\n"
    room.game_log = "wolf starts kill."
    room.save()
    return HttpResponse(" ", content_type="text/plain")


@login_required
@ensure_csrf_cookie
def vote(request, roomID, userID, voteID):
    room = Room.objects.get(id=roomID)
    user = User.objects.get(id=userID)
    room.voted_users.add(user)
    room.voted_user_number = room.voted_user_number + 1
    room.save()
    votedUser = Profile.objects.get(id=voteID)
    votedUser.voted_time = votedUser.voted_time + 1
    votedUser.save()
    comment_board = ""
    for user in room.voted_users.all():
        comment_board = comment_board + user.username + " has voted." + "\n"
    room.comment_board = comment_board
    room.save()
    print(room.voted_user_number)
    if room.voted_user_number == len(Profile.objects.filter(currentRoom=roomID).filter(status=False)):
        print("true")
        room.game_log = "vote finish."
        room.save()
        players = Profile.objects.filter(currentRoom=roomID)
        votes = []
        for player in players:
            votes.append(player.voted_time)
        max_index = votes.index(max(votes))
        died_player = players[max_index]
        died_player.status = True
        died_player.status_txt = "vote out"
        died_player.save()
        room.comment_board = "All alive players have voted" + "\n" + died_player.user.username + " was voted out."
        room.save()
        for player in room.voted_users.all():
            room.voted_users.remove(player)
        room.save()
        room.voted_user_number = 0
        room.save()
        for player in players:
            player.voted_time = 0
            player.save()
        return HttpResponse("vote finish", content_type="text/plain")
    return HttpResponse("", content_type="text/plain")


# to judge whether the game end or not
@login_required
@ensure_csrf_cookie
def end_game(request, roomID):
    room = Room.objects.get(id=roomID)
    wolf_left = []
    other_role_left = []
    players = Profile.objects.filter(currentRoom=roomID)
    for player in players:
        if player.role == 'wolf':
            if player.status is False:
                wolf_left.append(player)
        if player.role != 'wolf':
            if player.status is False:
                other_role_left.append(player)
    print(wolf_left)
    print(other_role_left)
    if len(wolf_left) == 0:
        room.status = True
        room.save()
        room.game_log = "game end"
        room.save()
        text = "Game end. Villagers win!" + "\n"
        for player in players:
            text = text + player.user.username + " is " + player.role + "." + "\n"
        room.comment_board = text
        room.save()
        player = Profile.objects.get(id=request.user.id)
        isWolf = False
        if player.role == "wolf":
            isWolf = True
        if isWolf is False:
            player.point += 5
        player.save()
        return HttpResponse("", content_type="text/plain")
    if len(other_role_left) <= 1:
        room.status = True
        room.save()
        room.game_log = "game end"
        room.save()
        text = "Game end. Wolves win!" + "\n"
        for player in players:
            text = text + player.user.username + " is " + player.role + "." + "\n"
        room.comment_board = text
        room.save()
        player = Profile.objects.get(id=request.user.id)
        isWolf = False
        if player.role == "wolf":
            isWolf = True
        if isWolf is True:
            player.point += 5
        player.save()
        return HttpResponse("", content_type="text/plain")
    else:
        room.game_log = "not end"
        room.comment_board = "Game continues."
        room.save()
        return HttpResponse("", content_type="text/plain")


@login_required
@ensure_csrf_cookie
def voiceChat(request):
    if request.method != 'POST':
        raise Http404
    if not 'userID' in request.POST or not request.POST['userID']:
        raise Http404
    speaking_user = User.objects.get(id=int(request.POST['userID']))
    speaking_profile = Profile.objects.get(user=speaking_user)
    room = speaking_profile.currentRoom
    new_recording = Recording(belong_to=speaking_profile, audioURL=request.POST['audioURL'], belong_room=room)
    new_recording.save()
    return HttpResponse("******success*******", content_type="text/plain")


@login_required
def getProfile(request):
    context = {}
    errors = []
    profile = Profile.objects.get(user=request.user)
    if request.method == "GET":
        context['form'] = ProfileForm(instance=profile)
    elif request.method == "POST":
        form = ProfileForm(request.POST, request.FILES, instance=profile)
        if 'bio' not in request.POST or not request.POST['bio']:
            errors.append('Bio cannot be null')
        if not form.is_valid():
            errors.append('Invalid image size/type')
            context['form'] = form
        else:
            form.save()
            profile.save()
            context['form'] = form
    context['errors'] = errors
    context['profile'] = Profile.objects.get(user=request.user)
    game_history = []
    for room in Room.objects.all():
        for player in room.players.all():
            if player == User.objects.get(id=request.user.id):
                game_history.append(room)
    context['game_history'] = game_history
    return render(request, 'werewolf/profile.html', context)


@login_required
def get_image(request, id):
    profile = get_object_or_404(Profile, id=id)
    if not profile.image:
        raise Http404
    return HttpResponse(profile.image)


@login_required
@ensure_csrf_cookie
def refreshLobby(request):
    rooms = Room.objects.all()
    response_text = serializers.serialize('json', rooms)
    return HttpResponse(response_text, content_type="application/json")


@login_required
@ensure_csrf_cookie
def removeEmptyRoom(request):
    if request.method != 'POST':
        raise Http404
    if not 'roomID' in request.POST or not request.POST['roomID']:
        raise Http404
    room = Room.objects.get(id=int(request.POST['roomID']))
    room.delete()
    return HttpResponse("******success*******", content_type="text/plain")
