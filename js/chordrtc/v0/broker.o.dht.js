// dependencie on
// server_url
// dht server sample: http://immense-dawn-3659.herokuapp.com/

/**
 * Functions:
 *      connect()
 *      put(key, value)
 *      get(key)
 * @type @new;_L8
 */
var visionHash;
var visiondc;
var visionpc;
var nextHopNode;
var finger = {};


var chord = new (function() {
    console.log('broker.o.dht.js is loaded! ' + arguments[0]);

    var idBits = 1; // 3*4 -> 2^12 -> 4092 // CHROD ID BITWISE
    var client;
    var node;

    // ///// //
    // UTILS ///////////////////////////////////////////////////////////////////
    // ///// // 

    this.connect = function(url, room) { // this should reset the peer

        if (arguments.length !== 2) {
            console.error(arguments[0] + ":" + arguments[1]);
        } else {
            console.log(arguments[0] + ":" + arguments[1]);
        }
        url = url === null ? "http://immense-dawn-3659.herokuapp.com/" : url;

        if (document.location.hostname === "localhost") {
            url = "http://localhost:5000";
        }
        console.log(url);
        var socket = io.connect(url);

        // function that is called onload
        client = new xClient(socket); // establish connection with bootstraper 
        client.connect(room);

        console.log("waitId... ");

        /**
         * estabilize chord fingers with gossiping
         * @type type
         */

        /**
         * wait until bootstrap id is assigned and a booter is found
         * @type type
         */
        var waitSetupBootNode = setInterval(function() {
            if (client.id() === undefined) {
                console.log("waiting bootNode..." + time());
            } else {

                node = new xNode(socket, client.id(), client.bootId(), idBits); // use bootstraper as relay to join overlay
                console.log("node and client ok");
                console.info("init setup...  " + time());
                node.setup();

                clearInterval(waitSetupBootNode);
            }
        }, 2000);

        /**
         * wait until a datachannel is established with the booter
         * @type type
         */
        var waitSetupJoinChord = setInterval(function() {
            if (node.isBootReady()) {
                console.log("waiting dcBootNode..." + time());
            } else {
                console.log("node and boot ok");
                console.info("init join chord... " + time());
                node.join();
                console.info("Setup_STABILIZE_CHORD");
                node.stabilize(); // timeout
                clearInterval(waitSetupJoinChord);
            }
        }, 5000);


        var stabilizeBootNode = setInterval(function() {

            // nomes demanar finger table si el antic es null
            if (node.get_dc()[client.bootId()] === undefined) {
                client.reconnect();
            } else {
                console.info("LEADER STILL THE SAME!");
            }


        }, 20000);




    };





    ////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////
    // tolerancia de fallos y replicacion en la succesor list
    ////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////

    this.put = function(key, value) {

    };
    this.get = function(key) {

    };

    this.broadcast = function(msg) {
        node.broadcast(msg);
    };
    ////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////



// debuging tools

    this.node = function() {
        return node;
    };
    this.nodePC = function() {
        return node.show_pc();
    };
    this.nodeDC = function() {
        return node.show_dc();
    };
















    // //// //
    // NODE ////////////////////////////////////////////////////////////////////
    // //// // Chord node
    function xNode(socket, nodeId, bootId, bitwise) {

        //////////////////////
        // CHORD DATA STRUCT 
        var id = nodeId;
        var boot = bootId;
        var hash = Sha1.digest(id, bitwise);
        var bits = bitwise * 4;
        var range = Math.pow(2, bits);
        var waitMore = 0; // 0ms // stabilize
        /**
         * hash = "digestID"
         * node = "socket.id"
         
         * start "intervalStart"
         * finish = "intervalFinish"
         
         * pc = ""
         * dc = ""
         */
        // var finger = {};  // MATRIX -> routing table

        /**
         * key = "digestID" // from the topic name
         * value = "value" // from the topic name
         */
        var keys = {};  // TABLE -> dictionary  // has to be object for json
        var replicate = {}; // replication en la successor list -> {{ node: "node", keys:{} }}
        /**
         * inmediate succesor node
         * @type @exp;chord@pro;xNode@pro;id 
         */
        var successor; // = finger[1];

        /**
         * node updated on notify:
         *  hash
         *  node
         *  dc
         *  pc
         * @type chord.xNode.id
         */
        var predecessor; // set on notify


        // create a TAD for node

        /////////////////////
        // PEER DATA STRUCT
        var pc_config = {"iceServers": [{"url": "stun:" + webrtcStunServer}]};
        var dc_config = {reliable: true}; // :D
        var ms_config = {mandatory: {OfferToReceiveAudio: false, OfferToReceiveVideo: false}};

        // random token
        //   var token = Sha1.digest(nodeId, bitwise); // bitwise in hexa
        console.error("\nnew...\nhash:" + hash + "\nnode:" + id + "\nboot:" + boot);

        var pc = [];
        var pc_loopback;
        var dc = [];
        var dc_loopback;
        // LOOP BACK TODO

        establish_peer_connection(id, id);









        var localIceStack = [];
        var localIceReady = false;
        // var isLeader = nodeId === bootId ? true : false;


        //////////////////////
        // PUBLIC CHORD UTILS
        this.put = function(key, value) {

        };
        this.get = function(key) {

        };

        ////////////////////////
        // PRIVATE CHORD UTILS

        this.join = function() {
            console.error("join... \nnode:" + id + "\nboot:" + boot + "\nboot:" + client.bootId());
            if (boot !== client.bootId()) {
                boot = client.bootId();
            }
            if (id !== boot) { // if boot is not my self
                this.init_finger_table(id);
            } else {
                console.log("finger | pred | succ | 'self'");
                for (var i = 0; i < bits; i++) {
                    finger[i] = {};
                    finger[i].start = (hash + Math.pow(2, i)) % range;
                    finger[i].finish = (hash + Math.pow(2, i + 1)) % range;
                    finger[i].hash = hash;
                    finger[i].node = id;
                    // declaration & setup & interval timer
                }
                predecessor = id;
                successor = id;
            }
        };

        this.init_finger_table = function(id) {
            console.log("INIT_FINGER_TABLE");
            var rpc_init_finger;
            try {
                for (var key in dc) {
                    rpc_init_finger = JSON.stringify({type: "init_finger_req", srcNode: id, tgtNode: key, msg: "I want you to show me your finger..."});
                    dc[key].send(rpc_init_finger);
                    break;
                }
            } catch (e) {
                console.error(e.msg);
                dc[client.bootId()].send(rpc_init_finger);
            }

        };





        this.update_others = function() {
            console.log("UPDATE_OTHERS");
        };

        this.update_finger_table = function() {
            console.log("UPDATE_FINGER_TABLE");
        };
















        ///////////////////////////
        // REMOTE PROCEDURE CALLS

// declarar aqui els rpc_instructions...


        function find_successor(msg) {
        }
        ;

        function find_predecessor(msg) {
        }
        ;
        // msg forwarding to find closest preceding
        function closest_preceding_finger(tgtNode) {
            var keys = new Array();

            for (var key in finger) {
                // this sould be called within the sibling function
                keys.unshift(key);
            }
            var ini;
            var fin;
            var cand;
            for (var i = 0; i < keys.length; i++) {
                console.log(finger[keys[i]].node);
                ini = finger[keys[i]].start;
                fin = finger[keys[i]].finish;
                cand = finger[keys[i]].hash;
                if (ini < fin) { // estar interval normal
                    if (cand <= tgtNode && cand > ini)
                        return finger[keys[i]].node;
                } else { // estar interval circular
                    if ((cand <= tgtNode && cand < ini) || (cand >= tgtNode && cand > ini))
                        return finger[keys[i]].node;
                }
            }


        }
        ;

        function closest_starting_finger(msg) {
            var result; // rebuild finger

            var sampleMsg = {
                "type": "fing_can_req",
                "srcNode": "4Yz9BKEbc6iVeaGqAAAl",
                "tgtNode": "r1kGd6D9pjkwm3UyAAAj",
                "msg": "Do you know anyone closer to my finger?",
                "index": 0,
                "current": {
                    "start": 3,
                    "finish": 4,
                    "hash": 2,
                    "node": "r1kGd6D9pjkwm3UyAAAj"}
            };
            /*
             if (msg.index === 0) {
             // he is my predecessor ? have to check if he is closer to my previous predecessor
             var distCurr = distance(hash, Sha1.digest(predecessor, bitwise));
             var distCand = distance(hash, msg.current.hash);
             console.log("PREDECESSOR? " + distCand + " : " + distCurr);
             if (distCand > distCurr) {
             predecessor = msg.srcNode;
             // tell my predecessor that his new successorCandidate is msg.current.hash
             }
             }
             */
            // distance:  start --> hash 
            var distCurr = distance(msg.current.start, msg.current.hash);
            var closerCand = msg.current.node; // id
            var candHash; // hash
            var distCand; // dist
            var hasCloser = false;

            for (var key in dc) {
                candHash = Sha1.digest(key, bitwise);
                distCand = distance(msg.current.start, candHash);
                //  console.log("Distance curr: [" + distCurr + "]" + closerCand + " - cand: [" + distCand + "]" + key);
                if (distCand < distCurr) {
                    //    console.log("possible closer cand: [" + candHash + "]" + key);
                    closerCand = key;
                    distCurr = distCand;
                    hasCloser = true;
                }
            }

            if (msg.index === 0 && hasCloser) {
                console.log("PREDECESSOR? " + distCand + " : " + distCurr);
                predecessor = msg.srcNode;
            }

            var candidate = msg.current;
            candidate.node = closerCand;
            candidate.hash = Sha1.digest(closerCand, bitwise);
            result = JSON.stringify({type: "fing_can_res", srcNode: id, tgtNode: msg.srcNode, msg: "Possible closer finger..." + hasCloser, index: msg.index, hasCloser: hasCloser, candidate: candidate});

            return result;
        }


        // una pila de query rpc
        var queryProxyIndex = 0;
        var queryProxyReq = []; // faig preguntes aqui
        var queryProxyRes = []; // espero resposta aqui


        function establish_peer_connection(tgtNode, proxyNode) { // tell proxyNode to introduce me tgtNode
            console.error("ESTABLISH_PEER_CONNECTION: between me:  " + id + " <--- " + proxyNode + " ---> " + tgtNode);
            console.info(" " + tgtNode);
            console.log(" ");

            if (tgtNode === proxyNode) {
                pc_loopback = new RTCPeerConnection(pc_config);
                setPcLoopback();
                setDcLoopback(dc_config, hash);
                pc_loopback.createOffer(gotLocalOffer, gotError, ms_config);
            } else {
                if (pc[tgtNode] === undefined) {
                    pc[tgtNode] = new RTCPeerConnection(pc_config);
                    setPcHandlers(tgtNode);
                    setDcHandlers(tgtNode, Sha1.digest(tgtNode, bitwise), dc_config);
                    pc[tgtNode].createOffer(gotLocalOffer, gotError, ms_config);
                }
            }


            function gotLocalOffer(sdpOffer) {
                // localIceReady = navigator.mozGetUserMedia ? true : false;
                localIceReady = false; // crear un array de localIceReady pero en firefox funcionara igualment
                if (tgtNode === id) {
                    pc_loopback.setLocalDescription(sdpOffer, gotSetOffer, gotError);
                } else {
                    pc[tgtNode].setLocalDescription(sdpOffer, gotSetOffer, gotError);
                }
            }


            function gotSetOffer() { // wait answer  
                var rpc_fwd_sdp_offer;
                var localOffer;
                var proxyNodeStack = [];
                proxyNodeStack.push(id);
                var myVar = setInterval(function() {

                    if (pc[tgtNode] && pc[tgtNode].remoteDescription !== undefined) {
                        clearInterval(myVar);
                    }
                    console.info("TGT NODE : " + tgtNode);
                    console.log(pc[tgtNode]);
                    //    var readyState = pc[tgtNode].iceGatheringState();
                    //  if (readyState === "complete") {
                    if ((pc[tgtNode] && pc[tgtNode].iceGatheringState === "complete") || (tgtNode === id && pc_loopback.iceGatheringState === "complete")) {
                        //  if (localIceReady) {
                        localOffer = (tgtNode === id) ? pc_loopback.localDescription : pc[tgtNode].localDescription;

                        rpc_fwd_sdp_offer = JSON.stringify({
                            type: "forw_rpc_req",
                            srcNode: id,
                            tgtNode: tgtNode,
                            msg: "Can you forward this sdpOffer to " + tgtNode,
                            sdp: localOffer,
                            proxyNode: proxyNode,
                            proxyNodeStack: proxyNodeStack});
                        // send localDescription to remoteNode & wait 

                        if (proxyNode === tgtNode) { // localhost // localhost // o try catch
                            handle_peer_offerResponse(rpc_fwd_sdp_offer);
                        } else {
                            dc[proxyNode].send(rpc_fwd_sdp_offer);
                        }
                        clearInterval(myVar);
                    } else {
                        console.log("waiting iceGatheringState to complete");
                    }
                }, 10000);
            }

            // offerResponse emit




            // crear un interval timmer for answerResponse handler 
        }


        // abraçada MORTAL :D
        function handle_peer_offerResponse(msg) {

            try {
                msg = JSON.parse(msg);
            } catch (e) {
                console.info("LOCAL handle_peer_offerResponse");
            }
            console.log(msg);
            console.error("HANDLE_PEER_OFFERRESPONSE: ");
            console.info("from: >>" + msg.srcNode);

            var handle;
            if (pc[msg.srcNode] === undefined)
            {
                handle = true;

            } else {
                if (deathlocker(msg.srcNode, msg.tgtNode))
                {
                    handle = true;
                } else {
                    handle = false;
                }
            }

            if (handle || (msg.srcNode === msg.tgtNode)) { // no tinc prioritat esborro lo meva entrada
                pc[msg.srcNode] = new RTCPeerConnection(pc_config);
                setPcHandlers(msg.srcNode);
                console.error("UPDATE " + msg.srcNode + " REMOTE DESCRIPTION");
                pc[msg.srcNode].setRemoteDescription(new RTCSessionDescription(msg.sdp), gotCreateAnswer, gotError);
                console.log(pc[msg.srcNode].remoteDescription);
                console.log("PC steady! ");
            } else {  // tinc prioritat no faig res

            }



            function gotCreateAnswer() {
                pc[msg.srcNode].createAnswer(gotLocalAnswer, gotError, {});
            }

            function gotLocalAnswer(sdpAnswer) {
                // localIceReady = navigator.mozGetUserMedia ? true : false;
                localIceReady = false;
                pc[msg.srcNode].setLocalDescription(sdpAnswer, gotSetAnswer, gotError);
            }

            function gotSetAnswer() {
                var rpc_fwd_sdp_answer;
                var myVar = setInterval(function() {
                    //  if (pc[msg.srcNode].localDescription !== null && localIceReady) {
                    if (pc[msg.srcNode] && pc[msg.srcNode].iceGatheringState === "complete") {
                        //    if ((pc[tgtNode] && pc[tgtNode].iceGatheringState === "complete") || (tgtNode === id && pc_loopback.iceGatheringState === "complete")) {
                        rpc_fwd_sdp_answer = JSON.stringify({
                            type: "forw_rpc_res",
                            srcNode: msg.tgtNode, // || id
                            tgtNode: msg.srcNode,
                            msg: "Can you forward this sdpAnswer to " + msg.srcNode,
                            sdp: pc[msg.srcNode].localDescription,
                            proxyNode: msg.proxyNode,
                            proxyNodeStack: msg.proxyNodeStack
                        });

                        // AKI
                        if (msg.srcNode === msg.tgtNode) { // localhost
                            handle_peer_answerResponse(rpc_fwd_sdp_answer);
                        } else {
                            dc[msg.proxyNode].send(rpc_fwd_sdp_answer);
                        }
                        console.log(">>sendAnswer> COMPLETE & WAIT ");
                        // socket.emit('answerResponse', targetSocket, pc[targetSocket].localDescription);

                        clearInterval(myVar);
                    } else {
                        console.log("waiting iceGatheringState to complete");
                    }
                }, 10000);

            }
        }


        function handle_peer_answerResponse(msg) {

            try {
                msg = JSON.parse(msg);
            } catch (e) {
                console.info("LOCAL handle_peer_answerResponse");
            }

            console.log(msg);
            console.error("HANDLE_PEER_ANSWERRESPONSE: ");
            console.info(">>from: " + msg.tgtNode);

            if (msg.srcNode === msg.tgtNode) { // localhost
                pc_loopback.setRemoteDescription(new RTCSessionDescription(msg.sdp), gotSetAnswer, gotError);
            } else {
                console.error("UPDATE " + msg.tgtNode + " REMOTE DESCRIPTION!");
                pc[msg.srcNode].setRemoteDescription(new RTCSessionDescription(msg.sdp), gotSetAnswer, gotError);
                console.log(pc[msg.srcNode].remoteDescription);
            }
            function gotSetAnswer() {
                console.log(">>recvAnswer> COMPLETE & WAIT ");

            }
        }












        //////////////////////////////
        // REMOTE PROCEDURE HANDLERS 
        function handler_rpc(msg) {
            console.info("HANDLE_RPC: " + msg.type);
            console.log(msg.msg);
            switch (msg.type) {
                case "keep_alive":
                    break;
                case "init_finger_req":
                    var rpc_finger_req;
                    var waitFinger = setInterval(function() {
                        if (finger[0] !== undefined) {
                            rpc_finger_req = JSON.stringify({type: "init_finger_res", srcNode: id, tgtNode: msg.srcNode, msg: "My finger is... ", finger: finger});
                            dc[msg.srcNode].send(rpc_finger_req);
                            clearInterval(waitFinger);
                        } else {
                            console.log("waitFinger ");
                            // comprobar que existeix dc[boootID()], sino existeix fer ne un
                        }
                    }, 2000);
                    break;
                case "init_finger_res":
                    var candHash;
                    var distCurr;
                    var distCand;
                    for (var i = 0; i < bits; i++) {
                        finger[i] = {};
                        finger[i].start = (hash + Math.pow(2, i)) % range;
                        finger[i].finish = (hash + Math.pow(2, i + 1)) % range;

                        candHash = Sha1.digest(msg.finger[i].node, bitwise);
                        distCurr = distance(finger[i].start, hash);
                        distCand = distance(finger[i].start, candHash);

                        if (distCurr < distCand) {
                            finger[i].hash = hash;
                            finger[i].node = id;
                        } else {
                            finger[i].hash = candHash;
                            finger[i].node = msg.finger[i].node;
                        }
                    }
                    successor = msg.srcNode;
                    predecessor = msg.srcNode;

                    // pausar stabilize
                    // demanar al successor introduirme al als nodes desconeguts
                    // restaurar stabilize

                    break;
                case "fing_can_req":

                    var rpc_fing_can_res = closest_starting_finger(msg);
                    dc[msg.srcNode].send(rpc_fing_can_res);


                    break;
                case "fing_can_res":
                    // var rpc_forw_rpc_req;
                    if (msg.hasCloser) {
                        console.log("HAVE to update finger index " + msg.index);
                        console.log(msg.candidate);
                        finger[msg.index] = msg.candidate;


                        if (msg.index === 0)
                        {
                            successor = msg.candidate.node;
                        }




                        if (pc[msg.candidate.node] === undefined) {
                            // pause stabilize 
                            // create pc & dc & sdpOffer 
                            establish_peer_connection(msg.candidate.node, msg.srcNode);
                            //arrancar una crreació i esperar fins que el sdpOffer estigui en el queryBuffer

                            //  rpc_forw_rpc_req = JSON.stringify({type: "forw_rpc_req", srcNode: id, tgtNode: msg.candidate.node, msg: "Can you introduce..." + msg.candidate.node+"... to me?", forwNode: msg.srcNode, sdp: sdpOffer});
                        } else {
                            waitMore = 0;
                        }
                        // pause estabilize
                    }
                    break;

                case "pred_notify_req":
                    break;
                case "pred_notify_res":
                    break;

                case "succ_notify_req":
                    predecessor = msg.srcNode;
                    // check if there is a closer aixo ja ho fa el altre 
                    break;
                case "succ_notify_res":





                    break;

                case "forw_rpc_req": // push 
                    console.log(msg);
                    var rpc_fwd_sdp_offer;
                    var proxyNode;
                    if (id === msg.tgtNode) { // im the target node   
                        handle_peer_offerResponse(msg); // handle it un sempre llegeix  laltre no
                    } else {
                        if (dc[msg.tgtNode] === undefined) { // i dont know it so ill have to forward it or im the target
                            // search the closest preceding node as proxy node 
                            proxyNode = closest_preceding_finger(msg.tgtNode);
                        } else {
                            // i know the target finger :D
                            proxyNode = msg.tgtNode;
                        }

                        console.log("NEXT HOP: " + proxyNode);

                        msg.proxyNodeStack.push(msg.proxyNode);
                        rpc_fwd_sdp_offer = JSON.stringify({
                            type: "forw_rpc_req",
                            srcNode: msg.srcNode,
                            tgtNode: msg.tgtNode,
                            msg: msg.msg,
                            sdp: msg.sdp,
                            proxyNode: proxyNode, // next hop
                            proxyNodeStack: msg.proxyNodeStack});
                        dc[proxyNode].send(rpc_fwd_sdp_offer); // forward direct or finger
                    }

                    // closest finger or my dc list







                    break;
                case "forw_rpc_res": // pop  // programació metodica & llenguatges formals
                    console.log(msg);

                    var rpc_fwd_sdp_answer;

                    console.log(msg.proxyNodeStack);
                    var proxyNode = msg.proxyNodeStack.pop();
                    console.error("FROM ->  " + msg.proxyNode + " NEXT forw _ rpc _ res TO: " + msg.tgtNode);
                    console.log(msg.proxyNodeStack);

                    //    if (msg.proxyNode === msg.tgtNode || proxyNode === undefined) { // return  salt directe (no implementat) || s'ha travesat proxyNodeStack 
                    if (proxyNode === undefined) {
                        handle_peer_answerResponse(msg);
                    } else { // forward to next proxyNode 
                        rpc_fwd_sdp_answer = JSON.stringify({// aixo esta malament
                            type: "forw_rpc_res",
                            srcNode: msg.srcNode,
                            tgtNode: msg.tgtNode,
                            msg: msg.msg,
                            sdp: msg.sdp,
                            proxyNode: proxyNode,
                            proxyNodeStack: msg.proxyNodeStack
                        });
                        dc[proxyNode].send(rpc_fwd_sdp_answer); // forward proxy node
                    }
                    break;

                case "broadcast":
                    break;
                default:
                    console.log(msg.type);
                    console.log("type not defined!");
                    break;
            }
        }
        ;








// req msg are questions from remote src peer
// res msg are answers from remote tgt peer


        ////////////////////
        // CHORD STABILIZE

        this.stabilize = function() {
            console.info("STABILIZE");

            // loop through the finger table and query is the nodes think they really are correct
            var fingerIndex = 0;
            var targetNode;
            var rpc_fing_cand_req;
            var randomNode;

            var stabilize_finger;
            var stabilize_successor;


            stabilize_finger = setInterval(function() { // never ends :S, its like a gossiping protocol 
                // console.info("stable_finger... still alive! " + fingerIndex);
                fingerIndex += 1;
                fingerIndex = fingerIndex % bits;


                if (finger[fingerIndex] === undefined) {
                    console.log("STABILIZE_SUCCESSOR[" + fingerIndex + " is undefined...");
                } else {
                    // en el cas que es desconecti el bootnode... com a ultim recurs se busca un altre al brokerServer
                    if (finger[fingerIndex].node === id) {
                        // ask predecessor or random dc 
                        console.log("im my successsor");
                        randomNode = Math.floor(Math.random() * dc.length);
                        for (var key in dc) {
                            if (randomNode === 0) {
                                targetNode = key;
                                break;
                            } else {
                                randomNode--;
                            }
                        }
                    } else {
                        targetNode = finger[fingerIndex].node;
                    }

                    rpc_fing_cand_req = JSON.stringify({type: "fing_can_req",
                        srcNode: id,
                        tgtNode: targetNode,
                        msg: "Do you know anyone closer than my current finger?",
                        index: fingerIndex,
                        current: finger[fingerIndex]});
                    try {
                        if (pc[targetNode] === undefined) {
                            console.log("UNDEFINED dc: " + targetNode);
                            establish_peer_connection(targetNode, boot);
                        } else {
                            if (dc[targetNode].readyState === "open") {
                                dc[targetNode].send(rpc_fing_cand_req);
                            } else {
                                console.info("STILL CONNECTING TO: " + targetNode);
                            }
                        }
                    } catch (e) {
                        // still have to meet node
                        console.info(e.message + " have to KNOW finger: " + targetNode);
                    }
                }
            }, 5000 + waitMore);

            var rpc_succ_cand_req;
            stabilize_successor = setInterval(function() {
                console.log("STABILIZE_SUCCESSOR_ALIVE");
                rpc_succ_cand_req = JSON.stringify({
                    type: "succ_notify_req",
                    srcNode: id,
                    tgtNode: successor,
                    msg: "You are my successor, are you still alive?"
                });

                if (dc[successor] === undefined) {
                    console.info("successor DC still undefined!");
                } else
                if (dc[successor].readyState === "open") {
                    try {
                        dc[successor].send(rpc_succ_cand_req);
                    } catch (e) {
                        console.info(e.message + " have to KNOW finger: " + targetNode);
                    }
                }

                // fer replicació del successor list
            }, 60000 + waitMore);


            var random;
            var stabilize_dc;
            stabilize_dc = setInterval(function() {
                // get random number and check its status

                // MUUU MAL :D
                for (var key in dc) {
                    random = Math.floor(Math.random() * 1);
                    if (random) {
                        continue;
                    } else {
                        try {
                            dc[key].send(JSON.stringify({type: "keep_alive", msg: "hello " + key + " im " + id + " ..."}));
                        } catch (e) {
                            console.log(e.message + "DC[" + key + "] connection failed!");
                        }
                        break;
                    }
                }

            }, 100000);
        };

        this.stabilize_start = function() {

        };

        this.stabilize_stop = function() {

        };






        this.notify = function() {

        };

        this.fix_fingers = function() {
        };


























        ///////////////////
        // AUX FLAG FUNCS
        this.isBootReady = function() {
            for (var key in dc) {
                try {
                    dc[key].send(JSON.stringify("hello booter!"));
                    return false;
                } catch (e) {
                    console.log("booter not connected!");
                }
            }
            return true;
        };

        this.show_id = function() {
            return "[" + Sha1.digest(id, bitwise) + "]" + id;
        };

        this.show_boot = function() {
            return "[" + Sha1.digest(boot, bitwise) + "]" + boot;
        };
        // debuging tools
        this.show_pc = function() {
            console.log(pc);
            return pc;
        };

        this.show_dc = function() {
            console.log(dc);
            return dc;
        };

        this.get_dc = function() {
            return dc;
        };
        this.show_finger = function() {
            return finger;
        };

        this.show_keys = function() {
            return keys;
        };

        this.show_predecessor = function() {
            try {
                return "[" + Sha1.digest(predecessor, bitwise) + "]" + predecessor;
            } catch (e) {
                console.info("undefined predecessor...");
            }
            ;
        };

        this.show_successor = function() {
            try {
                return "[" + Sha1.digest(successor, bitwise) + "]" + successor;
            } catch (e) {
                console.info("undefined successor...");
            }
            ;
        };

        this.broadcast = function(msg) {
            var msg_broadcast = JSON.stringify({type: "broadcast", msg: msg});
            for (var key in dc) {
                if (dc[key].readyState === "open")
                    try {
                        dc[key].send(msg_broadcast);
                    } catch (e) {
                        console.error(e.message);
                    }
                else {
                    console.error("STILL CONNECTING!" + key);
                }
            }
        };
        //////////////////////////////////////////////////////////// 
        // JOIN TO OVERlAY BOOTSTRAPER
        this.setup = function() {
            console.log("SETUP pc&dc");
            // requestRoom sdpOffer | be roomSubject
            socket.emit('setup');

            // invoke listeners 
            socket.on('offerRequest', function(targetSocket) { // SELF :D none needed
                isLeader = true;
                console.log("offerRequest >> BOB: ");
                pc[targetSocket] = new RTCPeerConnection(pc_config);
                setPcHandlers(targetSocket);
                setDcHandlers(targetSocket, hash, dc_config);

                pc[targetSocket].createOffer(gotLocalOffer, gotError, ms_config);

                function gotLocalOffer(sdpOffer) {
                    // localIceReady = navigator.mozGetUserMedia ? true : false;
                    localIceReady = false;
                    console.error("UPDATE " + targetSocket + " LOCAL DESCRIPTION");
                    pc[targetSocket].setLocalDescription(sdpOffer, gotSetOffer, gotError);
                    //   console.log(pc[targetSocket].localDescription);
                }

                function gotSetOffer() { // wait answer  
                    var myVar = setInterval(function() {
                        if (localIceReady) {
                            socket.emit('offerResponse', targetSocket, pc[targetSocket].localDescription);
                            clearInterval(myVar);
                        }
                    }, 2000);
                }
            });
            socket.on('offerResponse', function(targetSocket, remoteOffer) {
                console.log("offerResponse >> ALICE: ");
                // console.log(remoteOffer.sdp);
                pc[targetSocket] = new RTCPeerConnection(pc_config);
                setPcHandlers(targetSocket);
                //  setDcHandlers(targetSocket, token, dc_config);
                pc[targetSocket].setRemoteDescription(new RTCSessionDescription(remoteOffer), gotCreateAnswer, gotError);
                function gotCreateAnswer() {
                    pc[targetSocket].createAnswer(gotLocalAnswer, gotError, {});
                }
                function gotLocalAnswer(sdpAnswer) {
                    // localIceReady = navigator.mozGetUserMedia ? true : false;
                    localIceReady = false;
                    console.error("UPDATE " + targetSocket + " LOCAL DESCRIPTION");
                    pc[targetSocket].setLocalDescription(sdpAnswer, gotSetAnswer, gotError);
                    //   console.log(pc[targetSocket].localDescription);
                }
                function gotSetAnswer() {
                    var myVar = setInterval(function() {
                        console.log("isAnswerReady >> ALICE ");
                        if (pc[targetSocket].localDescription !== null && localIceReady) {
                            socket.emit('answerResponse', targetSocket, pc[targetSocket].localDescription);
                            console.log("ALICE >sendAnswer> COMPLETE & WAIT ");
                            clearInterval(myVar);
                        }
                    }, 5000);
                }
            });
            socket.on('answerResponse', function(targetSocket, remoteAnswer) {
                console.log("answerResponse >> BOB " + remoteAnswer);
                pc[targetSocket].setRemoteDescription(new RTCSessionDescription(remoteAnswer), gotSetAnswer, gotError);
                function gotSetAnswer() {
                    console.log("BOB >recvAnswer> COMPLETE & WAIT ");
                    // wait until connection established // obtaining remote stream then
                }
            });
            // setup loopback datachannel 
        };

        // HANDLERS
        function gotError(error) {
            console.error(error);
            var text = "gotError: " + error.message;
            console.error(text);
        }

        function setPcHandlers(targetSocket) {
            pc[targetSocket].onaddstream = handleStreamAdded;
            pc[targetSocket].onremovestream = handleStreamRemoved;
            pc[targetSocket].onnegotiationneeded = handleOnNegotiationNeeded;
            pc[targetSocket].onicecandidate = handleIceCandidate; //
            pc[targetSocket].ondatachannel = handleDCJoin;
            pc[targetSocket].oniceconnectionstatechange = handleICEStateChange;
            pc[targetSocket].onsignalingstatechange = handleSignalStateChange;

            function handleIceCandidate(ice) {
                //	console.log('handleIceCandidate. ice: ');
                if (ice.candidate) {
                    var candidate = new RTCIceCandidate(ice.candidate);
                    pc[targetSocket].addIceCandidate(candidate);
                } else {
                    //    console.log("> LOCAL ICE READY >");
                    localIceReady = true;
                }
            }

            function handleDCJoin(event) {
                console.error("DCJoin[" + event.channel.label + "].state is: [" + event.channel.readyState + "] to dcRemote");
                //	console.log("dc[" + targetSocket + "] has Joined!");
                dc[targetSocket] = event.channel;
                //	console.log('handleDCJoin. dcRemote: ', dc[targetSocket]);
                dc[targetSocket].onmessage = handleMessage;
                dc[targetSocket].onopen = handleDCStateChange;	// action listener cuan s'obre el canal 	    dc[targetSocket].onclose = handleDCStateChange; // action listener per cuan se tanca el canal 
                dc[targetSocket].onerror = handleDCError;
            }
        }

        function setPcLoopback() {
            pc_loopback.onaddstream = handleStreamAdded;
            pc_loopback.onremovestream = handleStreamRemoved;
            pc_loopback.onnegotiationneeded = handleOnNegotiationNeeded;
            pc_loopback.onicecandidate = handleIceCandidate; //
            pc_loopback.ondatachannel = handleDCJoin;
            pc_loopback.oniceconnectionstatechange = handleICEStateChange;
            pc_loopback.onsignalingstatechange = handleSignalStateChange;

            function handleIceCandidate(ice) {
                //	console.log('handleIceCandidate. ice: ');
                if (ice.candidate) {
                    var candidate = new RTCIceCandidate(ice.candidate);
                    pc_loopback.addIceCandidate(candidate);
                } else {
                    //    console.log("> LOCAL ICE READY >");
                    localIceReady = true;
                }
            }

            function handleDCJoin(event) {
                console.error("DCJoin[" + event.channel.label + "].state is: [" + event.channel.readyState + "] to dcRemote");
                //	console.log("dc[" + targetSocket + "] has Joined!");
                dc_loopback = event.channel;
                //	console.log('handleDCJoin. dcRemote: ', dc[targetSocket]);
                dc_loopback.onmessage = handleMessage;
                dc_loopback.onopen = handleDCStateChange;	// action listener cuan s'obre el canal 	    dc[targetSocket].onclose = handleDCStateChange; // action listener per cuan se tanca el canal 
                dc_loopback.onerror = handleDCError;
            }
        }
        function setDcHandlers(targetSocket, token, dc_config) { // THIS IS THE CLIENT HANDLE MESSAGE

            dc[targetSocket] = pc[targetSocket].createDataChannel("dcToken[" + token + "]", dc_config);
            // start dc handlers 
            dc[targetSocket].onmessage = handleMessage;
            dc[targetSocket].onopen = handleDCStateChange;  // action listener cuan s'obre el canal
            dc[targetSocket].onclose = handleDCStateChange; // action listener per cuan se tanca el canal
            dc[targetSocket].onerror = handleDCError;

        }

        function setDcLoopback(dc_config, hash) {
            dc_loopback = pc_loopback.createDataChannel("dcToken[" + hash + "]", dc_config);
            dc_loopback.onmessage = handleMessage;
            dc_loopback.onopen = handleDCStateChange;  // action listener cuan s'obre el canal
            dc_loopback.onclose = handleDCStateChange; // action listener per cuan se tanca el canal
            dc_loopback.onerror = handleDCError;
        }



        function handleSignalStateChange(event) {
            //  console.log('handleSignalStateChange. Event: ', event);
        }
        function handleOnNegotiationNeeded(event) {
            //   console.log('handleOnNegotiationNeeded. Event: ', event);
        }
        function handleStreamRemoved(event) {
            console.log('handleStreamRemoved. Event: ', event);
        }
        function handleICEStateChange(event) {
            //   console.log('handleICEStateChange. Event: ', event);
        }
        function handleDCStateChange(event) {
            console.error("DC state is: " + event.target.readyState);
            console.log(event);
            // connection broken alert() if closed 
        }
        function handleDCError(err) {
            console.log('handleError. err: ', err);
        }
        function handleStreamAdded(event) {
            console.log('handleStreamAdded event', event);
        }
        function handleMessage(msg) { // TODO // ALWAYS STRINGIFY SO NONE OTHER WAY
            console.log("MSG RCV: ");
            //     console.log(msg.data);

            var data;
            try {
                data = JSON.parse(msg.data);
            } catch (e) {
                console.log("json.parseFAIL! " + e.message);
            }
            if (data.type === undefined) {
                console.log("MSG: " + data);
            } else {
                handler_rpc(data);
            }

            // detect when its a rpc 
        }

        /**
         * clockwise distance between nodes 
         * @param {type} hashSrc  - iniNode hash
         * @param {type} hashTgt  - finNode hash
         * @param {type} hashRange
         * @returns {undefined} // return a value inner the hashRange 
         */

        function distance(hashSrc, hashTgt, hashRange) { // hashed
            if (hashRange === undefined) {
                hashRange = range;
            }
            if (hashTgt >= hashSrc) {
                return hashTgt - hashSrc;
            } else {
                return (hashTgt + hashRange) - hashSrc;
            }
        }


        function deathlocker(srcNode, tgtNode) {

            var hash1;
            var hash2;
            var send;

            hash1 = Sha1.digest(srcNode, bitwise);
            hash2 = Sha1.digest(tgtNode, bitwise);
            console.error("DEADLOCK!");
            if ((hash1 & hash2) % 2) { // 50% de que cada
                // deixar passar un dels dos
                if (hash1 < hash2) {
                    console.error(id + " SRCNODE GOT PRORITY!");
                    send = true;
                } else {
                    send = false;
                }
            } else {
                if (hash1 > hash2) {
                    console.error(id + " TGTNODE GOT PRORITY!");
                    send = true;
                } else {
                    send = false;
                }
            }


            return send;
            // els dos poden fer un request pero només un ha de ser el leader 
            // abraçada mortal error 
        }

    }

//
// FIN NODE
//

    // ////// //
    // CLIENT //////////////////////////////////////////////////////////////////
    // ////// // Bootstraper 
    function xClient(socket) {
        var clientId; // identificador de node
        var leaderId;
        var room;

        this.setup = function() { // inicialitzar els listeners 

            socket.on('responseRooms', function(rooms) {
                console.log('responseRooms');
                // injectar-ho a la vista
                console.log(rooms);
            });

            socket.on('responseClients', function(clients) {
                console.log('responseClients');
                console.log(clients);
                for (index in clients) {
                    console.log(clients[index]);
                }
            });

            socket.on('responseJoinRoom', function(socketID, leaderID) {
                console.log('responseJoinRoom');
                console.log(socketID + ":" + leaderID);
                clientId = socketID;
                leaderId = leaderID;
            });

            socket.on('responseRoomLeader', function(leader, room) {
                console.log('responseRoomLeader');
                console.log("room: " + room + " leader is" + leader);
            });

            socket.on('message', function(key, value) {
                console.log('message');
                if ((key === undefined || value === undefined)) {
                    console.log("simple: " + key);
                } else {
                    console.log(key + ":" + value);
                    switch (key) {
                        case "leaderJoin":
                            console.warn("new Leader: " + value);
                            leaderId = value;
                            break;
                        case "leaderQuit":
                            console.warn("set request: " + value);
                            socket.emit('setup', room);
                            break;
                        case "idResponse":
                            console.info("get client id: " + value);
                            clientId = value;
                            break;
                        case "leaderResponse":
                            console.info("get leader id: " + value);
                            leaderId = value;
                            break;
                        default:
                            console.warn("missing key");
                            break;
                    }
                }
            });
        };

        this.connect = function(roomName) {
            this.setup();
            socket.emit('join', roomName);
            socket.emit('idRequest');
            socket.emit('leaderRequest');
            room = roomName;
        };

        this.reconnect = function() {
            socket.emit('setup');
        };

        this.getClientInfo = function() {
            console.log({client_id: clientId, leader_id: leaderId, room: room});
            return {client_id: clientId, leader_id: leaderId, room: room};
        };

        this.id = function() {
            return clientId;
        };

        this.bootId = function() {
            return leaderId;
        };

    }
    ;

//
// FIN CLIENT
//

    // /////// // 
    // ADAPTER /////////////////////////////////////////////////////////////////
    // /////// //
    browser = {
        clave: "valor",
        mozilla: navigator.mozGetUserMedia,
        chrome: navigator.webkitGetUserMedia,
        opera: navigator.getUserMedia,
        explorer: navigator.msGetUserMedia,
        safari: "valorSafari"
    };

    // build it as a library 
    navigator.getMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

    var RTCPeerConnection = null;
    var getUserMedia = null;
    var attachMediaStream = null;
    var reattachMediaStream = null;
    var webrtcDetectedBrowser = null;
    var webrtcDetectedVersion = null;
    var webrtcStunServer = "stun.l.google.com:19302";

    switch (navigator.getMedia) {
        case navigator.msGetUserMedia:
            console.log("microsoft internet explorer");
            //  none suported 
            setupExplorer();
            break;
        case navigator.mozGetUserMedia:
            console.log("mozilla firefox");
            webrtcDetectedBrowser = "firefox";
            webrtcDetectedVersion = parseInt(navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1]);
            setupFirefox();
            break;
        case navigator.webkitGetUserMedia:
            console.log("google chrome");
            webrtcDetectedBrowser = "chrome";
            webrtcDetectedVersion = parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]);
            setupChrome();
            break;
        case navigator.getUserMedia:
            console.log("opera");
            webrtcDetectedBrowser = "chrome"; // opera use webkit :D
            webrtcDetectedVersion = parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]);
            setupOpera();
            break;
        default:
            console.log("browser does not appear to be compatible with webrtc");
            // en aquest cas quan no ho soport mostra per log el primer que troba ;D
            break;
    }

    /** SETUP **/
    function setupChrome() {
        console.log("this appears to be chrome");
        createIceServer = function(url, username, password) {
            var iceServer = null;
            var url_parts = url.split(':');
            if (url_parts[0].indexOf('stun') === 0) {
                // create ice server with stun url 
                // perque no s'ha trobat cap candidat
                iceServer = {'url': url};
            } else
            if (url_parts[0].indexOf('turn') === 0) {
                if (webrtcDetectedVersion < 28) {
                    var url_turn_parts = url.split("turn:");
                    iceServer = {
                        'url': 'turn:' + username + '@' + url_turn_parts[1],
                        'credential': password};
                } else {
                    iceServer = {
                        'url': url,
                        'credential': password,
                        'username': username
                    };
                }
            }
            return iceServer;
        };

        // the RTC peer connection object
        RTCPeerConnection = webkitRTCPeerConnection;
        getUserMedia = navigator.webkitGetUserMedia.bind(navigator);

        // atach a media stream to an element 
        attachMediaStream = function(element, stream) {
            if (typeof element.srcObject !== 'undefined') {
                element.srcObject = stream;
            } else
            if (typeof element.mozSrcObject !== 'undefined') {
                element.mozSrcObject = stream;
            } else if (typeof element.src !== 'undefined') {
                element.src = URL.createObjectURL(stream);
            } else {
                console.log('Error attaching stream to element.');
            }
        };

        reattachMediaStream = function(to, from) {
            to.src = from.src;
        };

        if (!webkitMediaStream.prototype.getVideoTracks) {
            webkitMediaStream.prototype.getVideoTracks = function() {
                return this.videoTracks;
            };
            webkitMediaStream.prototype.getAudioTracks = function() {
                return this.audioTracks;
            };
        }
        // New syntax of getXXXStreams method in M26.
        if (!webkitRTCPeerConnection.prototype.getLocalStreams) {
            webkitRTCPeerConnection.prototype.getLocalStreams = function() {
                return this.localStreams;
            };
            webkitRTCPeerConnection.prototype.getRemoteStreams = function() {
                return this.remoteStreams;
            };
        }
    }

    function setupFirefox() {
        console.log("this appears to be firefox");
        webrtcStunServer = "74.125.31.127:19302";
        // The RTCPeerConnection object.
        RTCPeerConnection = mozRTCPeerConnection;

        // The RTCSessionDescription object.
        RTCSessionDescription = mozRTCSessionDescription;

        // The RTCIceCandidate object.
        RTCIceCandidate = mozRTCIceCandidate;

        getUserMedia = navigator.mozGetUserMedia.bind(navigator);

        // Creates iceServer from the url for FF.
        createIceServer = function(url, username, password) {
            var iceServer = null;
            var url_parts = url.split(':');
            if (url_parts[0].indexOf('stun') === 0) {
                // Create iceServer with stun url.
                iceServer = {'url': url};
            } else if (url_parts[0].indexOf('turn') === 0 &&
                    (url.indexOf('transport=udp') !== -1 ||
                            url.indexOf('?transport') === -1)) {
                // Create iceServer with turn url.
                // Ignore the transport parameter from TURN url.
                var turn_url_parts = url.split("?");
                iceServer = {'url': turn_url_parts[0],
                    'credential': password,
                    'username': username};
            }
            return iceServer;
        };

        // Attach a media stream to an element.
        attachMediaStream = function(element, stream) {
            console.log("Attaching media stream");
            element.mozSrcObject = stream;
            element.play();
        };

        reattachMediaStream = function(to, from) {
            console.log("Reattaching media stream");
            to.mozSrcObject = from.mozSrcObject;
            to.play();
        };

        // Fake get{Video,Audio}Tracks
        MediaStream.prototype.getVideoTracks = function() {
            return [];
        };

        MediaStream.prototype.getAudioTracks = function() {
            return [];
        };
    }

    function setupOpera() {
        // no setup needed, runs as defualt...
        console.log("none setup");
    }

    function setupExplorer() {
        console.warn("none supoirted");
    }

    if (window.File && window.FileReader && window.FileList && window.Blob) {
        console.log('FILE SHARE SUPPORTED!');
    } else {
        console.log('FS-NONE-SUPORTED');
        // alert('FS-NONE-SUPORTED');
    }


    function time() {
        var currentdate = new Date();
        var datetime = "Last Sync: " + currentdate.getDate() + "/"
                + (currentdate.getMonth() + 1) + "/"
                + currentdate.getFullYear() + " @ "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();
        return datetime;
    }
    ;
})('Hello World :D');

chord.connect(null, "ChordBootstraper");
// chord.connect("signal_server_url", "room");
 