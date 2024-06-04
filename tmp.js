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
var player = { height: 1.8, speed: 0.2, turnSpeed: Math.PI * 0.02, canShoot: 0 };
var bullets = [];

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

// Audio variables
var listener, sound, audioLoader, footstepSound;

// var footstepSounds = [];
// var currentFootstepSound = 0, footstepInterval;

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
    },
    blasterA: {
        obj: './assets/models/Blaster/blasterA.obj',
        mtl: './assets/models/Blaster/blasterA.mtl',
        mesh: null
    },
    blasterB: {
        obj: './assets/models/Blaster/blasterB.obj',
        mtl: './assets/models/Blaster/blasterB.mtl',
        mesh: null
    }
};

// Meshes index
var meshes = {};
var spheres = []; // Danh sách các hình cầu

var crateId, intersects, boxId;

// Khởi tạo bộ đếm thời gian

var totalShot = 0, countHit = 0;
var countdownTime = 60; // Countdown time in seconds
var totalTarget = 0;
var counterTargetHit, counterTotalShot, countdownTimer;

const mousePosition = new THREE.Vector2();

window.addEventListener('mousemove', (event) => {
    mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
    mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

const raycaster = new THREE.Raycaster();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Audio listener
    listener = new THREE.AudioListener();
    camera.add(listener);

    // Audio loader
    audioLoader = new THREE.AudioLoader();


    // Load footstep sound
    footstepSound = new THREE.Audio(listener);
    audioLoader.load('./assets/sounds/footstep.mp3', function(buffer) {
        footstepSound.setBuffer(buffer);
        footstepSound.setLoop(false); // Set to loop
        footstepSound.setVolume(0); // Start with volume 0
        footstepSound.play(); // Start playing immediately but with 0 volume
    });


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
    boxId = mesh.id;

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
    crateId = crate.id;
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

    // Add crosshair
    const crosshair = document.createElement('div');
    crosshair.style.position = 'absolute';
    crosshair.style.width = '10px';
    crosshair.style.height = '10px';
    crosshair.style.color = '#ffffff';
    // crosshair.style.backgroundSize = 'cover';
    crosshair.style.background = 'red';
    crosshair.style.borderRadius = '50%';
    crosshair.style.left = '50%';
    crosshair.style.top = '50%';
    crosshair.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(crosshair);

    // Add CounterTargetHit
    counterTargetHit = document.createElement('div');
    counterTargetHit.style.position = 'absolute';
    counterTargetHit.style.width = '200px';
    counterTargetHit.style.height = '50px';
    counterTargetHit.style.color = '#ffffff';
    counterTargetHit.style.left = '10px';
    counterTargetHit.style.top = '10px';
    counterTargetHit.style.fontSize = '20px';
    counterTargetHit.innerHTML = `Target killed: ${countHit}`;
    document.body.appendChild(counterTargetHit);

    // Add CounterTargetHit
    counterTotalShot = document.createElement('div');
    counterTotalShot.style.position = 'absolute';
    counterTotalShot.style.width = '200px';
    counterTotalShot.style.height = '50px';
    counterTotalShot.style.color = '#ffffff';
    counterTotalShot.style.left = '10px';
    counterTotalShot.style.top = '40px';
    counterTotalShot.style.fontSize = '20px';
    counterTotalShot.innerHTML = `Total shot: ${totalShot}`;
    document.body.appendChild(counterTotalShot);
    
    // Add Countdown Timer
    countdownTimer = document.createElement('div');
    countdownTimer.style.position = 'absolute';
    countdownTimer.style.width = '200px';
    countdownTimer.style.height = '50px';
    countdownTimer.style.color = '#ffffff';
    countdownTimer.style.left = '10px';
    countdownTimer.style.top = '80px';
    countdownTimer.style.fontSize = '20px';
    countdownTimer.innerHTML = `Time: ${countdownTime}s`;
    document.body.appendChild(countdownTimer);   
    
    startCountdown();


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

    for (var i=0; i<4; i++) {
        createSphere();
    }

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

    for (var index=0; index<bullets.length; index+=1) {
        if (bullets[index] === undefined) continue;
        if (bullets[index].alive == false) {
            bullets.splice(index, 1);
            continue;
        }

        bullets[index].position.add(bullets[index].velocity);
    }

    // // Play footstep sound if the player is moving
    // if (keyboard[87] || keyboard[65] || keyboard[83] || keyboard[68]) { // W, A, S, D keys
    //     if (!footstepSound.isPlaying) {
    //         footstepSound.play();
    //     }
    // } else {
    //     if (footstepSound.isPlaying) {
    //         footstepSound.stop();
    //     }
    // }    

    let isMoving = keyboard[87] || keyboard[65] || keyboard[83] || keyboard[68]; // W, A, S, D keys

    // Adjust footstep sound volume based on movement
    if (isMoving) {
        if (footstepSound) footstepSound.setVolume(0.5);
    } else {
        if (footstepSound) footstepSound.setVolume(0);
    }

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
        playJumpSound();
    }

    document.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse' && event.button === 0 && player.canShoot <= 0) {
            player.canShoot = 10;
            var bullet = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xffffff })
            );

            var vector = new THREE.Vector3(0,0,-1);
            vector.applyQuaternion(controls.getObject().quaternion);

            bullet.position.set(
                meshes["playerWeapon"].position.x + vector.x,
                meshes["playerWeapon"].position.y + vector.y,
                meshes["playerWeapon"].position.z + vector.z
            );

            bullet.velocity = vector;

            // bullet.velocity = new THREE.Vector3(
            //     -Math.sin(controls.getObject().rotation.y),
            //     0,
            //     Math.cos(controls.getObject().rotation.y)
            // );
            
            bullet.alive = true;
            setTimeout(function() {
                bullet.alive = false;
                scene.remove(bullet);
            }, 1000);

            bullets.push(bullet);

            scene.add(bullet);
            totalShot++;

            // Play gunshot sound
            playGunshotSound();
        }
    })

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

    // position the gun in front of the controls
    meshes["playerWeapon"].position.set(
        controls.getObject().position.x - Math.sin(controls.getObject().rotation.y + Math.PI / 6) * 0.75,
        controls.getObject().position.y - 0.5,
        controls.getObject().position.z + Math.cos(controls.getObject().rotation.y + Math.PI / 6) * 0.75
    );

    meshes["playerWeapon"].rotation.set(
        controls.getObject().rotation.x,
        controls.getObject().rotation.y,
        controls.getObject().rotation.z 
    );
    
    if (player.canShoot>0)
        player.canShoot -= 1;

    // Kiểm tra va chạm giữa đạn và hình cầu
    for (let i=0; i<bullets.length; i++) {
        if (bullets[i].alive == false) continue;
        if (checkCollision(bullets[i])) {
            scene.remove(bullets[i]);
            bullets[i].alive = false;
        }
    }
    
    raycaster.setFromCamera(mousePosition, camera);
    intersects = raycaster.intersectObjects(scene.children);
    console.log(intersects);
    // moveSphere();

    // Update the counterTargetHit display
    counterTargetHit.innerHTML = `Target killed: ${countHit}`;
    counterTotalShot.innerHTML = `Total shot: ${totalShot}`;

    renderer.render(scene, camera);
}

function keyDown(event) {
    keyboard[event.keyCode] = true;
}

function keyUp(event) {
    keyboard[event.keyCode] = false;
}

// Hàm tạo và đặt Sphere ở vị trí ngẫu nhiên
function createSphere() {
    var sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
    var sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

    // Đặt vị trí ngẫu nhiên cho Sphere
    sphere.position.set(
        Math.random() * 10 - 5,
        Math.random() * 5,
        Math.random() * 10 - 5
    );

    scene.add(sphere);
    spheres.push(sphere);
}

// setInterval(createSphere, 2000);

// Di chuyên các Sphere theo hướng mong muốn
function moveSphere() {
    for (var i=0; i<spheres.length; i++) {
        spheres[i].position.x += 0.1;
    }

}

// Run when all resources are loaded
function onResourcesLoaded() {
    meshes["tree1"] = models.tree.mesh.clone();
    meshes["tree2"] = models.tree.mesh.clone();
    meshes["tree1"].position.set(-5, 0, 4);
    meshes["tree1"].scale.set(6, 6, 6);
    meshes["tree2"].position.set(1, 0, 4);
    meshes["tree2"].scale.set(6, 6, 6);

    meshes["playerWeapon"] = models.blasterB.mesh.clone();
    meshes["playerWeapon"].position.set(9, 0, 4);
    meshes["playerWeapon"].scale.set(1,1 , 1);


    scene.add(meshes["tree1"]);
    scene.add(meshes["tree2"]);
    scene.add(meshes["playerWeapon"]);
    
}  

// Play gunshot sound
function playGunshotSound() {
    sound = new THREE.Audio(listener);
    audioLoader.load('./assets/sounds/laser-gun.mp3', function(buffer) {
        sound.setBuffer(buffer);
        sound.setVolume(0.3);
        sound.play();
    });

    for (let i=0;i<intersects.length;i++) {
        // spheres.map((sphere) => {
        //     if (intersects[i].object.id==sphere ) {
        //         scene.remove(intersects[i].object);
        //     }
        // })
        if (intersects[i].object.id==crateId || intersects[i].object.id==boxId) {
            scene.remove(intersects[i].object);
        }

    }

    console.log(spheres);
}

function playJumpSound() {
    sound = new THREE.Audio(listener);
    audioLoader.load('./assets/sounds/jump.mp3', function(buffer) {
        sound.setBuffer(buffer);
        sound.setVolume(0.5);
        sound.play();
    });
}

function checkCollision(bullet) {
    for (let i = 0; i < spheres.length; i++) {
        const sphere = spheres[i];
        const distance = bullet.position.distanceTo(sphere.position);
        if (distance < 1) { // Kiểm tra va chạm
            // Xóa cả hình cầu và đạn khỏi cảnh
            scene.remove(sphere);
            countHit++;
            console.log(countHit)
            spheres.splice(i, 1);
            scene.remove(bullet);
            createSphere();
            return true;
        }
    }
    return false;
}

function startCountdown() {
    var countdownInterval = setInterval(function() {
        countdownTime--;
        countdownTimer.innerHTML = `Time: ${countdownTime}s`;

        if (countdownTime <= 0) {
            clearInterval(countdownInterval);
            endGame();
        }
    }, 1000);
}

function endGame() {
    // Add code to handle what happens when the game ends, e.g., stop the game, show a message, etc.
    alert("Time's up! Game over.");
    // Optionally, you can stop the animation loop by setting RESOURCES_LOADED to false
    RESOURCES_LOADED = false;
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
