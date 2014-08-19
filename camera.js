var when = require('when')
var poll = require('when/poll')
var request = require('request')

var cheerio = require('cheerio')

var fsPath = require('path')

function Camera(ip, password, _requestImpl) {
	this._request = _requestImpl || request
	this._password = password
	this._apiUrl = 'http://'+ip
	this._webUrl = 'http://'+ip+':8080'
}

Camera.prototype._cameraApi = function(method, intParam) {
	return this._apiCall('camera', method, intParam)
}

Camera.prototype._bacpacApi = function(method, intParam) {
	return this._apiCall('bacpac', method, intParam)
}

Camera.prototype._apiCall = function(api, method, intParam) {
	var dfd = when.defer()
	var parameter = ''

	if (intParam !== undefined)
		parameter = '&p=%0' + intParam

	var url = [this._apiUrl, api, method].join('/') +
		'?t=' + this._password + parameter

	console.log(url)
	this._request(url, function(err, res, body) {
		if (err) return dfd.reject(err)
		return dfd.resolve(res)
	})

	return dfd.promise
}

Camera.prototype.status = function() {
	return this._bacpacApi('se')
	.then(function(res) {
		if (res.statusCode != 200)
			return when.reject('Error '+res.statusCode+': '+body)

		// help! @gopro tell us!
		var status = {
			ready: res.body[15].charCodeAt(0) === 1
		}

		for (var i=0; i < res.body.length; i++) {
			console.log('status byte '+i, res.body[i].charCodeAt(0))
		}

		return status
	})
}

Camera.prototype.whenReady = function() {
	var that = this

	return poll(
		that.status.bind(that),
		500,
		function(status) {
			return status.ready
		}
	)
}

Camera.prototype.powerOn = function() {
	return this._cameraApi('PW', 1)
}

Camera.prototype.powerOff = function() {
	return this._cameraApi('PW', 0)
}

Camera.prototype.startBeeping = function() {
	return this._cameraApi('LL', 1)
}

Camera.prototype.stopBeeping = function() {
	return this._cameraApi('LL', 0)
}

Camera.prototype.startCapture = function() {
	return this._cameraApi('SH', 1)
}

Camera.prototype.stopCapture = function() {
	return this._cameraApi('SH', 0)
}

Camera.prototype.deleteLast = function() {
	return this._cameraApi('DL')
}

Camera.prototype.deleteAll = function() {
	return this._cameraApi('DA')
}

Camera.prototype.erase = function() {
	return this.deleteAll()
}

Camera.prototype.ls = function(path) {
	var dfd = when.defer()
	var url = this._webUrl + (path || '')
	var files = []

	this._request(url, function(e, res, body) {
		if (e || res.statusCode !== 200)
			return dfd.reject(e.stack || e || res.statusCode)

		var $ = cheerio.load(body)

		$('table tbody tr').each(function() {
			var name = $(this).find('a.link').attr('href')
			var date = $(this).find('span.date').text()
			var size = $(this).find('span.size').text()
			files.push({
				name: name,
				isFolder: name[name.length-1] === '/',
				time: new Date(date),
				size: size !== '-' ? size : null
			})
			console.log(name)
			return name;
		})

		dfd.resolve(files)
	})
	return dfd.promise
}

Camera.prototype.get = function(path) {
	var url = this._webUrl + (path || '')
	return when.resolve(this._request(url))
}

//CUSTOM LS

Camera.prototype.ls2 = function(path){
	var client = require('ftp')
	var c = new client();
	c.on('ready',function(){
		c.list(path,function(err,list){
			if(err) throw err;
			console.dir(list);
			console.log(list);
			c.end();
		});
	});
}

//CUSTOM COMMANDS

//Camera Mode
Camera.prototype.switch2Camera = function() {
	return this._cameraApi('CM',0)
}

Camera.prototype.switch2Photo = function() {
	return this._cameraApi('CM',1)
}

Camera.prototype.switch2Burst = function() {
	return this._cameraApi('CM',2)
}

Camera.prototype.switch2Timelapse = function() {
	return this._cameraApi('CM',3)
}


//Video Resolution
Camera.prototype.videoWVGA60  = function() {
	return this._cameraApi('VR',0)
}

Camera.prototype.videoWVGA120  = function() {
	return this._cameraApi('VR',1)
}

Camera.prototype.video720p30  = function() {
	return this._cameraApi('VR',2)
}

Camera.prototype.video720p60  = function() {
	return this._cameraApi('VR',3)
}

Camera.prototype.video960p30  = function() {
	return this._cameraApi('VR',4)
}

Camera.prototype.video960p60  = function() {
	return this._cameraApi('VR',5)
}

Camera.prototype.video1080p30  = function() {
	return this._cameraApi('VR',6)
}


//Photo Resolution
Camera.prototype.photo11w  = function() {
	return this._cameraApi('PR',0)
}

Camera.prototype.photo8m  = function() {
	return this._cameraApi('PR',1)
}

Camera.prototype.photo5w  = function() {
	return this._cameraApi('PR',2)
}

Camera.prototype.photo5m  = function() {
	return this._cameraApi('PR',3)
}



//Timer
Camera.prototype.timer05  = function() {
	return this._cameraApi('TI',0)
}

Camera.prototype.timer1  = function() {
	return this._cameraApi('TI',1)
}

Camera.prototype.timer2  = function() {
	return this._cameraApi('TI',2)
}

Camera.prototype.timer5  = function() {
	return this._cameraApi('TI',3)
}

Camera.prototype.timer10  = function() {
	return this._cameraApi('TI',4)
}

Camera.prototype.timer30  = function() {
	return this._cameraApi('TI',5)
}

Camera.prototype.timer60  = function() {
	return this._cameraApi('TI',6)
}



//Bip volume
Camera.prototype.bip0  = function() {
	return this._cameraApi('BS',0)
}

Camera.prototype.bip75  = function() {
	return this._cameraApi('BS',1)
}

Camera.prototype.bip100  = function() {
	return this._cameraApi('BS',2)
}



//Preview
Camera.prototype.previewON  = function() {
	return this._cameraApi('PV',2)
}

Camera.prototype.previewOFF  = function() {
	return this._cameraApi('PV',0)
}



//Orientation
Camera.prototype.orientationHeadUP  = function() {
	return this._cameraApi('UP',0)
}

Camera.prototype.orientationHeadDOWN  = function() {
	return this._cameraApi('UP',1)
}



//Fov
Camera.prototype.fovWide  = function() {
	return this._cameraApi('FV',0)
}

Camera.prototype.fovMedium  = function() {
	return this._cameraApi('FV',1)
}

Camera.prototype.fovNarrow  = function() {
	return this._cameraApi('FV',2)
}



//Localisation
Camera.prototype.localisationON  = function() {
	return this._cameraApi('LL',1)
}

Camera.prototype.localisationOFF  = function() {
	return this._cameraApi('LL',0)
}

exports.Camera = Camera
