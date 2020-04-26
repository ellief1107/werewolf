from django.db import models
from django.contrib.auth.models import User


class Room(models.Model):
    created_by = models.ForeignKey(User, default=None, on_delete=models.PROTECT)
    players = models.ManyToManyField(User, default=None, related_name="players")
    created_time = models.DateTimeField()
    difficulty = models.CharField(max_length=10)
    numOfPlayers = models.IntegerField()
    password = models.CharField(max_length=10)
    pictureURL = models.URLField(max_length=200)
    begin_time = models.DateTimeField(null=True)
    end_time = models.DateTimeField(null=True)
    status = models.BooleanField(default=False, null=True)
    comment_board = models.CharField(default="Please Check Your role." + "\n" + "And Don't tell others." + "\n"
                                             + "If you are ready, Click the Ready button." + "\n", max_length=2000)
    wolf_kill_1 = models.ManyToManyField(User, default=None, related_name="wolf_kill_1")
    wolf_kill_number = models.IntegerField(default=0)
    game_log = models.CharField(max_length=100, default="start")
    seer_select_player = models.ForeignKey(User, default=None, on_delete=models.PROTECT, null=True, related_name
    ="seer_select_player")
    seer_select = models.BooleanField(default=False, null=True)
    doctor_heal = models.ForeignKey(User, default=None, on_delete=models.PROTECT, null=True, related_name="doctor_heal")
    doctor_heal_or_not = models.BooleanField(default=False, null=True)
    voted_user_number = models.IntegerField(default=0)
    voted_users = models.ManyToManyField(User, default=None, related_name="voted_users")

    class Meta:
        ordering = ['-created_time']
    def __str__(self):
        return 'id=' + str(self.id) + ', difficulty=' + str(self.difficulty) + ', number of players=' + str(
            self.numOfPlayers) + " wolf first kills " + str(self.wolf_kill_1)


class Profile(models.Model):
    bio = models.CharField(max_length=500, default=None, null=True)
    image = models.FileField(blank=True, null=True)
    content_type = models.CharField(max_length=50, default=None, null=True)
    level = models.CharField(max_length=10, default=None, null=True)
    updated_time = models.DateTimeField(default=None, null=True)
    user = models.ForeignKey(User, default=None, on_delete=models.PROTECT)
    currentRoom = models.ForeignKey(Room, default=None, on_delete=models.PROTECT, null=True)
    role = models.CharField(max_length=50, default=None, null=True)
    status = models.BooleanField(default=False, null=True)
    status_txt = models.CharField(default="live", max_length=100)
    check_role = models.BooleanField(default=False, null=True)
    ready = models.BooleanField(default=False, null=True)
    counter = models.IntegerField(default=30, null=True)
    voted_time = models.IntegerField(default=0)
    point = models.IntegerField(default=0)
    def __str__(self):
        return 'id=' + str(self.id) + ', room=' + str(self.currentRoom) + ', role=' + str(
            self.role) + ', check_role= ' + str(self.check_role)


class Recording(models.Model):
    belong_to = models.ForeignKey(Profile, default=None, on_delete=models.PROTECT, null=True)
    audioURL = models.CharField(max_length=500, default=None, null=True)
    belong_room = models.ForeignKey(Room, default=None, on_delete=models.PROTECT, null=True)
