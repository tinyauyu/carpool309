from locust import HttpLocust, TaskSet, task
from random import randint

class UserBehavior(TaskSet):
    def on_start(self):
        """ on_start is called when a Locust start before any task is scheduled """
        self.register_logout_login()

    def register_logout_login(self):
        randomUser = str(randint(0,10000000000))
        userInfo = '{"email": "' + randomUser +'@1.com", "password": {"plain" : "1"}}'
        self.client.post("/api/users", {"json" : userInfo})
        self.client.get("/api/logout")
        self.client.post("/api/login", {"json" : userInfo})

    @task(5)
    def userList(self):
        self.client.get("/users")

    @task(1)
    def specificUser(self):
        self.client.get("/users/0")

    @task(1)
    def getAdmin(self):
        self.client.get("/admin")


    @task(5)
    def getAllUsers(self):
        self.client.get("/api/users")

    @task(1)
    def searchUser(self):
        self.client.get("/api/users/search/?keyword=0")

    @task(5)
    def currentUser(self):
        self.client.get("/api/users/current")

    @task(5)
    def getSpecificUser(self):
        self.client.get("/api/users/0")

    @task(2)
    def giveFeedback(self):
        self.client.post("/api/users/0/feedbacks", {"json": '{"comment":"good test", "rating": 5, "sender":"", "receiver":"", "date":"Mon Dec 12 2016 00:12:00 GMT-0500 (Eastern Standard Time)"}'})

    @task(1)
    def getFeedback(self):
        self.client.get("/api/users/0/feedbacks")

    @task(1)
    def getAllFeedback(self):
        self.client.get("/api/feedbacks")

    @task(1)
    def getFeedbackById(self):
        self.client.get("/api/feedbacks/0")

    @task(2)
    def updateTrip(self):
        self.client.post("/api/updateTrip", {"user":0, "startPoint":{"latitude": 73, "longitude": 53}, "endPoint":{"latitude": 73, "longitude": 43}, "date":"Mon Dec 12 2016 00:12:00 GMT-0500 (Eastern Standard Time)", "price":1000, "provider": "true"})

    @task(1)
    def getTripById(self):
        self.client.get("/searchTrip/3")

class WebsiteUser(HttpLocust):
    task_set = UserBehavior
    min_wait=5000
    max_wait=9000
