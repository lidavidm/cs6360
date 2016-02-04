from wheezy.web.handlers import BaseHandler

class HomeHandler(BaseHandler):
    def get(self):
        login = self.path_for('login')
        return self.render_response('index.html', login=login)

class LoginHandler(BaseHandler):
    def get(self):
        return self.render_response('login.html')
