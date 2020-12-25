const request = require("./incude/request");

setInterval(() => {
    request("/api/vote", voteCallback);
}, 5000);

function voteCallback(httpRequest) {
    if (httpRequest.readyState == 4) {
        if (httpRequest.status == 200) {
            const data = JSON.parse(httpRequest.responseText);
            console.log(data);

            if (!data)
                return;

            const { condidateA, condidateB } = data;
            const total = condidateA.votes + condidateB.votes;

            const calcPercent = (voices) => total <= 0 ? 0 : Math.round(voices / total * 100);
            const getWidth = (percent) => (percentA <= 0 && percentB <= 0 ? 50 : percent) + "%";
            const getText = (percent) => percent + "%";

            const percentA = calcPercent(condidateA.votes);
            const percentB = calcPercent(condidateB.votes);

            document.querySelector(".bar-user-a").style.width = getWidth(percentA);
            document.querySelector(".bar-user-b").style.width = getWidth(percentB);
            document.querySelector(".text-user-a").innerHTML = getText(percentA);
            document.querySelector(".text-user-b").innerHTML = getText(percentB);
            document.querySelector(".command-user-a").innerHTML = condidateA.command;
            document.querySelector(".command-user-b").innerHTML = condidateB.command;
        }
        else {
            console.log("С запросом возникла проблема. status: " + httpRequest.status);
        }
    }
}
