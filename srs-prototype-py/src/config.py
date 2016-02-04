from wheezy.html.ext.template import WidgetExtension
from wheezy.html.utils import html_escape
from wheezy.template.engine import Engine
from wheezy.template.ext.core import CoreExtension
from wheezy.template.loader import FileLoader
from wheezy.web.templates import Jinja2Template

options = {}

# Template Engine
from jinja2 import Environment
from jinja2 import FileSystemLoader
from wheezy.html.ext.jinja2 import InlineExtension
from wheezy.html.ext.jinja2 import WidgetExtension
from wheezy.html.ext.jinja2 import WhitespaceExtension
from wheezy.html.utils import format_value
from wheezy.web.templates import Jinja2Template
searchpath = ['templates']
env = Environment(
    loader=FileSystemLoader(searchpath),
    auto_reload=True,
    extensions=[
        InlineExtension(searchpath, True),
        WidgetExtension,
        WhitespaceExtension
    ])
env.globals.update({
    'format_value': format_value,
})
options.update({
    'render_template': Jinja2Template(env)
})
