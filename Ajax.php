<?php

$data = "";
if(isset($_GET["d"])){
    $data = htmlspecialchars($_GET["d"]);
    if($data == "initial"){getInitialData();}
    if($data == "survivor"){getClearData();}
}

$username = "";
if(isset($_POST["username"])){
    $username = htmlspecialchars($_POST["username"]);
    setClearData($username);
}

/*
/* 初期データ取得 /*
*/
function getInitialData(){
    $filename = "initialData.xml";
    $xml = new SimpleXMLElement("./data/{$filename}", 0, true);

    if($xml){
        $dataArr = $xml -> initialData;

        $type = $dataArr -> enemy -> status -> type;
        for($i = 0; $i < count($type); $i++){
            $result["enemy"][$i]["id"] = $type[$i] -> id;
            $result["enemy"][$i]["hp"] = $type[$i] -> hp;
            $result["enemy"][$i]["attack"] = $type[$i] -> attack;
            $result["enemy"][$i]["speed"] = $type[$i] -> speed;
        }
    
        $stageRow = $dataArr -> stage -> row;
        for($i = 0; $i < count($stageRow); $i++){
            $r = $stageRow[$i];
            $result["stage"][$i] = explode(",", $r);
        }
    
        $route = $dataArr -> route;
        for($i = 0; $i < count($route); $i++){
            $result["route"][$i] = [];
            $routeRow = $route[$i] -> row;
            for($j = 0; $j < count($routeRow); $j++){
                $r = $routeRow[$j];
                $result["route"][$i][$j] = explode(",", $r);
            }
        }

        echo json_encode($result);
    } else {
        echo json_encode(false);
    }
}

/*
/* クリア者データ取得 /*
*/
function getClearData(){
    $filename = "clearPlayersData.xml";
    $xml = new SimpleXMLElement("./data/{$filename}", 0, true);

    if($xml){
        $dataArr = $xml -> clearPlayersData;

        $result["number"] = $dataArr -> number;

        $username = $dataArr -> username;
        $result["username"] = explode(",", $username);

        echo json_encode($result);
    } else {
        echo json_encode(false);
    }
}

/*
/* クリア者データ記録 /*
*/
function setClearData($username){    
    $filename = "clearPlayersData.xml";
    $xml = new SimpleXMLElement("./data/{$filename}", 0, true);

    if($xml){
        $dataArr = $xml -> clearPlayersData;
        $numberTag = $dataArr -> number;
        $usernameTag = $dataArr -> username;

        if($numberTag[0] != "" && $numberTag[0] != null){
            $numberTag[0] += 1;
        } else {
            $numberTag[0] = 1;
        }

        if($username != "" && $username != null){
            $u = explode(",", $usernameTag[0]);
            $u[] = $username;
            $users = implode(",", $u);
            if(strpos($users, ",") === 0){
                $users = substr($users, 1);
            }
            $usernameTag[0] = $users;
        }

        $file = @fopen("./data/{$filename}", "w");
        @fwrite($file, $xml -> asXML());
        @fclose($file);

        echo json_encode(true);
    } else {
        echo json_encode(false);
    }
}

?>