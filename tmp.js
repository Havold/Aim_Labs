import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as dat from "dat.gui";
import { Wireframe } from "three/examples/jsm/Addons.js";
import { any, cameraPosition } from "three/examples/jsm/nodes/Nodes.js";
import { createNoise2D } from "simplex-noise";
import * as TWEEN from "@tweenjs/tween.js";
import { MTLLoader } from "three/examples/jsm/Addons.js";
import { OBJLoader } from "three/examples/jsm/Addons.js";

var scene, camera, renderer, mesh, loadingManager;
var ambientLight, light;
var meshFloor;
var crate, crateTexture, crateNormalMap, crateBumpMap;

var keyboard = {};
var player = { height: 1.8, speed: 0.2, turnSpeed: Math.PI * 0.02 };

var loadingScreen = {
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 100),
    box: new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        new THREE.MeshBasicMaterial({ color: 0x4444ff })
    )
}


var RESOURCES_LOADED = false;
    

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);

    loadingScreen.box.position.set(0, 0, 5);
    loadingScreen.camera.lookAt(loadingScreen.box.position);
    loadingScreen.scene.add(loadingScreen.box);

    loadingManager = new THREE.LoadingManager();

    loadingManager.onProgress = function(item, loaded, total) {
        console.log(item, loaded, total);
    };

    loadingManager.onLoad = function() {
        console.log("loaded all resources");
        RESOURCES_LOADED = true;
    }


    mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshPhongMaterial({ color: 0xff4444, wireframe: false })
    );
    mesh.position.y += mesh.geometry.parameters.height / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    meshFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10, 10, 10),
        new THREE.MeshPhongMaterial({ color: 0xffffff, wireframe: false })
    );
    meshFloor.rotation.x -= Math.PI / 2;
    meshFloor.receiveShadow = true;
    scene.add(meshFloor);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    light = new THREE.PointLight(0xffffff, 30, 18);
    light.position.set(-3, 6, -3);
    light.castShadow = true;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 25;
    scene.add(light);

    var textureLoader = new THREE.TextureLoader(loadingManager);
    crateTexture = textureLoader.load('./assets/crate/crate0_diffuse.png');
    crateBumpMap = textureLoader.load('./assets/crate/crate0_bump.png');
    crateNormalMap = textureLoader.load('./assets/crate/crate0_normal.png');
    
    crate = new THREE.Mesh(
        new THREE.BoxGeometry(3, 3, 3),
        new THREE.MeshPhongMaterial({ 
            color: 0xffffff,
            wireframe: false, 
            map: crateTexture,
            bumpMap: crateBumpMap,
            normalMap: crateNormalMap
         }),
    );
    crate.position.set(2, 3 / 2, 2);
    scene.add(crate);

    
    var mtlLoader = new MTLLoader(loadingManager);
    mtlLoader.load('./assets/models/tree-pine-small.mtl', function(materials) {
        materials.preload();
        var objLoader = new OBJLoader(loadingManager);
        objLoader.setMaterials(materials);

        objLoader.load('./assets/models/tree-pine-small.obj', function(mesh) {
            // OBJ được làm từ nhiều mesh nhỏ, dùng mesh.traverse(...) giúp ta có thể 
            // đi qua từng component và thêm thuộc tính (propeties), ví dụ như shadow.
            mesh.traverse(function(node) {
                if (node instanceof THREE.Mesh) {
                    node.castShadow = true;
                    node.receiveShadow = true; // dùng reviesShadow để cho phép nhận bóng trên chính nó
                }
            }); 
            
            scene.add(mesh);
            mesh.position.set(-3,0, 4);
            mesh.scale.set(6, 6, 6);
        });
    });


    camera.position.set(0, player.height, -5);
    camera.lookAt(new THREE.Vector3(0, player.height, 0));

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;

    document.body.appendChild(renderer.domElement);
    animate();
}

function animate() {
    if (RESOURCES_LOADED == false) {
        requestAnimationFrame(animate);
        loadingScreen.box.position.x -= 0.05;
    
        if (loadingScreen.box.position.x < -10) 
            {loadingScreen.box.position.x = 10;}
        loadingScreen.box.position.y = Math.sin(loadingScreen.box.position.x)

        renderer.render(loadingScreen.scene, loadingScreen.camera);
        return;
    }

    requestAnimationFrame(animate);

    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.02;

    if (keyboard[87]) { // W key
        camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
        camera.position.z -= -Math.cos(camera.rotation.y) * player.speed;
    }
    if (keyboard[83]) { // S key
        camera.position.x += Math.sin(camera.rotation.y) * player.speed;
        camera.position.z += -Math.cos(camera.rotation.y) * player.speed;
    }

    if (keyboard[65]) { // A key
        camera.position.x += Math.sin(camera.rotation.y + Math.PI / 2) * player.speed;
        camera.position.z += -Math.cos(camera.rotation.y + Math.PI / 2) * player.speed;
    }

    if (keyboard[68]) { // D key
        camera.position.x += Math.sin(camera.rotation.y - Math.PI / 2) * player.speed;
        camera.position.z += -Math.cos(camera.rotation.y - Math.PI / 2) * player.speed;
    }

    if (keyboard[37]) { // left arrow key
        camera.rotation.y -= player.turnSpeed;
    }

    if (keyboard[39]) { // right arrow key
        camera.rotation.y += player.turnSpeed;
    }   

    renderer.render(scene, camera);
}

function keyDown(event) {
    keyboard[event.keyCode] = true;
}

function keyUp(event) {
    keyboard[event.keyCode] = false;
}

window.addEventListener("keydown", keyDown);
window.addEventListener("keyup", keyUp);

window.onload = init;