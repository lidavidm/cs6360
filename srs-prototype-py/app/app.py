from flask import Flask, render_template, url_for, session
from flask.ext.babel import Babel
from flask_oauthlib.client import OAuth

import secrets

app = Flask(__name__)
app.config['SECRET_KEY'] = secrets.SECRET_KEY
app.config['GOOGLE_ID'] = secrets.GOOGLE_ID
app.config['GOOGLE_SECRET'] = secrets.GOOGLE_SECRET
babel = Babel(app)
oauth = OAuth(app)

google = oauth.remote_app(
    'google',
    consumer_key=app.config.get('GOOGLE_ID'),
    consumer_secret=app.config.get('GOOGLE_SECRET'),
    request_token_params={
        'scope': 'email'
    },
    base_url='https://www.googleapis.com/oauth2/v1/',
    request_token_url=None,
    access_token_method='POST',
    access_token_url='https://accounts.google.com/o/oauth2/token',
    authorize_url='https://accounts.google.com/o/oauth2/auth',
)

@app.route("/")
def index():
    return render_template('index.html')

@app.route("/login")
def login():
    return google.authorize(callback=url_for('login_auth', _external=True))

@app.route('/login_auth')
def login_auth():
    resp = google.authorized_response()
    if resp is None:
        return 'Access denied: reason=%s error=%s' % (
            request.args['error_reason'],
            request.args['error_description']
        )
    session['google_token'] = (resp['access_token'], '')
    me = google.get('userinfo')
    return jsonify({"data": me.data})

@app.route('/app')
def mainapp():
    return render_template('index.html')

if __name__ == "__main__":
    app.debug = True
    app.run()
