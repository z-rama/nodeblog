const express = require('express');
const app = express();
const pg = require('pg');
const fs = require('fs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bcrypt = require('bcrypt')


var Sequelize = require('sequelize');
var sequelize = new Sequelize('postgres://' + process.env.POSTGRES_USER + ':' + process.env.POSTGRES_PASSWORD + '@localhost/nodeblog'); 

app.use(express.static('style'));
app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: true})); 
app.use(bodyParser.json()); 


app.set('views', './views'); 
app.set('view engine', 'pug');



app.use(session({
	secret: 'tell me your secret',
	resave: true,
	saveUninitialized: false
}));

var User = sequelize.define('user', {
	username: Sequelize.STRING,
	password: Sequelize.STRING,
	email: Sequelize.STRING
})

//man send man message y'feel
var Message = sequelize.define('message', {
	title: Sequelize.STRING,
	content: Sequelize.STRING(500),
})

//mandem send dem comments
var Comment = sequelize.define('comment', {
	content: Sequelize.STRING
})


User.hasMany(Message);
User.hasMany(Comment);
Message.hasMany(Comment);

Message.belongsTo(User);
Comment.belongsTo(User);
Comment.belongsTo(Message);


app.get ('/', (request, response) => {
	response.render('index', {user: request.session.user});
});

app.get ('/login', (request, response) => {
	response.render('login', {user: request.session.user});
});

app.post('/login', (req, res) => {
	console.log(req.body.username)
	if (req.body.username.length === 0){
		res.redirect('/login/?message=' + encodeURIComponent("Please fill out your username."))
	}
	if (req.body.password.length === 0){
		res.redirect('/login/?message=' + encodeURIComponent("Please fill out your password."))
	}

	User.findOne({
		where: {
			username: req.body.username
		}
	}).then(function(user){
		console.log(user)
		bcrypt.compare(req.body.password, user.password, function(err, result) {
			if(result === true) {
				req.session.user = user;
				res.redirect('/profile/'+user.username)
			} else {
				res.redirect('/login/?message=' + encodeURIComponent("Invalid username or password."))
			}
		})
	})
})

app.get ('/signup', (request, response) => {
	response.render('signup', {user: request.session.user}); 
});



app.post('/signup', function(req, res){
	console.log('signup post request is working')  
	bcrypt.hash(req.body.password, 8, function(err, hash) {

		User.create({ 
			username: req.body.username,
			password: hash,
			email: req.body.email
		})
	
	.then(()=>{
		res.redirect('/login'); 
	})
	})
});


app.get ('/addpost', (req, res) => {
	res.render('addPost', {user:req.session.user});
});


app.get ('/allposts', (request, response) => {
	Message.findAll({order:[['createdAt', 'DESC']], include: [User, Comment]})
	.then(function(result){
		var allMessages = result;
		Comment.findAll({include: [User, Message]})
		.then(function(result){
			response.render('showPosts', {messages: allMessages, comments: result, user: request.session.user});
		})
	})
});

app.post('/allposts', (req, res) => {
	
	Message.create ({
		title: req.body.title,
		content: req.body.content,
		userId: req.session.user.id
	})
	.then(function(){
		res.redirect('/allPosts');
	});
});

app.get('/post/:postId', (req, res) => {
	Message.findOne({
		where: {id: req.params.postId},
		include: [User, Comment]
	})
	.then((result)=>{
		var allMessages = result;
		Comment.findAll({
			include: [User, Message],
		})
		.then((result) => {
			var specificPost = {
				messages: allMessages,
				comments: result,
				user: req.session.user
			}
			console.log(allMessages.user.username)
			res.render('post', specificPost)
		})
	})
})


app.post('/postcomment/:postId', (req, res) =>{
	console.log(req.body.comment);
	console.log(req.session.user.id);
	console.log(req.params.postId) 
	Comment.create({ 
		content: req.body.comment,
		userId: req.session.user.id,
		messageId: parseInt(req.params.postId) 
	})
	.then(()=>{
		res.redirect('/post/' + req.params.postId); 
	})
})

app.get ('/profile/:userName', (request, response) => {
	User.findOne({
		where: {username: request.params.userName},
		include: [Message, Comment]
	})
	.then(function(user){
		console.log(user)
		if (user === null){
			response.redirect('/notexist')
		} 
		var userURL = user
		Message.findAll({
			order:[['id', 'DESC']], 
			include: [User, Comment],
			where: {userId: user.id}
		})
		.then(function(result){
			
			var allMessages = result;
			Comment.findAll({include: [User, Message]})
			.then(function(result){
				response.render('profile', {profileOfUser: userURL, messages: allMessages, comments: result, user: request.session.user});
			})
		})
	})
});

app.get('/notexist', (req, res) =>{
	res.render('notexist')
})




app.get('/logout', function (req, res) {

  req.session.destroy(function (error) {

    if(error) {

        throw error;

    }
      res.render('logout');

  })

})





sequelize
	.sync({force:true})
	.then(function(){
		return User.create({
			username: "Gijs",
			password: "koekie",
			email: "skekkie@gmail.com"
		})
	})
	.then(function(person){
		return person.createMessage({
			title: "Had pizza for breakfast",
			content: "I rule the world.",
		})
	})
	.then(function(){
		return User.create({
			username: "Jenny from the block",
			password: "bronx",
			email: "jlo@gmail.com"
		})
	})
	.then(function(person){
		return person.createComment({
			content: "Gayyyyyy",
			messageId: 1
		})
	})
	.then(function(){
		Message.create({
			title: "Waddup",
			content: "You got a rizla by any chance?",
			userId: 2
		})
	})
	.then(function(){
		Comment.create({
			content: "Imma beatcho ass!!",
			messageId: 2,
			userId: 1
		})
	})	
	
	.then(function(){

		app.listen(3000, () => {

			console.log('new phone who dis?');

		});

	})
