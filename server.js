var express						=	require('express')
	,	app								=	express()
  , metrics           = require('./metrics')
  , auth              = require('./auth')
  , rp                = require('request-promise')
	,	passport			 		= require('passport')
  , when              = require('when')
  , fs                = require('fs-extra')
  , nodefn            = require('when/node')
  , FacebookStrategy  = require('passport-facebook').Strategy
  , cookieParser      = require('cookie-parser')
  , bodyParser        = require('body-parser')
  , session           = require('express-session');
	
// local vars
var CLIENT_ID = auth.CLIENT_ID
  , CLIENT_SECRET = auth.CLIENT_SECRET;

// promisify node async function
var writeJson = nodefn.lift(fs.writeJson);

passport.serializeUser(function(user, done) {
  done(null, JSON.stringify(user));
});

passport.deserializeUser(function(user, done) {
  try {
    done(null, JSON.parse(user));
  }
  catch (err) {
    done(err);
  }
});

passport.use(new FacebookStrategy({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/callback",
    enableProof: false
  },
  function(shortToken, refreshToken, profile, done) {
    getExtendedToken(shortToken)
      .then(getAccounts)
      .then(saveAccounts)
      .then(function(data) {
         done(null, { hello: 'world' });
      })
      .catch(function(err) {
        console.log("CAUGHT ERR", err);
        done(err);
      });
  }
));

app.use(express.static('public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(session({ 
  secret: 'keyboard cat',
  saveUninitialized: true,
  resave: false 
}));
app.use(passport.initialize());
app.use(passport.session());

function getExtendedToken(shortToken) {
  return rp('https://graph.facebook.com/v2.3/oauth/access_token?'
    + 'grant_type=fb_exchange_token'
    + '&client_id=' + CLIENT_ID
    + '&client_secret=' + CLIENT_SECRET 
    + '&fb_exchange_token=' + shortToken)
    .then(function(data) {
      return JSON.parse(data).access_token;
    });
}

function getAccounts(extendedToken) {
  return rp('https://graph.facebook.com/v2.3/me/accounts?oauth_token=' + extendedToken + '&limit=999');
}

function saveAccounts(data, done) {
  return mapPages(data).then(function(pageJson) {
    return writeJson('./fbPages.js', pageJson);
  });
}

function mapPage(page) {
  return {
    page: page.name,
    id: page.id,
    access_token: page.access_token
  };
}

function mapPages(pageArray) {
  var pages = JSON.parse(pageArray).data;
  return when.map(pages, mapPage);
}


app.get('/', function(req,res) {
  res.send('Hello, you are authenticated');
});

app.get('/error', function(req,res) {
  res.send('Failed');
});

app.get('/auth/facebook',
  passport.authenticate('facebook', {scope: ['read_insights, manage_pages, read_custom_friendlists'] })
);

app.get('/metrics', function(req, res) {
  var insights = metrics();
  res.send(insights);  
});
  

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/error' }),
  function(req, res) {
    // Successful authentication, redirect home.
    console.log('success, route to root');
    res.redirect('/');
  });
	
app.listen(3000);
