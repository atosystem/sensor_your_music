import './style.css';
import firebase from 'firebase/app';
import 'firebase/firestore';

// port for connecting to backend
const WS_PORT = 3005

// for qrcode generation (please change to your information after forking this repo)
const GITHUB_USERNAME = "atosystem"
const GITHUB_REPO_NAME = "sensor_your_music"

const firebaseConfig = {
  apiKey: "AIzaSyChwv4ULSZFHYI3dS1xs_by7eFDfb8I2HE",
  authDomain: "test-4e071.firebaseapp.com",
  projectId: "test-4e071",
  storageBucket: "test-4e071.appspot.com",
  messagingSenderId: "251598311975",
  appId: "1:251598311975:web:0216503ce4960f768d3402"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const firestore = firebase.firestore();

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

// Global State
const pc = new RTCPeerConnection(servers);
let browser_role = "client";



// HTML elements
const callButton = document.getElementById('callButton');
const callInput = document.getElementById('callInput');
const answerButton = document.getElementById('answerButton');
const dataChannelSend = document.getElementById('txt_send')
const sendButton = document.getElementById('btn_send');
const div_connect_status = document.getElementById("div_connect_status");
const sensors_ui = document.getElementById("sensors_ui");
const server_ui = document.getElementById("server_ui");
const demo_button = document.getElementById("start_demo");
const txt_udp_port = document.getElementById("txt_udp_port");
const span_mode = document.getElementById("span_mode");
const div_ws_status = document.getElementById("div_ws_status")


let sendChannel;
let receiveChannel;
let ws;
let udp_port;

sendChannel = pc.createDataChannel('sendDataChannel',null);
sendChannel.onopen = onSendChannelStateChange;
sendChannel.onclose = onSendChannelStateChange;

pc.ondatachannel = receiveChannelCallback;

const urlSearchParams = new URLSearchParams(window.location.search);
const url_params = Object.fromEntries(urlSearchParams.entries());
console.log(url_params)



sendButton.onclick = function (event) {
  let data = dataChannelSend.value;
  sendChannel.send(data);
  console.log('Sent Data: ' + data);
}


function receiveChannelCallback(event) {
  console.log('Receive Channel Callback');
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveMessageCallback(event) {
  ws.send(`${udp_port}:${event.data}`);
  // console.log(`Received Message : ${event.data}`);
}

function onSendChannelStateChange() {
  let readyState = sendChannel.readyState;
  console.log('Send channel state is: ' + readyState);
  if (readyState === 'open') {
    if (browser_role === "server")
    {
      div_connect_status.innerHTML = "client connect"
    }else if (browser_role === "client") {
      div_connect_status.innerHTML = "connected to server"
      demo_button.classList.remove("disabled")
    }
    div_connect_status.className = "badge bg-success"
  } else {
    if (browser_role === "server")
    {
      div_connect_status.innerHTML = "client disconnect"
    }else if (browser_role === "client") {
      div_connect_status.innerHTML = "disconnected to server"
    }
    div_connect_status.className = "badge bg-danger"
  }
}

function onReceiveChannelStateChange() {
  let readyState = receiveChannel.readyState;
  console.log('Receive channel state is: ' + readyState);
}


// Create an offer
callButton.onclick = async () => {
  if (txt_udp_port.value === "")
  {
    alert("Please assign udp port to pd")
    return;
  }
  // assign udp port
  udp_port = parseInt(txt_udp_port.value)
  txt_udp_port.disabled = true
  console.log(`Using udp port=${udp_port}`)

  callButton.classList.add("disabled")

  // Reference Firestore collections for signaling
  const callDoc = firestore.collection('calls').doc();
  const offerCandidates = callDoc.collection('offerCandidates');
  const answerCandidates = callDoc.collection('answerCandidates');

  callInput.value = callDoc.id;

  // display qrcode
  let qr_img = document.createElement('img');
  // create qrcode for the URL for phones to connect
  qr_img.src = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=https://${GITHUB_USERNAME}.github.io/${GITHUB_REPO_NAME}/?connect_code=${callDoc.id}`
  sensors_ui.appendChild(qr_img)

  // change page title
  document.title = `Listen to ${udp_port}`

  // Get candidates for caller, save to db
  pc.onicecandidate = (event) => {
    event.candidate && offerCandidates.add(event.candidate.toJSON());
  };

  

  // Create offer
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  await callDoc.set({ offer });

  // Listen for remote answer
  callDoc.onSnapshot((snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
    }
  });

  // When answered, add candidate to peer connection
  answerCandidates.onSnapshot((snapshot) => {
    console.log("Candidate answered")
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });
  div_connect_status.innerHTML = "Waiting for client"
};

// 3. Answer the call with the unique ID

const answerFunc = async () => {
  const callId = callInput.value;
  const callDoc = firestore.collection('calls').doc(callId);
  const answerCandidates = callDoc.collection('answerCandidates');
  const offerCandidates = callDoc.collection('offerCandidates');

  pc.onicecandidate = (event) => {
    event.candidate && answerCandidates.add(event.candidate.toJSON());
  };

  const callData = (await callDoc.get()).data();
  if (callData == undefined)
  {
    div_connect_status.innerHTML = "cannot connect to server"
    div_connect_status.className = "badge bg-danger"
  }
  console.log("callData",callData)
  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  await callDoc.update({ answer });

  offerCandidates.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      // console.log(change);
      
      if (change.type === 'added') {
        let data = change.doc.data();
        pc.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });
};

answerButton.onclick = answerFunc

if ('connect_code' in url_params) {
  // connected code provided -> client
  callInput.value = url_params['connect_code'];
  server_ui.innerHTML = ""
  callInput.disabled = true
  callButton.disabled= true
  answerButton.disabled=true
  browser_role = "client"
  div_connect_status.innerHTML = "connecting to server"
  span_mode.innerHTML="Client Mode"
  demo_button.classList.add("disabled")
  answerFunc()
} else {
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  {
    // localhost as server
    console.log("Using localhost")
    browser_role = "server"
    div_connect_status.innerHTML = "Please Start the server"
    sensors_ui.innerHTML = ""
    answerButton.disabled=true
    callInput.disabled = true
    dataChannelSend.disabled = true
    sendButton.disabled = true
    span_mode.innerHTML="Server Mode"
    
    // start websocket (to localhost backend server)
    
    ws = new WebSocket(`ws://localhost:${WS_PORT}`)
    console.log(ws)

    ws.onopen = () => {
        console.log('[ws]open connection')
        
    }
    ws.onerror = (err) => {
      div_ws_status.innerHTML = "websocket error"
    }

    ws.onclose = () => {
      div_ws_status.innerHTML = "websocket closed"
      console.log('[ws]close connection')
    }


  }else{
    div_connect_status.innerHTML = "Free mode"
    document.body.style.overflow = "auto"
    browser_role = "free_mode"
  }
  
  
}

let orientation_data = [0,0,0]
      
function handleOrientation(event) {
  updateFieldIfNotNull('Orientation_a', event.alpha);
  updateFieldIfNotNull('Orientation_b', event.beta);
  updateFieldIfNotNull('Orientation_g', event.gamma);
  orientation_data = [event.alpha,event.beta,event.gamma]
  incrementEventCount();
}

function incrementEventCount(){
  let counterElement = document.getElementById("num-observed-events")
  let eventCount = parseInt(counterElement.innerHTML)
  counterElement.innerHTML = eventCount + 1;
}

function updateFieldIfNotNull(fieldName, value, precision=10){
  if (value != null)
    document.getElementById(fieldName).innerHTML = value.toFixed(precision);
}

function handleMotion(event) {
  let _msg = "";
  _msg += `${event.accelerationIncludingGravity.x} ${event.accelerationIncludingGravity.y} ${event.accelerationIncludingGravity.z} `
  _msg += `${event.acceleration.x} ${event.acceleration.y} ${event.acceleration.z} `
  _msg += `${event.rotationRate.alpha} ${event.rotationRate.beta} ${event.rotationRate.gamma} `
  _msg += `${orientation_data[0]} ${orientation_data[1]} ${orientation_data[2]}`
  

  sendChannel.send(`${_msg}`);
  // console.log('Sent Data: ' + `data: ${event.rotationRate.alpha}`);
  updateFieldIfNotNull('Accelerometer_gx', event.accelerationIncludingGravity.x);
  updateFieldIfNotNull('Accelerometer_gy', event.accelerationIncludingGravity.y);
  updateFieldIfNotNull('Accelerometer_gz', event.accelerationIncludingGravity.z);

  updateFieldIfNotNull('Accelerometer_x', event.acceleration.x);
  updateFieldIfNotNull('Accelerometer_y', event.acceleration.y);
  updateFieldIfNotNull('Accelerometer_z', event.acceleration.z);

  updateFieldIfNotNull('Accelerometer_i', event.interval, 2);

  updateFieldIfNotNull('Gyroscope_z', event.rotationRate.alpha);
  updateFieldIfNotNull('Gyroscope_x', event.rotationRate.beta);
  updateFieldIfNotNull('Gyroscope_y', event.rotationRate.gamma);
  incrementEventCount();
}

let is_running = false;

demo_button.onclick = function(e) {
  e.preventDefault();
  if (typeof DeviceMotionEvent === 'undefined')
  {
    alert("Cannot connect to sensors!")
    return
  }
  // Request permission for iOS 13+ devices
  if (
    DeviceMotionEvent &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    DeviceMotionEvent.requestPermission();
  }
  
  if (is_running){
    window.removeEventListener("devicemotion", handleMotion);
    window.removeEventListener("deviceorientation", handleOrientation);
    demo_button.innerHTML = "Start demo";
    demo_button.classList.add('btn-success');
    demo_button.classList.remove('btn-danger');
    is_running = false;
  }else{
    window.addEventListener("devicemotion", handleMotion);
    window.addEventListener("deviceorientation", handleOrientation);
    document.getElementById("start_demo").innerHTML = "Stop demo";
    demo_button.classList.remove('btn-success');
    demo_button.classList.add('btn-danger');
    is_running = true;
  }
};

/*
Light and proximity are not supported anymore by mainstream browsers.
window.addEventListener('devicelight', function(e) {
   document.getElementById("DeviceLight").innerHTML="AmbientLight current Value: "+e.value+" Max: "+e.max+" Min: "+e.min;
});

window.addEventListener('lightlevel', function(e) {
   document.getElementById("Lightlevel").innerHTML="Light level: "+e.value;
});

window.addEventListener('deviceproximity', function(e) {
   document.getElementById("DeviceProximity").innerHTML="DeviceProximity current Value: "+e.value+" Max: "+e.max+" Min: "+e.min;
});

window.addEventListener('userproximity', function(event) {
   document.getElementById("UserProximity").innerHTML="UserProximity: "+event.near;
});
*/
