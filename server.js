var express = require('express')
var request = require('request')
var path = require('path')
var git = require('gulp-git')
var fs = require('fs')
var app = express()
var exec = require('child_process').exec;
var config = require('./config')

var client_id = config.client_id
var secret = config.secret
var repo_url = config.repo_url
var basefolder = path.join('.','data')
var samples = {}


app.get('/samples',function(req,res){
	res.json(samples)
})

app.post('/o/:org/e/:env/samples/:sample', function(req,res){	
	var token = req.get('Authorization')
	var org = req.params.org
	var env = req.params.env
	var sample = req.params.sample
	token = token.replace("Bearer ", '')

	var cwd = path.join(basefolder, sample , samples[sample].folder)
	var cmd = 'gulp deploy --org ' + org + ' --env ' + env + ' --token ' + token
	exec(cmd,{cwd:cwd},function(err,stdout,stderr){
		 if (err) { res.send(err)}
		 console.log(stdout)
		 res.send('success')	
	}).stdout.pipe(process.stdout)
})

setup()
function setup (){
	var url = repo_url + '/samples'
	getDefaultRequest()
	.get(url, function(err,response,body){
		if(err) {
			console.log(err)
			return ;
		}
		var jsonbody = JSON.parse(body)
		console.log(jsonbody)
		jsonbody.entities.forEach(function(e){		
			var p = path.join(basefolder,e.name)
			console.log(p)
			git.clone(e.git, {args:p},function(err){
				if(!err){
					var readme = path.join(p,'README.md')
					var content = fs.readFileSync(readme).toString()
					e.description = content
					samples[e.name] = e 
					var cmd = 'npm install'
					var execpath = path.join(p,e.folder)
					exec(cmd, {cwd:execpath} , function(execr,stdin,stdout){
						if(execr){console.log(execr)}
						else console.log('npm install success')	
					}).stdout.pipe(process.stdout)
				}else{
					console.log(err)
				}
			})
		})
	})
}

function getDefaultRequest () {
	return request.defaults({
		qs: { client_id: client_id,
			  client_secret: secret
		}
	})
}

app.listen(3000)
