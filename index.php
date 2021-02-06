<!DOCTYPE html>
<html lang="ja">
    <head>
        <meta charset="UTF-8">
        <title>TowerDefense</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="./style.css">
        <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Noto+Sans+JP:wght@400;700&display=swap" rel="stylesheet">
    </head>
    <body>
        <canvas id="stage"></canvas>
        <table id="controller">
            <tr>
                <td><button id="bButton">B</button></td>
                <td><button id="up">U</button></td>
                <td><button id="aButton">A</button></td>
            </tr>
            <tr>
                <td><button id="left">L</button></td>
                <td></td>
                <td><button id="right">R</button></td>
            </tr>
            <tr>
                <td></td>
                <td><button id="down">D</button></td>
                <td></td>
            </tr>
        </table>
        <audio src="./audio/syumatsu.mp3"></audio>
        <script src="./script.js"></script>
    </body>
</html>