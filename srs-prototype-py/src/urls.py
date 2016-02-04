from wheezy.routing import url
from wheezy.web.handlers import file_handler
from views import HomeHandler, LoginHandler

all_urls = [
    url('', HomeHandler, name='home'),
    url('login', LoginHandler, name='login'),
    url('static/{path:any}',
        file_handler(root='static/'),
        name='static')
]
