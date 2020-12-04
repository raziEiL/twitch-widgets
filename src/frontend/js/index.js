setInterval(makeRequest, 3000);

function makeRequest() {
    let httpRequest;

    if (window.XMLHttpRequest) { // Mozilla, Safari, ...
        httpRequest = new XMLHttpRequest();
        if (httpRequest.overrideMimeType) {
            httpRequest.overrideMimeType("application/json");
        }
    }
    else if (window.ActiveXObject) { // IE
        try {
            httpRequest = new ActiveXObject("Msxml2.XMLHTTP");
        } catch {
            try {
                httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
            } catch { }
        }
    }

    if (!httpRequest) {
        console.log("Не вышло :( Невозможно создать экземпляр класса XMLHTTP ");
        return;
    }

    httpRequest.onreadystatechange = () => updateVoices(httpRequest);
    httpRequest.open("GET", "http://localhost:80/api/voting", true);
    httpRequest.send(null);
}

function updateVoices(httpRequest) {
    if (httpRequest.readyState == 4) {
        if (httpRequest.status == 200) {
            const voteData = JSON.parse(httpRequest.responseText);
            console.log(voteData);

            if (!voteData)
                return;

            const { condidateA, condidateB } = voteData;
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