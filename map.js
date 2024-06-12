import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as dat from "dat.gui";
import { Wireframe } from "three/examples/jsm/Addons.js";
import { any, cameraPosition, int } from "three/examples/jsm/nodes/Nodes.js";
import { createNoise2D } from "simplex-noise";
import * as TWEEN from "@tweenjs/tween.js";
import { MTLLoader } from "three/examples/jsm/Addons.js";
import { OBJLoader } from "three/examples/jsm/Addons.js";
import { DirectionalLightHelper } from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls";
import { FBXLoader } from "three/examples/jsm/Addons.js";

// Tạo màn hình overlay
var overlay = document.createElement("div");
overlay.style.position = "fixed";
overlay.style.display = 'flex';
overlay.style.flexDirection = 'column'
overlay.style.top = "0";
overlay.style.left = "0";
overlay.style.width = "100%";
overlay.style.height = "100%";
overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)"; // Màu đen với opacity 50%
overlay.style.display = "none"; // Mặc định ẩn đi
overlay.style.justifyContent = "center";
overlay.style.alignItems = "center";
overlay.style.color = "white";
overlay.style.fontSize = "4em";
overlay.style.zIndex = "9999"; // Đảm bảo màn hình overlay hiển thị trên mọi thứ khác
overlay.innerHTML = "Game Over";

// Tạo container cho các nút
var buttonContainer = document.createElement('div');
// buttonContainer.style.display = 'flex';
// buttonContainer.style.flexDirection = 'column'

// Tạo nút Chơi lại
var restartButton = document.createElement('button');
restartButton.textContent = 'Play Again';
restartButton.style.padding = '16px 24px';
restartButton.style.fontSize = '16px';
restartButton.style.fontFamily = 'Montserrat';
restartButton.style.borderRadius = '10px';
restartButton.style.fontWeight = 'bold';
restartButton.style.color = '#ffffff';
restartButton.style.backgroundColor = '#14b690';
restartButton.style.marginLeft = '20px'; // Margin để tạo khoảng cách giữa các nút

restartButton.addEventListener('click', restartGame)

// Tạo nút Thoát
// var exitButton = document.createElement('button');
// exitButton.textContent = 'Thoát';

// Thêm các nút vào container
// buttonContainer.appendChild(exitButton);
buttonContainer.appendChild(restartButton);

// Thêm container vào màn hình overlay
overlay.appendChild(buttonContainer);


// Thêm màn hình overlay vào body của trang web
document.body.appendChild(overlay);

var scene, camera, renderer, mesh, loadingManager, controls;
var directionLight;
var ambientLight, light;
var meshFloor;
var crate, crateTexture, crateNormalMap, crateBumpMap;

var keyboard = {};
var player = {
  height: 3,
  accuracy: 0.2,
  turnSpeed: Math.PI * 0.02,
  canShoot: 0,
};
var bullets = [];
var endGameFlag = false;

var loadingScreen = {
  scene: new THREE.Scene(),
  camera: new THREE.PerspectiveCamera(
    90,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  ),
  box: new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshBasicMaterial({ color: 0x4444ff })
  ),
};

var isJumping = false;
var jumpVelocity = 0;

var RESOURCES_LOADED = false;

// Audio variables
var listener, sound, audioLoader, footstepSound;

// var footstepSounds = [];
// var currentFootstepSound = 0, footstepInterval;

// Models index
var models = {
  rock: {
    obj: "./assets/models/rocks.obj",
    mtl: "./assets/models/rocks.mtl",
    mesh: null,
  },
  stones: {
    obj: "./assets/models/stones.obj",
    mtl: "./assets/models/stones.mtl",
    mesh: null,
  },
  blasterA: {
    obj: "./assets/models/Blaster/blasterA.obj",
    mtl: "./assets/models/Blaster/blasterA.mtl",
    mesh: null,
  },
  blasterB: {
    obj: "./assets/models/Blaster/blasterB.obj",
    mtl: "./assets/models/Blaster/blasterB.mtl",
    mesh: null,
  },
};

// Meshes index
var meshes = {};
var spheres = []; // Danh sách các hình cầu

var crateId, intersects, boxId;

// Khởi tạo bộ đếm thời gian

var totalShot = 0,
  countHit = 0;
var totalTarget = 0;
var counterTargetHit, counterTotalShot, countdownTimer, scoreBox, accuracyBox;
var weaponName, weaponBox;
var scoreContainer, accuracyContainer, weaponContainer;
var horizontalBar, verticalBar;

const mousePosition = new THREE.Vector2();

window.addEventListener("mousemove", (event) => {
  mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
  mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

const raycaster = new THREE.Raycaster();
var countdownTime;

function init() {
    countdownTime = 3; // Countdown time in seconds
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    90,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  // Audio listener
  listener = new THREE.AudioListener();
  camera.add(listener);

  // Audio loader
  audioLoader = new THREE.AudioLoader();

  // Load footstep sound
  footstepSound = new THREE.Audio(listener);
  audioLoader.load("./assets/sounds/footstep.mp3", function (buffer) {
    footstepSound.setBuffer(buffer);
    footstepSound.setLoop(false); // Set to loop
    footstepSound.setVolume(0); // Start with volume 0
    footstepSound.play(); // Start playing immediately but with 0 volume
  });

  loadingScreen.box.position.set(0, 0, 5);
  loadingScreen.camera.lookAt(loadingScreen.box.position);
  loadingScreen.scene.add(loadingScreen.box);

  loadingManager = new THREE.LoadingManager();

  loadingManager.onProgress = function (item, loaded, total) {
    console.log(item, loaded, total);
  };

  loadingManager.onLoad = function () {
    console.log("loaded all resources");
    RESOURCES_LOADED = true;
    onResourcesLoaded();
  };

  // manipulate materials
  // load the cube map
  var path = "/assets/cube/sun/";
  var format = ".jpg";
  var urls = [
    path + "px" + format,
    path + "nx" + format,
    path + "py" + format,
    path + "ny" + format,
    path + "pz" + format,
    path + "nz" + format,
  ];
  var reflectionCube = new THREE.CubeTextureLoader().load(urls);
  reflectionCube.format = THREE.RGBAFormat;
  scene.background = reflectionCube;

  mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.001, 1.001, 0.0011),
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

  const fbxLoader = new FBXLoader();
  fbxLoader.load("assets/models/Map/aim.fbx", (object) => {
    object.scale.set(0.05, 0.05, 0.05);
    object.position.set(0, 0.1, 0);

    const texture_ground = textureLoader.load(
      "assets/img/aim_lab_gr.png",
      () => {
        texture_ground.wrapS = THREE.RepeatWrapping;
        texture_ground.wrapT = THREE.RepeatWrapping;
        texture_ground.repeat.set(20, 25);
      }
    );
    const texture_ground_2 = textureLoader.load(
      "assets/img/aim_lab_gr.png",
      () => {
        texture_ground_2.wrapS = THREE.RepeatWrapping;
        texture_ground_2.wrapT = THREE.RepeatWrapping;
        texture_ground_2.repeat.set(10, 1);
      }
    );
    const texture_box = textureLoader.load("assets/img/wood.jpg", () => {
      texture_box.wrapS = THREE.RepeatWrapping;
      texture_box.wrapT = THREE.RepeatWrapping;
      texture_box.repeat.set(2, 2);
    });

    object.traverse((child) => {
      if (child.isMesh) {
        if (child.name == "san") {
          child.material = new THREE.MeshPhongMaterial({
            map: texture_ground,
            side: THREE.DoubleSide,
          });
          child.material.needsUpdate = true;
          child.receiveShadow = true;
        } else if (child.name == "noc") {
          child.material = new THREE.MeshPhongMaterial({
            map: texture_ground_2,
            side: THREE.DoubleSide,
          });
          child.material.needsUpdate = true;
          child.castShadow = true;
        } else if (child.name == "wall") {
          child.material = new THREE.MeshPhongMaterial({
            map: texture_box,
            side: THREE.DoubleSide,
          });
          child.material.needsUpdate = true;
          child.receiveShadow = true;
        } else {
          child.material = new THREE.MeshPhongMaterial({
            color: "#4F6480",
            side: THREE.DoubleSide,
          });
          child.material.needsUpdate = true;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      }
    });
    object.rotation.set(0, Math.PI / 2, 0);
    scene.add(object);
  });

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

  for (var _key in models) {
    (function (key) {
      var mtlLoader = new MTLLoader(loadingManager);
      mtlLoader.load(models[key].mtl, function (materials) {
        materials.preload();
        var objLoader = new OBJLoader(loadingManager);
        objLoader.setMaterials(materials);
        objLoader.load(models[key].obj, function (mesh) {
          mesh.traverse(function (node) {
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

  camera.position.set(0, player.height, -10);
  camera.lookAt(new THREE.Vector3(0, player.height, 0));

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.BasicShadowMap;

  document.body.appendChild(renderer.domElement);

  loadUI();

  controls = new PointerLockControls(camera, renderer.domElement);

  document.addEventListener(
    "click", 
    function () {
      if (endGameFlag==false) controls.lock();
    },
    false
  );


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

  for (var i = 0; i < 4; i++) {
    createSphere();
  }

  document.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);

  animate();
}

function animate() {
  if (RESOURCES_LOADED == false) {
    requestAnimationFrame(animate);
    loadingScreen.box.position.x -= 0.05;

    if (loadingScreen.box.position.x < -10) {
      loadingScreen.box.position.x = 10;
    }
    loadingScreen.box.position.y = Math.sin(loadingScreen.box.position.x);

    renderer.render(loadingScreen.scene, loadingScreen.camera);
    return;
  }

  requestAnimationFrame(animate);

  mesh.rotation.x += 0.01;
  mesh.rotation.y += 0.02;

  for (var index = 0; index < bullets.length; index += 1) {
    if (bullets[index] === undefined) continue;
    if (bullets[index].alive == false) {
      bullets.splice(index, 1);
      continue;
    }

    bullets[index].position.add(bullets[index].velocity);
  }

  let isMoving = keyboard[87] || keyboard[65] || keyboard[83] || keyboard[68]; // W, A, S, D keys

  if (isMoving) {
    if (footstepSound) footstepSound.setVolume(0.5);
  } else {
    if (footstepSound) footstepSound.setVolume(0);
  }

  if (keyboard[87]) {
    // W key
    controls.moveForward(player.accuracy);
  }
  if (keyboard[83]) {
    // S key
    controls.moveForward(-player.accuracy);
  }

  if (keyboard[65]) {
    // A key
    controls.moveRight(-player.accuracy);
  }

  if (keyboard[68]) {
    // D key
    controls.moveRight(player.accuracy);
  }

  if (keyboard[32] && !isJumping) {
    // Space key
    isJumping = true;
    jumpVelocity = 0.5; // Đặt vận tốc ban đầu khi nhảy
    playJumpSound();
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

  // position the gun in front of the controls
  meshes["playerWeapon"].position.set(
    controls.getObject().position.x -
      Math.sin(controls.getObject().rotation.y + Math.PI / 6) * 0.75,
    controls.getObject().position.y - 0.5,
    controls.getObject().position.z +
      Math.cos(controls.getObject().rotation.y + Math.PI / 6) * 0.75
  );

  meshes["playerWeapon"].rotation.set(
    controls.getObject().rotation.x,
    controls.getObject().rotation.y,
    controls.getObject().rotation.z
  );

  if (player.canShoot > 0) player.canShoot -= 1;

  // Kiểm tra va chạm giữa đạn và hình cầu
  for (let i = 0; i < bullets.length; i++) {
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
  //   counterTargetHit.innerHTML = `Target killed: ${countHit}`;
  scoreBox.innerHTML = `${countHit}`;
  accuracyBox.innerHTML = `${((countHit / totalShot) * 100).toFixed(2)}%`;
  //   counterTotalShot.innerHTML = `Total shot: ${totalShot}`;

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
  var sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
  var sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
  var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

  // Đặt vị trí ngẫu nhiên cho Sphere
  sphere.position.set(
    Math.random() * 10 - 5,
    Math.random() * 5,
    Math.random() * 10 - 5
  );
  if (sphere.position.y < 0.5) {
    sphere.position.y += 0.5;
  }
  if (sphere.position.z < -4) {
    sphere.position.z += 4;
  }

  scene.add(sphere);
  spheres.push(sphere);
}

// Di chuyên các Sphere theo hướng mong muốn
function moveSphere() {
  for (var i = 0; i < spheres.length; i++) {
    spheres[i].position.x += 0.1;
  }
}

// Run when all resources are loaded
function onResourcesLoaded() {
  meshes["playerWeapon"] = models.blasterB.mesh.clone();
  meshes["playerWeapon"].position.set(9, 0, 4);
  meshes["playerWeapon"].scale.set(1, 1, 1);

  scene.add(meshes["playerWeapon"]);
}

// Play gunshot sound
function playGunshotSound() {
  sound = new THREE.Audio(listener);
  audioLoader.load("./assets/sounds/laser-gun.mp3", function (buffer) {
    sound.setBuffer(buffer);
    sound.setVolume(0.3);
    sound.play();
  });

  for (let i = 0; i < intersects.length; i++) {
    if (
      intersects[i].object.id == crateId ||
      intersects[i].object.id == boxId
    ) {
      scene.remove(intersects[i].object);
    }
  }

  console.log(spheres);
}

function playJumpSound() {
  sound = new THREE.Audio(listener);
  audioLoader.load("./assets/sounds/jump.mp3", function (buffer) {
    sound.setBuffer(buffer);
    sound.setVolume(0.5);
    sound.play();
  });
}

function checkCollision(bullet) {
  for (let i = 0; i < spheres.length; i++) {
    const sphere = spheres[i];
    const distance = bullet.position.distanceTo(sphere.position);
    if (distance < 1) {
      // Kiểm tra va chạm
      // Xóa cả hình cầu và đạn khỏi cảnh
      scene.remove(sphere);
      countHit++;
      console.log(countHit);
      spheres.splice(i, 1);
      scene.remove(bullet);
      createSphere();
      return true;
    }
  }
  return false;
}

function startCountdown() {
  var countdownInterval = setInterval(function () {
    countdownTime--;
    countdownTimer.innerHTML = countdownTime;

    if (countdownTime <= 0) {
      clearInterval(countdownInterval);
      endGame();
    }
  }, 1000);
}

function endGame() {
  // Add code to handle what happens when the game ends, e.g., stop the game, show a message, etc.
  //   alert("Time's up! Game over.");
  // Optionally, you can stop the animation loop by setting RESOURCES_LOADED to false
  //   RESOURCES_LOADED = false;
  scoreContainer.removeChild(scoreBox);
  scoreContainer.removeChild(counterTargetHit);

  accuracyContainer.removeChild(accuracyBox);
  accuracyContainer.removeChild(counterTotalShot);

  weaponContainer.removeChild(weaponBox);
  weaponContainer.removeChild(weaponName);

  document.body.removeChild(countdownTimer);
  document.body.removeChild(verticalBar);
  document.body.removeChild(horizontalBar);

  showGameOverScreen();
  document.removeEventListener('pointerdown',handlePointerDown)
  window.removeEventListener("keydown", keyDown);
  window.removeEventListener("keyup", keyUp);
  endGameFlag=true;
  controls.unlock();
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

function handlePointerDown(event) {
    if (
        event.pointerType === "mouse" &&
        event.button === 0 &&
        player.canShoot <= 0
      ) {
          player.canShoot = 10;
          var bullet = new THREE.Mesh(
              new THREE.SphereGeometry(0.03, 8, 8),
              new THREE.MeshBasicMaterial({ color: 0xffffff })
          );
  
          var vector = new THREE.Vector3(-0.03, 0.035, -1);
          vector.applyQuaternion(controls.getObject().quaternion);
  
          bullet.position.set(
              meshes["playerWeapon"].position.x + vector.x,
              meshes["playerWeapon"].position.y + vector.y,
              meshes["playerWeapon"].position.z + vector.z
          );
  
          bullet.velocity = vector;
  
          bullet.alive = true;
          setTimeout(function () {
              bullet.alive = false;
              scene.remove(bullet);
          }, 1000);
  
          bullets.push(bullet);
  
          scene.add(bullet);
          totalShot++;
  
          // Play gunshot sound
          playGunshotSound();
      }
}

function loadUI() {
  // Add crosshair
//   const crosshair = document.createElement("div");
//   crosshair.style.position = "absolute";
//   crosshair.style.width = "5px";
//   crosshair.style.height = "5px";
//   crosshair.style.color = "#ffffff";
//   crosshair.style.background = "red";
//   crosshair.style.borderRadius = "50%";
//   crosshair.style.left = "50%";
//   crosshair.style.top = "50%";
//   crosshair.style.transform = "translate(-50%, -50%)";
//   document.body.appendChild(crosshair);
    const crosshair = document.createElement('div');
    crosshair.style.position = 'absolute';

    crosshair.style.width = '10px';
    crosshair.style.height = '10px';
    crosshair.style.left = '50%';
    crosshair.style.top = '50%';
    crosshair.style.transform = 'translate(-50%, -50%)';

    horizontalBar = document.createElement('div');
    horizontalBar.style.position = 'absolute';
    horizontalBar.style.width = '14px'; // Chiều dài của thanh ngang
    horizontalBar.style.height = '2px'; // Độ dày của thanh ngang
    horizontalBar.style.backgroundColor = 'white';
    horizontalBar.style.left = '50%';
    horizontalBar.style.top = '50%';
    horizontalBar.style.transform = 'translate(-50%, -50%)';

    verticalBar = document.createElement('div');
    verticalBar.style.position = 'absolute';
    verticalBar.style.width = '2px'; // Độ dày của thanh dọc
    verticalBar.style.height = '14px'; // Chiều dài của thanh dọc
    verticalBar.style.backgroundColor = 'white';
    verticalBar.style.left = '50%';
    verticalBar.style.top = '50%';
    verticalBar.style.transform = 'translate(-50%, -50%)';

    document.body.appendChild(horizontalBar);
    document.body.appendChild(verticalBar);

  // Add Score
  scoreContainer = document.getElementById("score-container");
  counterTargetHit = document.createElement("div");
  counterTargetHit.style.position = "absolute";
  counterTargetHit.style.width = "200px";
  counterTargetHit.style.height = "50px";
  counterTargetHit.style.color = "#ffffff";
  counterTargetHit.style.left = "30%";
  counterTargetHit.style.top = "4%";
  counterTargetHit.style.fontSize = "20px";
  counterTargetHit.style.fontWeight = "bold";
  counterTargetHit.innerHTML = `Score`;
  scoreContainer.appendChild(counterTargetHit);

  // Add a box under Score
  scoreBox = document.createElement("div");
  scoreBox.style.background =
    "linear-gradient(180deg, rgba(20,182,144,1) 0%, rgba(1,17,13,0.6226685796269728) 40%)";
  scoreBox.style.position = "absolute";
  scoreBox.style.fontWeight = "bold";
  scoreBox.style.width = "160px";
  scoreBox.style.height = "40px";
  scoreBox.style.color = "#ffffff";
  scoreBox.style.left = "30%";
  scoreBox.style.top = "8%"; // Adjust the top position to place it below counterTargetHit
  scoreBox.style.fontSize = "20px";
  scoreBox.style.display = "flex";
  scoreBox.style.alignItems = "center";
  scoreBox.style.justifyContent = "center";
  scoreBox.style.border = "2px solid #14b690"; // Optional: Add a border to the box
  scoreBox.style.padding = "10px"; // Optional: Add padding inside the box
  scoreBox.style.borderRadius = "4px";
  scoreBox.style.borderBottomLeftRadius = "40px";
  scoreBox.innerHTML = `${countHit}`;
  scoreContainer.appendChild(scoreBox);

  // Add Accuracy
  accuracyContainer = document.getElementById("accuracy-container");
  counterTotalShot = document.createElement("div");
  counterTotalShot.style.position = "absolute";
  counterTotalShot.style.width = "200px";
  counterTotalShot.style.height = "50px";
  counterTotalShot.style.color = "#ffffff";
  counterTotalShot.style.right = "23%";
  counterTotalShot.style.top = "4%";
  counterTotalShot.style.fontSize = "20px";
  counterTotalShot.style.fontWeight = "bold";
  counterTotalShot.innerHTML = `Accuracy`;
  accuracyContainer.appendChild(counterTotalShot);

  // Add a box under Accuracy
  accuracyBox = document.createElement("div");
  accuracyBox.style.background =
    "linear-gradient(180deg, rgba(84,104,213,1) 0%, rgba(1,17,13,0.6226685796269728) 36%)";
  accuracyBox.style.position = "absolute";
  accuracyBox.style.fontWeight = "bold";
  accuracyBox.style.width = "160px";
  accuracyBox.style.height = "40px";
  accuracyBox.style.color = "#ffffff";
  accuracyBox.style.right = "30%";
  accuracyBox.style.top = "8%"; // Adjust the top position to place it below counterTargetHit
  accuracyBox.style.fontSize = "20px";
  accuracyBox.style.display = "flex";
  accuracyBox.style.alignItems = "center";
  accuracyBox.style.justifyContent = "center";
  accuracyBox.style.border = "2px solid #5468d5"; // Optional: Add a border to the box
  accuracyBox.style.padding = "10px"; // Optional: Add padding inside the box
  accuracyBox.style.borderRadius = "4px";
  accuracyBox.style.borderBottomRightRadius = "40px";
  accuracyBox.innerHTML = `0`;
  accuracyContainer.appendChild(accuracyBox);

  // Add Weapon HTML
  weaponContainer = document.getElementById("weapon-container");
  weaponName = document.createElement("div");
  weaponName.style.position = "absolute";
  weaponName.style.width = "200px";
  weaponName.style.height = "50px";
  weaponName.style.color = "#ffffff";
  weaponName.style.left = "4%";
  weaponName.style.bottom = "10%";
  weaponName.style.fontSize = "20px";
  weaponName.style.fontWeight = "bold";
  weaponName.innerHTML = `Blaster`;
  weaponContainer.appendChild(weaponName);

  // Add a box under Weapon
  weaponBox = document.createElement("div");
  weaponBox.style.background =
    "linear-gradient(180deg, rgba(84,104,213,1) 0%, rgba(1,17,13,0.6226685796269728) 36%)";
  weaponBox.style.position = "absolute";
  weaponBox.style.fontWeight = "bold";
  weaponBox.style.width = "160px";
  weaponBox.style.height = "40px";
  weaponBox.style.color = "#ffffff";
  weaponBox.style.left = "4%";
  weaponBox.style.bottom = "4%"; // Adjust the top position to place it below counterTargetHit
  weaponBox.style.fontSize = "20px";
  weaponBox.style.display = "flex";
  weaponBox.style.alignItems = "center";
  weaponBox.style.justifyContent = "center";
  weaponBox.style.border = "2px solid #5468d5"; // Optional: Add a border to the box
  weaponBox.style.padding = "10px"; // Optional: Add padding inside the box
  weaponBox.style.borderRadius = "4px";
  weaponBox.style.borderBottomLeftRadius = "40px";
  weaponContainer.appendChild(weaponBox);

  // Create an img element
  let weaponImage = document.createElement("img");
  weaponImage.src = "./assets/img/gun_icon.png"; // Replace with the path to your image
  weaponImage.style.width = "40px"; // Set the width of the image
  weaponImage.style.height = "40px"; // Set the height of the image

  //   Add the image to the weaponBox
  weaponBox.appendChild(weaponImage);

  // Add Countdown Timer
  countdownTimer = document.createElement("div");
  countdownTimer.style.position = "absolute";
  countdownTimer.style.width = "200px";
  countdownTimer.style.height = "50px";
  countdownTimer.style.color = "#ffffff";
  countdownTimer.style.left = "50%";
  countdownTimer.style.top = "10%";
  countdownTimer.style.fontSize = "20px";
  countdownTimer.style.fontWeight = "bold";
  countdownTimer.innerHTML = countdownTime;
  document.body.appendChild(countdownTimer);
  startCountdown();
}

// Hàm để hiển thị màn hình overlay khi hết thời gian
function showGameOverScreen() {
  overlay.style.display = "flex"; // Hiển thị màn hình overlay
  // Tắt sự kiện chơi tiếp ở đây
}

function restartGame() {
  // Dọn dẹp tất cả các đối tượng trong scene
  while(scene.children.length > 0){ 
    scene.remove(scene.children[0]); 
  }
  
  // Khởi tạo lại trò chơi
//   init();
  location.reload()

  // Ẩn overlay
  overlay.style.display = "none";
}

window.onload = init;
