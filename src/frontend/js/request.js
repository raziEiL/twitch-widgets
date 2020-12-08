module.exports = (url, callback) => {
    let httpRequest;

    if (window.XMLHttpRequest) { // Mozilla, Safari, ...
        httpRequest = new XMLHttpRequest().onreadystatechange;
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

    httpRequest.onreadystatechange = (req) => callback(req);
    httpRequest.open("GET", url, true);
    httpRequest.send();
};