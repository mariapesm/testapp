const express = require("express");
const app = express();
const path = require("path");
const async = require("async");
const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;
const databaseURL = "mongodb://marype:networkengineering12@ds149404.mlab.com:49404/pinterest-clone";
const validator = require("validator");

//basic setup
app.use("/", express.static("node_modules/bootstrap/dist/css"));
app.use("/dist", express.static("dist"));
app.get("/", function (req, res) {
    res.sendFile(path.resolve(__dirname + "/src/views/index.html"));
});
app.get("/login", function (req, res) {
    res.sendFile(path.resolve(__dirname + "/src/views/login.html"));
});
app.get("/favicon.ico", (req, res) => {
    res.send("null");
});

//handle login with github begin
const GitHubStrategy = require('passport-github').Strategy;
const passport = require("passport");
const githubId = "bdf1f2a9159aa80750e1";
const githubSecret = "6a87f0de8731a5c4d7b66bff679b334c97b332cb";

app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({extended: true}));
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
app.use(session({
    secret: 'keyboard cat', resave: true, saveUninitialized: true,
    store: new MongoStore({
        url: databaseURL,
        ttl: 14 * 24 * 60 * 60 // = 14 days. Default
    })
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
    done(null, user.githubId);
});

passport.deserializeUser(function (id, done) {
    // User.findById(id, function (err, user) {
    //     done(err, user);
    // });
    async.waterfall([
        function (callback) {
            MongoClient.connect(databaseURL, function (err, db) {
                callback(err, db);
            });
        },
        function (db, callback) {
            db.collection("users").findOne({githubId: id}, function (err, user) {
                if (!err && user) {
                    done(null, user);
                    callback(null, db);
                } else {
                    callback(true, db);
                }

            });
        }
    ], function (err, db) {
        if (err) {
            done(err, null);
        }
        if (db) {
            db.close();
        }

    });
});

passport.use(new GitHubStrategy({
        clientID: githubId,
        clientSecret: githubSecret,
        callbackURL: "https://applicationclonepinterest.herokuapp.com/auth/github/callback"
    },
    function (accessToken, refreshToken, profile, cb) {

        async.waterfall([
            function (callback) {
                MongoClient.connect(databaseURL, function (err, db) {
                    callback(err, db);
                });
            },
            function (db, callback) {
                db.collection("users").findOne({githubId: profile.id}, function (err, user) {
                    callback(err, db, user);
                });
            },
            function (db, user, callback) {
                if (user) {
                    cb(null, user);
                    callback(null, db);

                } else {
                    db.collection("users").insertOne({githubId: profile.id}, function (err, insertOneRes) {
                        console.log(insertOneRes);
                        if (!err) {
                            cb(null, insertOneRes.ops[0]);
                        }
                        callback(err, db);
                    });
                }


            }

        ], function (err, db) {
            if (err) {
                cb(err, null);
            }
            if (db) {
                db.close();
            }


        });

        // User.findOrCreate({ githubId: profile.id }, function (err, user) {
        //     return cb(err, user);
        // });
    }
));

app.get('/auth/github',
    passport.authenticate('github'));

app.get('/auth/github/callback',
    passport.authenticate('github', {failureRedirect: '/login'}),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/');
    });


//handle login with github end

//add a win
app.get("/api/add-win", auth, function (req, res) {
    let url = req.query.url.trim();
    let title = req.query.title.trim();
    if (!title | !validator.isURL(url)) {
        res.json({success: false});
        return;
    }
    async.waterfall([
        function (callback) {
            MongoClient.connect(databaseURL, function (err, db) {
                callback(err, db);
            });
        },
        function (db, callback) {
            db.collection("wins").insertOne({title: title, url: url, user: req.user._id,liked:[]}, function (err, insertOneRes) {
                if (!err) {
                    res.json({success: true});
                }
                callback(err, db);
            });
        }
    ], function (err, db) {
        if (err) {
            res.json({success: false});
        }
        if (db) {
            db.close();
        }

    });
});

//get all wins
app.get("/api/get-all", function (req, res) {
    async.waterfall([
        function (callback) {
            MongoClient.connect(databaseURL, function (err, db) {
                callback(err, db);
            });
        },
        function (db, callback) {
            db.collection("wins").find({}).toArray(function (err, wins) {
                let user = false;
                if (req.isAuthenticated()) {
                    user = req.user._id;
                }
                if (!err) {
                    res.json({success: true, wins: wins, user: user});
                }
                callback(err, db);
            });
        }
    ], function (err, db) {
        if (err) {
            res.json({success: false});
        }
        if (db) {
            db.close();
        }
    });
});
//handle like
app.get("/api/like", auth, function (req, res) {
    let winId = req.query.winId;
    console.log(winId);
    async.waterfall([
        function (callback) {
            MongoClient.connect(databaseURL, function (err, db) {
                callback(err, db);
            });
        },
        function (db, callback) {
            db.collection("wins").findOne({_id: mongodb.ObjectId(winId)}, function (err, win) {
                if (err | !win) {
                    callback(true, db);
                } else {
                    callback(false, db, win);
                }
            });
        },
        function (db, win, callback) {
            let liked = win.liked;
            let index = liked.indexOf(req.user._id.toString());

            if (index === -1) {
                liked.push(req.user._id.toString());
            } else {
                liked.splice(index, 1);
            }

            db.collection("wins").updateOne({_id: mongodb.ObjectId(winId)}, {$set: {liked: liked}}, function (err, updateRes) {
                if (!err) {
                    res.json({success: true});
                }
                callback(err, db);
            });

        }
    ], function (err, db) {
        if (err) {
            res.json({success: false});
        }
        if (db) {
            db.close();
        }
    });
});

//hadle get my
app.get("/api/get-my",auth,function (req,res) {
    async.waterfall([
        function (callback) {
            MongoClient.connect(databaseURL,function (err,db) {
                callback(err,db);
            });
        },
        function (db,callback) {
            db.collection("wins").find({user:req.user._id}).toArray(function (err,wins) {
                if(!err){
                    res.json({success:true,wins:wins});
                }
                callback(err,db);
            });
        }
    ],
        function (err,db) {
        if(err){
            res.json({success:false});
        }
        if(db){
            db.close();
        }

        }
        );
});

//delete by win id
app.get("/api/delete",auth,function (req,res) {
    let winId=mongodb.ObjectId(req.query.winId);
    let user=req.user._id;
    console.log(req.query);
    console.log(winId);
    console.log(user);
    async.waterfall([
        function (callback) {
            MongoClient.connect(databaseURL,function (err,db) {
                callback(err,db);
            });
        },
        function (db,callback) {
            db.collection("wins").deleteOne({_id:winId,user:user},function (err,deleteOneRes) {
                console.log(deleteOneRes.deletedCount);
                if(!err){
                    res.json({success:true});
                }
                callback(err,db);
            });
        }

    ],function (err,db) {
        if(err){
            res.json({success:false});
        }
        if(db){
            db.close();
        }
    });

});


//auth request function
function auth(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.json({success: "unauth"});
    }

}



//listern to port 3000
app.listen(3000);
