const request = require("./incude/request");
const { timestamp } = require("@raz1el/util");

let timerCountdown, isWaitsForWinner;

const timerApi = setInterval(() => {
    request("/api/draw", drawCallback);
}, 5000);

function drawCallback(httpRequest) {
    if (httpRequest.readyState == 4) {
        if (httpRequest.status == 200) {
            const data = JSON.parse(httpRequest.responseText);
            console.log(data);

            if (!data)
                return;

            document.querySelector(".draw-voted").innerHTML = data.userCount;
            document.querySelector(".draw-command").innerHTML = data.command;
            document.querySelector(".draw-text").innerHTML = data.text;

            if (data.endTimestamp) {
                if (!timerCountdown && !isWaitsForWinner) {
                    let seconds = data.endTimestamp - timestamp();

                    // The browser has been refreshed
                    if (seconds < 1) {
                        if (data.lastWinner)
                            completeDrawing(data.lastWinner);
                        else
                            sendWinnerRequset();

                        updateTimerElement(0);
                        return;
                    }

                    timerCountdown = setInterval(() => {
                        updateTimerElement(seconds);

                        if (seconds < 1) {
                            clearInterval(timerCountdown);
                            sendWinnerRequset();
                        }
                        else
                            seconds--;
                    }, 1000);
                }
            }
            else
                updateTimerElement(data.countdownSeconds);
        }
        else {
            console.log("С запросом возникла проблема. status: " + httpRequest.status);

            if (timerCountdown)
                clearInterval(timerCountdown);
            timerCountdown = undefined;
        }
    }
}

const formatTime = (num) => num > 9 ? num : ("0" + num);

function updateTimerElement(countdown) {
    const min = Math.floor(countdown / 60);
    const sec = Math.floor(countdown % 60);
    document.querySelector(".draw-countdown").innerHTML = formatTime(min) + ":" + formatTime(sec);
}

function sendWinnerRequset() {
    console.log("sendWinnerRequset");
    isWaitsForWinner = true;

    request("/api/draw/winner", (httpRequest) => {
        if (httpRequest.readyState == 4) {
            if (httpRequest.status == 200)
                completeDrawing(httpRequest.responseText);
            else {
                isWaitsForWinner = false;
                console.log("С запросом возникла проблема. status: " + httpRequest.status);
            }
        }
    });
}

function completeDrawing(winner) {
    console.log("completeDrawing > Winner: " + winner);
    clearInterval(timerApi);

    document.querySelector(".draw").classList.add("opacity-none");
    document.querySelector(".winner-name").innerHTML = winner;

    setTimeout(() => {
        document.querySelector(".draw").classList.add("hidden");
        document.querySelector(".winner").classList.remove(["hidden", "opacity-none"]);
    }, 1500);
}