let currentRequestId = null;
let room = null;
let videoStarted = false;
let audioOnly = false;

document.getElementById('start-video').addEventListener('click', async () => {
    if (videoStarted) {
        console.log("Video already started.");
        return;
    }

    const roomName = 'myRoom';
    const participantName = 'participant1';

    const config = await fetch('http://127.0.0.1:5000/get_config').then(res => res.json());
    const tokenData = await fetch(`http://127.0.0.1:5000/get_token?room=${roomName}&name=${participantName}`).then(res => res.json());

    if (tokenData.token) {
        room = new LivekitClient.Room();

        try {
            await room.connect(config.livekit_url, tokenData.token);
            console.log("Connected to room", room);

            // Handle audio/video tracks based on user preference
            const tracks = await LivekitClient.createLocalTracks({
                video: !audioOnly,  // Use video unless audio-only is selected
                audio: true
            });

            for (const track of tracks) {
                await room.localParticipant.publishTrack(track);
            }

           for (const track of tracks) {
                if (track.kind === 'video') {
                    const videoElement = track.attach();
                    videoElement.autoplay = true;
                    videoElement.muted = true;
                    videoElement.style.width = "100%";  // Make video element take full width
                    videoElement.style.height = "100%"; // Make video element take full height
                    videoElement.style.objectFit = "contain"; // Ensure the whole video fits
                    document.getElementById('livekit-room').innerHTML = ''; // Clear previous
                    document.getElementById('livekit-room').appendChild(videoElement);
                }
            }


            room.on('participantConnected', (participant) => {
                participant.on('trackSubscribed', (track) => {
                    if (track.kind === 'video') {
                        const videoElement = track.attach();
                        videoElement.autoplay = true;
                        document.getElementById('livekit-room').appendChild(videoElement);
                    }
                    // Handle audio track
                    if (track.kind === 'audio') {
                        const audioElement = track.attach();
                        audioElement.autoplay = true;
                        document.body.appendChild(audioElement); // Ensure it's added to DOM for playback
                    }
                });
            });

            videoStarted = true;
            document.getElementById('question').disabled = false; // Enable input
            document.getElementById('start-video').style.display = 'none';
            document.getElementById('stop-video').style.display = 'inline-block';

        } catch (error) {
            console.error("Error connecting to room: ", error);
        }
    } else {
        alert("Error: " + tokenData.error);
    }
});

document.getElementById('stop-video').addEventListener('click', () => {
    if (room) {
        room.disconnect();
        videoStarted = false;
        document.getElementById('start-video').style.display = 'inline-block';
        document.getElementById('stop-video').style.display = 'none';
        document.getElementById('question').disabled = true; // Disable input
    }
});

document.getElementById('audio-toggle').addEventListener('change', (event) => {
    audioOnly = event.target.checked;
    if (videoStarted) {
        // Reconnect if already started, with updated preferences
        room.disconnect();
        document.getElementById('start-video').click();
    }
});

async function askAI() {
    const questionInput = document.getElementById("question");
    const question = questionInput.value;

    if (!question.trim()) return;

    const response = await fetch("http://127.0.0.1:5000/ai_respond", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
    }).then(res => res.json());

    document.getElementById("ai-response").innerText = response.answer;

    if (response.request_id) {
        currentRequestId = response.request_id;
        pollForAnswer(response.request_id, question);
    }
}

function pollForAnswer(requestId, questionText) {
    const interval = setInterval(async () => {
        const helpRequests = await fetch("http://127.0.0.1:5000/supervisor/requests").then(res => res.json());

        const stillPending = helpRequests.find(req => req.id === requestId);
        if (!stillPending) {
            clearInterval(interval);
            const kb = await fetch("http://127.0.0.1:5000/knowledge_base").then(res => res.json());
            const match = kb.find(entry => entry.question === questionText);
            if (match) {
                document.getElementById("ai-response").innerText = "Supervisor replied: " + match.answer;
            }
        }
    }, 3000);
}
