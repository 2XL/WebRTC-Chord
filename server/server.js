port = process.env.PORT || 5000; // remote is dynamic / local will be 5000

var static = require('node-static');
var http = require('http');
var file = new (static.Server)();
var app = http.createServer(function(req, res) {
    file.serve(req, res);
}).listen(port);

var io = require('socket.io').listen(app);


var clients = [];
var rooms = [];

// add testing rooms :D
rooms["4PAKINKAT"] = ""; // leader
rooms["webRTC"] = "";
rooms["MissingNo"] = "";


io.sockets.on('connection', function(socket) {

    clients[socket.id] = socket;
    console.log("CONNECTION >> " + socket.id);

    socket.on('list', function() {
	console.log("LIST >> " + socket.id);
	// return list of all available(at room stack) & active(has leader)
	// var rspRoom = []; 
	// [
	//  {
	//	name: "name", 
	//	status: "check if socket.id is active", 
	//	users: "count socket.in(room).length"
	//  }
	// ]
	// socket.emit('responseRoomsAdvance', rspRoom);
	var roomList = [];
	for (key in rooms) {
	    roomList.push(key);
	}

	socket.emit('responseRooms', roomList);
    });

    socket.on('join', function(room) {
	console.log("JOIN >> " + socket.id + " room[" + room + "]");
	// if room has no leader i join into it and i became the leader
	// how to know if it has leader?
	// check if the socket.id of the room is active   
	socket.join(room);
	io.sockets.in(room).emit('message', socket.id + " has joined!");

	console.log("JOIN ROOM >> " + room + "[" + socket.id + "]");

	// check if room has leader by 
	var beLeader = false;
	if ((rooms[room] !== "") && (rooms[room] in clients)) {

	    console.log('LEADER of ROOM[' + room + "]: is [" + rooms[room] + "]");
	    socket.emit('message', 'LEADER of ROOM[' + room + "]: is [" + rooms[room] + "]");
	} else {
	    // i became new leader
	    rooms[room] = socket.id;
	    io.sockets.in(room).emit('message', socket.id + " became room [" + room + "] leader!", socket.id);
	    // next all members of the room will want to connect to me

	}
	socket.emit('responseJoinRoom', socket.id, rooms[room]); // leader socket id 

    });

    socket.on('clients', function(active) {
	console.log("CLIENTS >> " + socket.id);
	// console.log(clients);
	var keys = [];
	if (active) {
	    for (var key in clients) {
		if (clients[key].connected)
		    keys.push(key);
	    }
	} else {
	    for (var key in clients) {
		keys.push(key);
	    }
	}
	socket.emit('responseClients', keys);
    });

    socket.on('leader', function(room) {
	console.log("LEADER >> " + room);
	socket.emit('responseRoomLeader', rooms[room], room);
    });

    socket.on('setup', function(room) { // establish webrtc session 

	console.log("SETUP >> [" + room + "] " + socket.id);
	// check if  socket is room leader if leader then emit wait
	if (rooms[room] === socket.id || rooms[room] === undefined) // 
	{
	    rooms[room] = socket.id;
	    socket.emit('message', 'WAIT: im the leader!');
	}
	else
	{
	    clients[rooms[room]].emit('offerRequest', socket.id);
	}

    });

    socket.on('offerResponse', function(targetSocket, sdpOffer) { // -> TO ALICE
	clients[targetSocket].emit('offerResponse', socket.id, sdpOffer);
    });

    socket.on('answerResponse', function(targetSocket, sdpAnswer) { // -> TO BOB
	clients[targetSocket].emit('answerResponse', socket.id, sdpAnswer);
    });

    socket.on('message', function(msg) {
	console.log("MESSAGE >> " + socket.id);
	console.log(msg);
    });

    socket.on('disconnect', function() {
	console.log("DISCONECT >> " + socket.id);
	delete clients[socket.id];
	// comprbar si soc un lider de alguna sala i emetre un broadcast 
	// avisant de desconexió 
	for (room in rooms) {
	    if (socket.id === rooms[room])
	    {
		io.sockets.in(room).emit('message', "leader: [" + socket.id + "] left room:" + room);
		io.sockets.in(room).emit('changeLeader', room);
		delete rooms[room];
	    }
	}
	socket.disconnect();
    });

});

