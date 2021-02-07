"use strict";

window.onload = init;

/*
/* 広域変数 /*
*/
var W = NaN, H = NaN;
var canvas, ctx;
var menu;
var stage = [], scale = NaN;
var player, enemies = [];
var items = [];
var clock;
var sound, bgm, fin = null, fout = null;
var keyCode = 0;
var timer = NaN, fps = 25;
var timeZone = NaN, MORNING = 1, NOON = 2, EVENING = 3, NIGHT = 4;
var status = NaN, MENU = 0, GAME = 1, GAMECLEAR = 2, GAMEOVER = 3;
var direction = {
    down: {x: 0, y: +1, d: 0},
    left: {x: -1, y: 0, d: 1},
    right: {x: +1, y: 0, d: 2},
    up: {x: 0, y: -1, d: 3},
    step: 1,
    count: 0
};
var basePoint = {
    x: NaN,
    y: NaN
};
var eBasePoint = {
    x: NaN,
    y: NaN
}
var stageObj = {
    ground: {id: 0, src: "DeepForest-A2"},
    wall: {id: 1, src: "DeepForest-A5"},
    rock: {id: 3, src: "DeepForest-B"},
    base: {id: 64, src: "openbook1b"},
    enemyBase: {id: 128, src: "DeepForest-A5"}
};
var itemObj = {
    stone: {id: 11, hp: 10, quantity: 20, src: "Cave1-EarthB"},
    tree: {id: 13, hp: 15, quantity: 10, src: "Village1-C"},
    jewel: {id: 15, hp: 50, quantity: 3, src: "Cave1-EarthB"}
};

var character = new Character();
Player.prototype = character;
Enemy.prototype = character;

/*
/* PlayerとEnemyのプロトタイプ /*
*/
function Character(){
    // スクロール処理
    this.doScroll = function(){
        if(this.dx == 0 && this.dy == 0){
            return;
        }

        if(++this.scrollCount >= this.maxScrollCount){
            this.x = this.x + this.dx;
            this.y = this.y + this.dy;
            this.dx = 0;
            this.dy = 0;
            this.scrollCount = 0;
        }
    }

    this.getScrollX = function(){
        return this.dx * this.scrollCount * scale / this.maxScrollCount;
    }

    this.getScrollY = function(){
        return this.dy * this.scrollCount * scale / this.maxScrollCount;
    }

    // 進行方向チェック
    this.doCheck = function(){
        if(this.x + this.dx < 0){
            this.dx = 0;
        }
        if(this.x + this.dx >= W){
            this.dx = 0;
        }
        if(this.y + this.dy < 0){
            this.dy = 0;
        }
        if(this.y + this.dy >= H){
            this.dy = 0;
        }

        if(stage[this.y + this.dy][this.x + this.dx] & 0x1){
            this.dx = 0;
            this.dy = 0;
        }
    }

    // キャラクター専用の描画関数
    this.paint = function(image, step, dir, scrX, scrY){
        ctx.drawImage(image, 32 * step, 32 * dir, 32, 32, this.x * scale + scrX, this.y * scale + scrY, scale, scale);
    }
}

/*
/* 主人公オブジェクト /*
*/
function Player(x, y, hp, attack){
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;
    this.dir = 0;
    this.scrollCount = 0;
    this.maxScrollCount = 3;
    this.hp = hp;
    this.attack = attack;
    this.src = "pipo-charachip018";
    
    this.update = function(){
        this.doScroll();
        if(this.scrollCount > 0){
            return;
        }

        if(status != GAME){return;}
        switch(keyCode){
            case 37:
                this.dx = direction.left.x;
                this.dy = direction.left.y;
                this.dir = direction.left.d;
            break;
            case 38:
                this.dx = direction.up.x;
                this.dy = direction.up.y;
                this.dir = direction.up.d;
            break;
            case 39:
                this.dx = direction.right.x;
                this.dy = direction.right.y;
                this.dir = direction.right.d;
            break;
            case 40:
                this.dx = direction.down.x;
                this.dy = direction.down.y;
                this.dir = direction.down.d;
            break;
        }

        this.doCheck();
    }
}

/*
/* 敵オブジェクト /*
*/
function Enemy(id, x, y, hp, attack, speed, route){
    this.id = id;
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;
    this.dir = 0;
    this.hp = hp;
    this.attack = attack;
    this.speed = speed;
    this.scrollCount = 0;
    this.maxScrollCount = 50 / this.speed;
    this.route = route;
    this.attackMode = false;
    this.src = ["pipo-simpleenemy01a", "pipo-simpleenemy01b", "pipo-simpleenemy01g"];

    this.update = function(){
        this.doScroll();
        if(this.scrollCount > 0){
            return;
        }

        if(basePoint.x == this.x && basePoint.y == this.y){
            status = GAMEOVER;
        }

        var d = [direction.left, direction.right,
        timeZone == NIGHT ? direction.up : direction.down];
        var r = Number(this.route[this.y][this.x]);
        var next = timeZone == NIGHT ? r + 1 : r - 1;
        for(var i = 0; i < d.length; i++){
            if(timeZone != NIGHT && r == 101){
                break;
            }

            if(this.route[this.y + d[i].y][this.x + d[i].x] == next){
                this.dx = d[i].x;
                this.dy = d[i].y;
                this.dir = d[i].d != 3 ? d[i].d : 0;
                break;
            } else {
                this.dx = 0;
                this.dy = 0;
            }
        }
        
        this.doCheck();
    }
}

/*
/* アイテムオブジェクト /*
*/
function Item(hp, quantity){
    this.hp = hp;
    this.quantity = quantity;
    this.time = 0;
    this.coolTime = 2 * fps;

    this.update = function(){
        if(timeZone == NIGHT){
            return;
        }

        this.time++;
        if(this.time < this.coolTime){
            return;
        }

        setTimeout(function(){
            var flag = false;
            while(!flag){
                var rx = random(W);
                var ry = random(H);
                if(stage[ry][rx] != 0){
                    return;
                }

                var d = [];
                for(var i = 0; i < Object.keys(direction).length; i++){
                    d.push(direction[Object.keys(direction)[i]]);
                }

                if(rx == player.x && ry == player.y){
                    return;
                }
                for(var i = 0; i < d.length; i++){
                    if(rx == player.x + d[i].x && ry == player.y + d[i]){
                        return;
                    }
                }
                
                for(var i = 0; i < enemies.length; i++){
                    if(rx == enemies[i].x && ry == enemies[i].y){
                        return;
                    }
                    for(var j = 0; j < d.length; j++){
                        if(rx == enemies[i].x + d[j].x && ry == enemies[i].y + d[j].y){
                            return;
                        }
                    }
                }

                var prob = []; // probabillity: 確率
                prob = ry < H - 3 ? [11, 11, 11, 11, 11, 13, 13, 13, 13, 15] : [11, 11, 11, 13, 13, 13, 15, 15, 15, 15];
                if(clock.day >= 7){
                    prob[4] = 7;
                    prob[8] = 7;
                }
                switch(prob[random(prob.length)]){
                    case itemObj.stone.id:
                        items[items.length] = new Item(itemObj.stone.hp, itemObj.stone.quantity + random(5));
                        stage[ry][rx] = itemObj.stone.id;
                    break;
                    case itemObj.tree.id:
                        items[items.length] = new Item(itemObj.tree.hp, itemObj.tree.quantity + random(5));
                        stage[ry][rx] = itemObj.tree.id;
                    break;
                    case itemObj.jewel.id:
                        items[items.length] = new Item(itemObj.jewel.hp, itemObj.jewel.quantity + random(3));
                        stage[ry][rx] = itemObj.jewel.id;
                    break;
                }

                flag = true;
            }
        }, random(30) * 100);

        this.time = 0;
    }

    this.paint = function(){
        drawFill(this.x * scale + 1, this.y * scale + 1, scale - 1, scale - 1, this.color)
    }
}

/*
/* トラップオブジェクト /*
*/
function Trap(x, y, name){
    this.x = x;
    this.y = y;
    this.name = name;
}

/*
/* 時計オブジェクト /*
*/
function Clock(){
    this.time = 0;
    this.day = 1;
    this.dayLength = fps * 80;
    this.nightLength = fps * 40;
    this.clearDay = 10;

    this.update = function(){
        if(this.day > this.clearDay){
            status = GAMECLEAR;
        }

        this.time++;

        if(timeZone != NIGHT){
            if(this.time > this.dayLength){
                this.time = 0;
                timeZone = NIGHT;
                sound.playSound();
            } else if(this.time > 2 * this.dayLength / 3){
                timeZone = EVENING;
            } else if(this.time > this.dayLength / 3){
                timeZone = NOON;
            }
        } else {
            if(this.time > this.nightLength){
                this.time = 0;
                this.day++;
                timeZone = MORNING;
                sound.playSound();
            }
        }

        if(this.time >= this.dayLength - fps * 1|| this.time >= this.nightLength - fps * 1){
            if(fout == null){
                fout = setInterval(sound.fadeout, 100);
            }
        }

        if(status == GAMECLEAR){sound.stopSound();}
    }

    this.paint = function(){
        // バー
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(scale / 2, scale / 2);
        ctx.lineTo(scale * (W - 3) + scale / 2, scale / 2);
        ctx.stroke();

        // 太陽or月
        var cx;
        if(timeZone != NIGHT){
            cx = (scale / 2) + (scale * (W - 3) * (this.time / this.dayLength));
            drawCircle(cx, scale / 2, scale / 3, "rgba(255, 155, 0, 0.85)");
        } else {
            cx = (scale / 2) + (scale * (W - 3) * (this.time / this.nightLength));
            drawCircle(cx, scale / 2, scale / 3, "rgba(255, 255, 0, 0.75)");
        }

        // 「Day: 」
        drawText(scale * (W - 2), scale * 0.8, "rgba(255, 255, 255, 0.75)", scale * 0.4 + "px Lato", "Day: ");

        // 日付
        drawText(this.day < 10 ? scale * (W - 0.72) : scale * (W - 1.19), scale * 0.9, "rgba(255, 255, 255, 0.85)", scale * 0.8 + "px Lato", this.day);
    }
}

/*
/* オーディオオブジェクト /*
*/
function Sound(){
    this.audios = {
        daremo_inai: {src: "./audio/daremo_inai_hukei.mp3"},
        syumatsu: {src: "./audio/syumatsu.mp3"}
    };

    this.init = function(){
        bgm.preload = "auto";
        bgm.load();

        bgm.addEventListener("ended", function(){
            bgm.currentTime = 0;
            bgm.play();
        }, false);
    }

    this.playSound = function(){
        this.stopSound();

        bgm.src = timeZone != NIGHT ? this.audios.daremo_inai.src : this.audios.syumatsu.src;
        bgm.loop = true;
        bgm.volume = 0;
        bgm.play();
        fin = setInterval(this.fadein, 300);
    }

    this.stopSound = function(){
        bgm.pause();
        bgm.currentTime = 0;
        console.log("stop");
    }

    this.fadein = function(){
        if(bgm.volume >= 0.9){
            bgm.volume = 1;
            clearInterval(fin);
            fin = null;
        } else {
            bgm.volume += 0.1;
        }
    }

    this.fadeout = function(){
        if(bgm.volume <= 0.1){
            bgm.volume = 0;
            clearInterval(fout);
            fout = null;
        } else {
            bgm.volume -= 0.1;
        }
    }
}

/*
/* スタートメニューオブジェクト /*
*/
function StartMenu(){
    this.mx = 0.5;
    this.my = 0.5;
    this.mw = W - 1;
    this.mh = H - 1;
    this.lineSpace = 0.2;
    this.frameH = NaN;
    this.scene = NaN, this.init = 0, this.tutorial = 1, this.survivor = 2, this.credit = 3;

    this.unitSpace = {
        x: NaN,
        y: NaN,
        w: NaN,
        h: NaN
    };

    this.units = {
        start: {position: {x: NaN, y: NaN, w: NaN, h: NaN}, method: gameStart},
        tutorial: {position: {x: NaN, y: NaN, w: NaN, h: NaN}, method: tutorial},
        survivor: {position: {x: NaN, y: NaN, w: NaN, h: NaN}, method: getSurvivor},
        credit: {position: {x: NaN, y: NaN, w: NaN, h: NaN}, method: credit},
    };

    this.backBtnPosition = {
        x: 3, y: H - 2, w: 1, h: 1
    };

    this.survCount = 0;
    this.survBtnPosition = {
        x: [1, W - 2], y: H - 2, w: 1, h: 1
    };

    this.mulScale = function(){
        this.mx *= scale;
        this.my *= scale;
        this.mw *= scale;
        this.mh *= scale;
        this.lineSpace *= scale;
        this.frameH = (this.mh - this.lineSpace * 7) / 6;

        this.unitSpace.x = this.mx + this.lineSpace;
        this.unitSpace.y = this.my + this.lineSpace;
        this.unitSpace.w = this.mw - this.lineSpace * 2;
        this.unitSpace.h = this.frameH;

        this.backBtnPosition.x *= scale;
        this.backBtnPosition.y *= scale;
        this.backBtnPosition.w *= scale;
        this.backBtnPosition.h *= scale;

        this.survBtnPosition.x[0] *= scale;
        this.survBtnPosition.x[1] *= scale;
        this.survBtnPosition.y *= scale;
        this.survBtnPosition.w *= scale;
        this.survBtnPosition.h *= scale;
    }

    this.indicateStartMenu = function(){
        this.scene = this.init;
        this.survCount = 0;
        repaint();

        for(var i = 0; i < Object.keys(this.units).length; i++){
            var position = this.units[Object.keys(this.units)[i]].position;
            position.x = this.unitSpace.x;
            position.y = this.unitSpace.y + (this.frameH + this.lineSpace) * (i + 2);
            position.w = this.unitSpace.w;
            position.h = this.unitSpace.h;

            drawFill(position.x, position.y, position.w, position.h, "rgba(255, 255, 255, 0.3)");
        }
        
        drawLine(scale * 0.8, scale * 1, scale * (W - 0.8), scale * 1, "white", 1);
        drawText(scale * 0.78, scale * 1.8, "crimson", scale * 0.6 + "px Lato", "10日間");
        drawText(scale * 0.78, scale * 2.65, "crimson", scale * 0.6 + "px Lato", "タワーディフェンス");
        drawLine(scale * 0.8, scale * 3, scale * (W - 0.8), scale * 3, "white", 1);

        drawText(scale * 2.1, scale * 4.55, "white", scale * 0.7 + "px Lato", "スタート");
        drawText(scale * 1.05, scale * 6, "white", scale * 0.7 + "px Lato", "チュートリアル");
        drawText(scale * 1.4, scale * 7.45, "white", scale * 0.7 + "px Lato", "生存者リスト");
        drawText(scale * 1.75, scale * 8.9, "white", scale * 0.7 + "px Lato", "クレジット");
    }

    this.do = function(mx, my){
        if(this.scene == this.init){
            for(var i = 0; i < Object.keys(this.units).length; i++){
                var unit = this.units[Object.keys(this.units)[i]];
                var position = unit.position;
                var method = unit.method;
                if(position.x <= mx && mx <= position.x + position.w && position.y <= my && my <= position.y + position.h){
                    method();
                }
            }
        } else {
            if(this.backBtnPosition.x <= mx && mx <= this.backBtnPosition.x + this.backBtnPosition.w && this.backBtnPosition.y <= my && my <= this.backBtnPosition.y + this.backBtnPosition.h){
                this.indicateStartMenu();
            }

            if(this.survBtnPosition.x[0] <= mx && mx <= this.survBtnPosition.x[0] + this.survBtnPosition.w && this.survBtnPosition.y <= my && my <= this.survBtnPosition.y + this.survBtnPosition.h){
                this.survCount >= 1 ? this.survCount-- : this.survCount = 0;
                this.units.survivor.method();
            }
            if(this.survBtnPosition.x[1] <= mx && mx <= this.survBtnPosition.x[1] + this.survBtnPosition.w && this.survBtnPosition.y <= my && my <= this.survBtnPosition.y + this.survBtnPosition.h){
                this.survCount++;
                this.units.survivor.method();
            }
        }
    }
}

function tutorial(){
    menu.scene = menu.tutorial;
    repaint();

    drawText(scale * 1, scale * 2, "red", scale * 0.9 + "px Lato", "鋭意制作中!!");
}

function getSurvivor(){
    menu.scene = menu.survivor;
    readData("survivor", survivor);
}

function survivor(json){
    repaint();

    drawText(scale * 1, scale * 2, "white", scale * 0.6 + "px Lato", "生存者数: ");
    drawText(scale * 4, scale * 2, "white", scale * 1.2 + "px Lato", json.number[0]);

    drawFill(menu.survBtnPosition.x[0], menu.survBtnPosition.y, menu.survBtnPosition.w, menu.survBtnPosition.h, "rgba(255, 255, 255, 0.1)");
    drawFill(menu.survBtnPosition.x[1], menu.survBtnPosition.y, menu.survBtnPosition.w, menu.survBtnPosition.h, "rgba(255, 255, 255, 0.1)");

    drawText(scale * 1, scale * (H - 1.05), "white", scale * 1.15 + "px Lato", "◀");
    drawText(scale * (W - 2.15), scale * (H - 1.05), "white", scale * 1.15 + "px Lato", "▶");

    var survivors = json.username;
    menu.survCount = menu.survCount > Math.ceil(survivors.length / 8) - 1 ? menu.survCount = Math.ceil(survivors.length / 8) - 1 : menu.survCount;
    var sCount = menu.survCount;
    var len = survivors.length - sCount * 8 > 8 ? 8 : survivors.length - sCount * 8;
    for(var i = 0; i < len; i++){
        drawText(scale * 1, scale * (2.8 + i * 0.7), "white", scale * 0.38 + "px Lato", "・ " + survivors[i + (sCount * 8)]);
    }
}

function credit(){
    menu.scene = menu.credit;
    repaint();

    drawText(scale * 1, scale * 2, "white", scale * 0.4 + "px Lato", "作った人：　モリタ");
    drawText(scale * 1, scale * 3, "white", scale * 0.4 + "px Lato", "使用素材：　ドット絵世界");
    drawText(scale * 3.4, scale * 4, "white", scale * 0.4 + "px Lato", "ぴぽや倉庫");
    drawText(scale * 1, scale * 5, "white", scale * 0.4 + "px Lato", "使用楽曲：　Dova-syndrome");
}

/*
/* 初期化処理 /*
*/
function init(){    
    readData("initial", setData);
}

/*
/* ゲームスタート /*
*/
function gameStart(){
    status = GAME;
    timer = setInterval(main, 1000 / fps);
    sound.playSound();
}

/*
/* メインルーチン /*
*/
function main(){
    for(var i = 0; i < enemies.length; i++){
        enemies[i].update();
    }
    player.update();
    items.update();
    clock.update();
    repaint();
}

/*
/* データ読み込み /*
*/
function readData(address, callback){
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "./Ajax.php?d=" + address, true);
    xhr.responseType = "json";
    xhr.send();
    xhr.onreadystatechange = function(){
        if(xhr.readyState === 4 && xhr.status === 200){
            callback(xhr.response);
        }
    }
}

/*
/* データ送信 /*
*/
function sendData(u){
    var form = new FormData();
    form.append("username", u);

    var xhr = new XMLHttpRequest();
    xhr.open("POST", "./Ajax.php", true);
    xhr.responseType = "json";
    xhr.send(form);
    xhr.onreadystatechange = function(){
        if(xhr.readyState === 4 && xhr.status === 200){
            if(!xhr.response){
                alert("...申し訳ございません\n...データの保存に失敗しました");
            }
        }
    }
}

/*
/* 初期化処理 /*
*/
function setData(json){
    if(!json){
        var body = document.querySelector("body");
        var canvas = document.getElementById("stage");
        var message = document.createElement("div");
        message.innerHTML = "<h1>初期データの読み込みに失敗しました</h1>";
        body.insertBefore(message, canvas);
        body.style.backgroundColor = "white";
        return;
    }

    // ステージ初期化
    var stageData = json.stage;

    H = stageData.length;
    W = stageData[0].length;
    
    for(var y = 0; y < H; y++){
        stage[y] = [];
        for(var x = 0; x < W; x++){
            stage[y][x] = stageData[y][x];

            if(stageData[y][x] == stageObj.base.id){
                basePoint.y = y;
                basePoint.x = x;
            }

            if(stageData[y][x] == stageObj.enemyBase.id){
                eBasePoint.y = y;
                eBasePoint.x = x;
            }
        }
    }
    
    // 主人公初期化
    player = new Player(3, 3, 200, 10);

    // 敵初期化
    for(var i = 0; i < 2; i++){
        var id = json.enemy[0].id[0];
        var hp = json.enemy[0].hp[0];
        var attack = json.enemy[0].attack[0];
        var speed = json.enemy[0].speed[0];
        var route = json.route[i];
        enemies[i] = new Enemy(id, eBasePoint.x, eBasePoint.y, hp, attack, speed, route);
    }
    for(var i = 0; i < 2; i++){
        var id = json.enemy[1].id[0];
        var hp = json.enemy[1].hp[0];
        var attack = json.enemy[1].attack[0];
        var speed = json.enemy[1].speed[0];
        var route = json.route[i + 2];
        enemies[i + 2] = new Enemy(id, eBasePoint.x, eBasePoint.y, hp, attack, speed, route);
    }
    for(var i = 0; i < 1; i++){
        var id = json.enemy[2].id[0];
        var hp = json.enemy[2].hp[0];
        var attack = json.enemy[2].attack[0];
        var speed = json.enemy[2].speed[0];
        var route = json.route[i + 4];
        enemies[i + 4] = new Enemy(id, eBasePoint.x, eBasePoint.y, hp, attack, speed, route);
    }

    // アイテム初期化
    items = new Item();

    // 時計初期化
    clock = new Clock();

    // オーディオオブジェクト初期化
    sound = new Sound();
    bgm = new Audio();
    sound.init();

    // メニュー初期化
    menu = new StartMenu();

    timeZone = MORNING;

    status = MENU;

    setCanvas();
}

/*
/* キャンバスをセット /*
*/
function setCanvas(){
    canvas = document.getElementById("stage");
    ctx = canvas.getContext("2d");

    var cW = document.documentElement.clientWidth;
    var cH = document.documentElement.clientHeight;
    if(cW * 10 / 7 >= cH){
        canvas.width = cH * 7 / 10;
        canvas.height = cH;
    } else {
        canvas.width = cW;
        canvas.height = cW * 10 / 7;
    }

    scale = canvas.width / W;

    menu.mulScale();

    var flag = cW < 600 ? (cH - scale * H > 200 ? 1 : 2) : 3;
    if(flag == 1){
        var controller = document.getElementById("controller");
        controller.style.display = "flex";
        var button = controller.querySelectorAll("button");
        for(var i = 0; i < button.length; i++){
            button[i].style.width = (cW / 3.5) + "px";
            button[i].style.height = ((cH - scale * H - 15) / 3.5) + "px";
            button[i].style.fontSize = scale / 2 + "px";
        }
    }
    setControl(flag);
}

/*
/* キーコンフィグ /*
*/
function setControl(flag){
    switch(flag){
        case 1:
            canvas.addEventListener("touchstart", mymousedown);
            canvas.addEventListener("touchend", mykeyup);
    
            var buttons = [["up", up], ["down", down], ["left", left], ["right", right], ["aButton", aButton], ["bButton", bButton]];
            for(var i = 0; i < buttons.length; i++){
                var button = document.getElementById(buttons[i][0]);
                button.onmousedown = buttons[i][1];
                button.onmouseup = mykeyup;
                button.addEventListener("touchstart", buttons[i][1]);
                button.addEventListener("touchend", mykeyup);
            }
        break;
        case 2:
            canvas.addEventListener("touchstart", mymousedown);
            canvas.addEventListener("touchend", mykeyup);
        break;
        case 3:
            window.onkeydown = mykeydown;
            window.onkeyup = mykeyup;
        
            canvas.onmousedown = mymousedown;
            canvas.onmouseup = mykeyup;
        break;
    }

    canvas.oncontextmenu = function(e){
        e.preventDefault();
    };

    setImgs();
    document.querySelectorAll("img").onload = menu.indicateStartMenu();
}

/*
/* 画像ファイルセット /*
*/
function setImgs(){
    var imgs = [
        "Cave1-EarthB",
        "DeepForest-A2",
        "DeepForest-A5",
        "DeepForest-B",
        "openbook1b",
        "pipo-charachip018",
        "pipo-simpleenemy01a",
        "pipo-simpleenemy01b",
        "pipo-simpleenemy01g",
        "Village1-C"
    ];

    var imgArr = {
        elem: "img",
        srcHeader: "./img/",
        srcFooter: ".png",
        display: "none"
    };

    var body = document.querySelector("body");
    for(var i = 0; i < imgs.length; i++){
        var img;
        img = document.createElement(imgArr.elem);
        img.id = imgs[i];
        img.src = imgArr.srcHeader + imgs[i] + imgArr.srcFooter;
        img.style.display = imgArr.display;
        body.appendChild(img);
    }
}

/*
/* 描画処理 /*
*/
function repaint(){
    // 背景クリア
    drawFill(0, 0, scale * W, scale * H, "black");

    // ステージ・アイテム描画
    var imgs = document.querySelectorAll("img");
    imgs[imgs.length - 1].onload = repaintMap();
}

function repaintMap(){
    for(var x = 0; x < W; x++){
        for(var y = 0; y < H; y++){
            if(true){
                var ground = document.getElementById(stageObj.ground.src);
                drawMap(ground, 0, 0, x, y);
            }
            if(stage[y][x] == stageObj.wall.id){
                var wall = document.getElementById(stageObj.wall.src);
                drawMap(wall, 1, 10, x, y);
            }
            if(stage[y][x] == stageObj.rock.id){
                var rock = document.getElementById(stageObj.rock.src);
                drawMap(rock, 13, 14, x, y);
            }

            if(stage[y][x] == itemObj.stone.id){
                var stone = document.getElementById(itemObj.stone.src);
                drawMap(stone, 5, 2, x, y);
            }
            if(stage[y][x] == itemObj.tree.id){
                var tree = document.getElementById(itemObj.tree.src)
                ctx.drawImage(tree, 32 * 4, 32 * 10, 64, 64, x * scale + 1, y * scale + 1, scale - 1, scale - 1);
            }
            if(stage[y][x] == itemObj.jewel.id){
                var jewel = document.getElementById(itemObj.jewel.src);
                drawMap(jewel, 9, 10, x, y);
            }

            if(stage[y][x] == stageObj.base.id){
                var base = document.getElementById(stageObj.base.src);
                drawMap(base, 1, 0, x, y);
            }
            if(stage[y][x] == stageObj.enemyBase.id){
                var enemyBase = document.getElementById(stageObj.enemyBase.src);
                drawMap(enemyBase, 4, 11, x, y);
            }
        }
    }
    if(timeZone == NIGHT){
        drawFill(0, 0, scale * W, scale * H, "rgba(0, 0, 0, 0.5)");
    }

    repaintEtc();
}

function repaintEtc(){
    var scrollX, scrollY;

    if(status == GAME && clock.time % (fps / 2) == 0){
        var stepArr = [1, 0, 1, 2];
        direction.count++;
        direction.count %= stepArr.length;
        direction.step = stepArr[direction.count];
    }

    // 敵描画
    for(var i = 0; i < enemies.length; i++){
        var enemyImg = document.getElementById(enemies[i].src[enemies[i].id - 1]);
        scrollX = enemies[i].getScrollX();
        scrollY = enemies[i].getScrollY();
        if(!(enemies[i].x == eBasePoint.x && enemies[i].y == eBasePoint.y && timeZone != NIGHT)){
            enemies[i].paint(enemyImg, direction.step, enemies[i].dir, scrollX, scrollY);
        }
    }

    // 主人公描画
    var playerImg = document.getElementById(player.src);
    scrollX = player.getScrollX();
    scrollY = player.getScrollY();
    player.paint(playerImg, direction.step, player.dir, scrollX, scrollY);

    // 時計描画
    clock.paint();

    if(status == MENU){
        drawFill(menu.mx, menu.my, menu.mw, menu.mh, "rgba(0, 0, 0, 0.9)");
        if(menu.scene != menu.init){
            drawFill(menu.backBtnPosition.x, menu.backBtnPosition.y, menu.backBtnPosition.w, menu.backBtnPosition.h, "rgba(255, 255, 255, 0.1)");
            drawText(scale * 2.98, scale * (H - 0.9), "white", scale * 1.8 + "px Lato", "×");
        }
    } else if(status == GAMECLEAR){
        // ゲームクリア時の演出
        drawText(10, scale * H / 2, "red", "bold " + scale * 1.1 + "px Lato", "ゲームクリア");
        clearInterval(timer);
        setTimeout(function(){
            clearAnnounce();
            reload();
        }, 3000);
    } else if(status == GAMEOVER){
        // ゲームオーバー時の演出
        clearInterval(timer);
        drawFill(scale * 0.5, scale * 2.5, scale * (W - 1), scale * (H - 5), "rgba(0, 0, 0, 0.9)");
        drawText(scale * 1, scale * 4, "blue", "bold " + scale * 0.72 + "px Lato", "ゲームオーバー");
        drawText(scale * 0.75, scale * 6, "red", scale * 0.35 + "px Lato", "画面をクリックまたはタッチすると");
        drawText(scale * 0.75, scale * 7, "red", scale * 0.35 + "px Lato", "メニューに戻ります");
    }
}

/*
/* ゲームクリア者の記録（任意） /*
*/
function clearAnnounce(){
    var messages = {
        congratulation: "ゲームクリア！\nおめでとうございます！！",
        questionOne: "生き残った暁に、名を刻んでいくことができます…",
        whatsYourName: "あなたの名前は？\n・10文字まで\n・半角英数字、ひらがな、カタカナ、漢字のみ使用できます",
        questionTwo: " 様でよろしいですか？",
        recorded: " 様のデータを記録しました\nメニューから生存者リストを開いて確認できます",
        questionThree: "名前の記録をやめますか？",
        goodBye: "遊んでいただきありがとうございました！"
    };

    window.alert(messages.congratulation);
    var answerOne = window.confirm(messages.questionOne);
    if(answerOne){
        record();
    } else {
        bye("");
    }

    function record(){
        var flag = false;
        while(!flag){
            var user = "";
            user = window.prompt(messages.whatsYourName, "ユーザーネーム");
            if(user){
                var textCheck = regexp(user);
                if(textCheck){
                    alert(textCheck);
                    continue;
                }

                var answerTwo = window.confirm(user + messages.questionTwo);
                if(answerTwo){
                    window.alert(user + messages.recorded);
                    flag = bye(user);
                }
            } else {
                var answerThree = window.confirm(messages.questionThree);
                if(answerThree){
                    flag = bye("");
                }
            }
        }
    }

    function bye(user){
        sendData(user);
        window.alert(messages.goodBye);
        return true;
    }

    function regexp(user){
        var usrlen = user.length;
        var maxlen = 10;
        var warning = ["文字数が長すぎます", "無効な文字が入力されています"];

        if(usrlen > maxlen){return warning[0];}
        for(var i = 0; i < usrlen; i++){
            if(!(user.charAt(i).match(/[a-zA-Z0-9０-９亜-熙ぁ-んァ-ヶー～]/))){
                return warning[1];
            }
        }
        return false;
    }
}

/*
/* キー&マウス押下のイベントハンドラ /*
*/
function mykeydown(e){
    keyCode = e.keyCode;
}

function mykeyup(){
    keyCode = 0;
}

function mymousedown(e){
    var target = e.target || e.srcElement,
    rect = target.getBoundingClientRect(),
    offsetX = e.clientX - rect.left,
    offsetY = e.clientY - rect.top;

    var mouseX = !isNaN(offsetX) ? offsetX : e.touches[0].clientX;
    var mouseY = !isNaN(offsetY) ? offsetY : e.touches[0].clientY;

    if(status == GAME){
        playerController(mouseX, mouseY);
    } else if(status == MENU){
        menu.do(mouseX, mouseY);
    } else if(status == GAMEOVER){
        reload();
    }
}

function playerController(mx, my){
    mx -= (player.x * scale + scale / 2);
    my -= (player.y * scale + scale / 2);
    if(Math.abs(mx) > Math.abs(my)){
        keyCode = mx < 0 ? 37 : 39;
    } else {
        keyCode = my < 0 ? 38 : 40;
    }
}

function up(){mykeydown({keyCode: 38});}
function down(){mykeydown({keyCode: 40});}
function left(){mykeydown({keyCode: 37});}
function right(){mykeydown({keyCode: 39});}
function aButton(){return;}
function bButton(){return;}

/*
/*汎用メソッド/*
*/
function drawFill(x, y, w, h, color){
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawStroke(x, y, w, h, color, lw){
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.strokeRect(x, y, w, h);
}

function drawText(x, y, color, font, text){
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.fillText(text, x, y);
}

function drawCircle(x, y, r, color){
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

function drawLine(x, y, x2, y2, color, lw){
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawMap(image, sx, sy, dx, dy){
    ctx.drawImage(image, 32 * sx, 32 * sy, 32, 32, dx * scale + 1, dy * scale + 1, scale - 1, scale - 1);
}

function random(v){
    return Math.floor(Math.random() * v);
}

function reload(){
    window.location.reload();
}