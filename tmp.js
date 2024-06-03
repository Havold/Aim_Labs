import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as dat from "dat.gui";
import { Wireframe } from "three/examples/jsm/Addons.js";
import { any, cameraPosition } from "three/examples/jsm/nodes/Nodes.js";
import { createNoise2D } from "simplex-noise";
import * as TWEEN from "@tweenjs/tween.js";
import { MTLLoader } from "three/examples/jsm/Addons.js";
import { OBJLoader } from "three/examples/jsm/Addons.js";
import { DirectionalLightHelper } from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";

var scene, camera, renderer, mesh, loadingManager, controls;
var directionLight;
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

var isJumping = false;
var jumpVelocity = 0;

var RESOURCES_LOADED = false;

// Models index
var models = {
    tree: {
        obj: './assets/models/tree-pine-small.obj',
        mtl: './assets/models/tree-pine-small.mtl',
        mesh: null
    },
    rock: {
        obj: './assets/models/rocks.obj',
        mtl: './assets/models/rocks.mtl',
        mesh: null
    },
    stones: {
        obj: './assets/models/stones.obj',
        mtl: './assets/models/stones.mtl',
        mesh: null
    }
};

// Meshes index
var meshes = {};


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
        onResourcesLoaded();
    }

    // manipulate materials
    // load the cube map
    var path = '/assets/cube/sun/'
    var format = '.jpg';
    var urls = [
        path + 'px' + format, path +'nx' + format,
        path + 'py' + format, path +'ny' + format,
        path + 'pz' + format, path +'nz' + format,
    ];
    var reflectionCube = new THREE.CubeTextureLoader().load(urls);
    reflectionCube.format = THREE.RGBAFormat;
    scene.background = reflectionCube;

    mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshPhongMaterial({ color: 0xff4444, wireframe: false })
    );
    mesh.position.y += mesh.geometry.parameters.height / 2;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    meshFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 100, 10, 10),
        new THREE.MeshPhongMaterial({ color: 0xffffff, wireframe: false })
    );
    meshFloor.rotation.x -= Math.PI / 2;
    meshFloor.receiveShadow = true;
    scene.add(meshFloor);

    ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    directionLight = getDirectionLight(0.5);
    directionLight.position.set(-10, 20, -2);
    directionLight.target.position.set(0, 0, 0);
    directionLight.castShadow = true;
    directionLight.shadow.camera.near = 0.1;
    directionLight.shadow.camera.far = 25;
    directionLight.shadow.camera.left = -50;
    directionLight.shadow.camera.right = 50;
    directionLight.shadow.camera.top = 50;
    directionLight.shadow.camera.bottom = -50;
    directionLight.shadow.mapSize.width = 5120;
    directionLight.shadow.mapSize.height = 5120;
    scene.add(directionLight);
    

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

    
    // var mtlLoader = new MTLLoader(loadingManager);
    // mtlLoader.load('./assets/models/tree-pine-small.mtl', function(materials) {
    //     materials.preload();
    //     var objLoader = new OBJLoader(loadingManager);
    //     objLoader.setMaterials(materials);

    //     objLoader.load('./assets/models/tree-pine-small.obj', function(mesh) {
    //         // OBJ được làm từ nhiều mesh nhỏ, dùng mesh.traverse(...) giúp ta có thể 
    //         // đi qua từng component và thêm thuộc tính (propeties), ví dụ như shadow.
    //         mesh.traverse(function(node) {
    //             if (node instanceof THREE.Mesh) {
    //                 node.castShadow = true;
    //                 node.receiveShadow = true; // dùng reviesShadow để cho phép nhận bóng trên chính nó
    //             }
    //         }); 
            
    //         scene.add(mesh);
    //         mesh.position.set(-3,0, 4);
    //         mesh.scale.set(6, 6, 6);
    //     });
    // });

    for (var _key in models) {
        (function(key) {
            var mtlLoader = new MTLLoader(loadingManager);
            mtlLoader.load(models[key].mtl, function(materials) {
                materials.preload();
                var objLoader = new OBJLoader(loadingManager);
                objLoader.setMaterials(materials);
                objLoader.load(models[key].obj, function(mesh) {
                    mesh.traverse(function(node) {
                        if (node instanceof THREE.Mesh) {
                            node.castShadow = true;
                            node.receiveShadow = true;
                        }
                    });

                    models[key].mesh = mesh;
                });
            });
        })(_key);
    }

    camera.position.set(0, player.height, -5);
    camera.lookAt(new THREE.Vector3(0, player.height, 0));

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;

    document.body.appendChild(renderer.domElement);


    controls = new PointerLockControls(camera, renderer.domElement);
    
    document.addEventListener('click', function() {
        controls.lock();
    },false);


    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);


    //   Canvas Responsive
    window.addEventListener("resize", function () {
        // Cập nhật tỉ lệ khung hình của camera để phản ánh tỉ lệ khung hình mới
        // của cửa sổ sau khi thay đổi kích thước.
        camera.aspect = window.innerWidth / window.innerHeight;
        // Cập nhật ma trận chiếu của camera. Khi thay dổi các thuộc tính của camera
        // như tỷ lệ khung hình, ta cần gọi phương thức này để camera có thể hiển thị đúng.
        camera.updateProjectionMatrix();
        // Cập nhật kích thước của canvas renderer để phẩn ánh kích thước mới của cửa sổ.
        // Điều này đảm bảo rằng bảng vẽ sẽ lắp đầy toàn bộ không gian của cửa sổ sau khi
        // thay đổi kích thước.
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

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
        controls.moveForward(player.speed);
    }
    if (keyboard[83]) { // S key
        controls.moveForward(-player.speed);
    }

    if (keyboard[65]) { // A key
        controls.moveRight(-player.speed);
    }

    if (keyboard[68]) { // D key
        controls.moveRight(player.speed);
    }

    if (keyboard[32] && !isJumping) { // Space key
        isJumping = true;
        jumpVelocity = 0.5; // Đặt vận tốc ban đầu khi nhảy
    }

    if (isJumping) {
        // cập nhật vị trí của nhân vật
        controls.getObject().position.y += jumpVelocity;
        // giảm vận tốc nhảy
        jumpVelocity -= 0.01;

        // Kiểm tra xem nhân vật đã chạm đất chưa
        if (camera.position.y <= player.height) {
            // Đặt vị trí của nhân vật về mặt đất
            camera.position.y = player.height;
            // Kết thúc quá trình nhảy
            isJumping = false;
        }
    }

    renderer.render(scene, camera);
}

function keyDown(event) {
    keyboard[event.keyCode] = true;
}

function keyUp(event) {
    keyboard[event.keyCode] = false;
}

// Run when all resources are loaded
function onResourcesLoaded() {
    meshes["tree1"] = models.tree.mesh.clone();
    meshes["tree2"] = models.tree.mesh.clone();
    
    meshes["tree1"].position.set(-5, 0, 4);
    meshes["tree1"].scale.set(6, 6, 6);
    meshes["tree2"].position.set(1, 0, 4);
    meshes["tree2"].scale.set(6, 6, 6);
    scene.add(meshes["tree1"]);
    scene.add(meshes["tree2"]);
    
}  

// Ánh sáng mặt trời
function getDirectionLight(intensity) {
    var light = new THREE.DirectionalLight(0xffffff, intensity);
    light.castShadow = true; // Đổ bóng
  
    light.shadow.camera.left = -50; // giá trị mặc định là -5
    light.shadow.camera.bottom = -50; // giá trị mặc định là -5
    light.shadow.camera.Left = 50; // giá trị mặc định là 5
    light.shadow.camera.top = 50; // giá trị mặc định là 5
  
    return light;
}

window.onload = init;
