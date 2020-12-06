function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
}

for (let i = 0; i < 10; i++) {
    console.log(getRandomInt(0, 2));
}