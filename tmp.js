import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as dat from "dat.gui";
import { Wireframe } from "three/examples/jsm/Addons.js";
import { any, cameraPosition } from "three/examples/jsm/nodes/Nodes.js";
import { createNoise2D } from "simplex-noise";
import * as TWEEN from "@tweenjs/tween.js";
import concrete from './assets/img/concrete.jpg'
import cement from './assets/img/cement.jpg'
import sandy from './assets/img/sandy.jpg'
import wall from './assets/img/wall.jpg'
import checker from './assets/img/checker.jpg'
import fingerprint from './assets/img/fingerprint.jpg'

var keyboard = {};
var player = { height: 1.8, speed: 0.2, turnSpeed: Math.PI * 0.02 };

// Khởi tạo scene và renderer
function init() {
  const renderer = new THREE.WebGLRenderer();
  const gui = new dat.GUI();
  const clock = new THREE.Clock();

  let step = 0;

  renderer.setSize(window.innerWidth, window.innerHeight);
  // renderer.setClearColor("rgb(120,120,120)");
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );

  const cameraLookAt = {
    x: 0,
    y: 2,
    z: 0,
  };

  camera.lookAt(new THREE.Vector3(cameraLookAt.x, cameraLookAt.y, cameraLookAt.z));

  const orbit = new OrbitControls(camera, renderer.domElement);

  // Đối tượng hỗ trợ hiển thị hệ tọa độ
  const axesHelper = new THREE.AxesHelper(3);
  scene.add(axesHelper);

  // Đối tượng hỗ trợ hiển thị lưới
  const gridHelper = new THREE.GridHelper(10);
  // scene.add(gridHelper);

  camera.position.set(0, player.height, -5);
  camera.lookAt(new THREE.Vector3(0, player.height, 0));
  camera.rotation.y=0.5
  // orbit.update();

  // Tạo các hình hộp, mặt phẳng, hình cầu
  //   var box = getBox(4, 4, 4);
  var sphereMaterial = getMaterial("standard", "rgb(255,255,255)");
  var planeMaterial = getplaneMaterial('standard', 'rgb(255,255,255)')
  var sphere = getSphere(sphereMaterial, 5);
  var plane = getPlane(planeMaterial,1000);
  var lightRight = getSpotLight(20, 'rgb(255,220,180)');
  var lightLeft = getSpotLight(20, 'rgb(255,220,180)');
  var groupBox = getGroupBox(20, 2.5);
  groupBox.name = "groupBox";

  lightLeft.position.x = -4;
  lightLeft.position.y = 2;
  lightLeft.position.z = -4;
  lightLeft.intensity = 0.8

  lightRight.position.x = 4;
  lightRight.position.y = 2;
  lightRight.position.z = -4;
  lightRight.intensity = 0.8

  sphereMaterial.roughness = 0.2
  sphereMaterial.metalness = 0.2
  planeMaterial.roughness = 0.4
  planeMaterial.metalness = 0.2
  
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

  var loader = new THREE.TextureLoader();
  planeMaterial.map = loader.load(checker)
  planeMaterial.bumpMap = loader.load(checker)
  planeMaterial.roughnessMap = loader.load(checker)
  planeMaterial.bumpScale = 0.01
  planeMaterial.metalness = 0.1;
  planeMaterial.roughness = 0.7;
  planeMaterial.envMap = reflectionCube;
  sphereMaterial.roughnessMap = loader.load(fingerprint)
  sphereMaterial.envMap = reflectionCube;
  scene.background = reflectionCube

  var maps = ['map', 'bumpMap', 'roughnessMap']
  
  maps.forEach((mapName) => {
    var texture = planeMaterial[mapName];
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10,10);
  })

  

  // var texture = planeMaterial.map;
  // texture.wrapS = THREE.RepeatWrapping;
  // texture.wrapT = THREE.RepeatWrapping;
  // texture.repeat.set(1.5,1.5);


  // Cài đặt các tuỳ chọn cho hình cầu
  const options = {
    sphereColor: "#ffffff",
    wireframe: false,
    speed: 0.1,
    scale: 4,
    animateEnable: false,
    sphereAnimated: false,
    cameraAnimated: false,
  };

  // Hiển thị wireframe của hình cầu thông qua GUI
  //   gui.add(options, "wireframe").onChange(function (e) {
  //     box.material.wireframe = e;
  //   });

  // GUI Sphere
  const lightFolder = gui.addFolder("Light");
  lightFolder.open();
  const lightLeftFolder = lightFolder.addFolder('Light Left')
  lightLeftFolder.add(lightLeft, "intensity", 0, 10).name("Intensity");
  //   lightFolder.add(directionLight, "penumbra", 0, 1).name("Penumbra");
  // POSITION
  const lightLeftPositionFolder = lightLeftFolder.addFolder("Position");
  lightLeftPositionFolder
    .add(lightLeft.position, "x", -20, 20)
    .name("Position X");
    lightLeftPositionFolder
    .add(lightLeft.position, "y", -20, 20)
    .name("Position Y");
    lightLeftPositionFolder
    .add(lightLeft.position, "z", -20, 20)
    .name("Position Z");

    const lightRightFolder = lightFolder.addFolder('Light Right')
    lightRightFolder.add(lightRight, "intensity", 0, 100).name("Intensity");
    //   lightFolder.add(directionLight, "penumbra", 0, 1).name("Penumbra");
    // POSITION
    const lightRightPositionFolder = lightRightFolder.addFolder("Position");
    lightRightPositionFolder
      .add(lightRight.position, "x", -20, 20)
      .name("Position X");
      lightRightPositionFolder
      .add(lightRight.position, "y", -20, 20)
      .name("Position Y");
      lightRightPositionFolder
      .add(lightRight.position, "z", -20, 20)
      .name("Position Z");

    const materialFolder = gui.addFolder("Materials");
    materialFolder.open();
    const sphereMaterialFolder = materialFolder.addFolder('Sphere Material')
    sphereMaterialFolder.add(sphereMaterial, 'roughness', 0, 1)
    sphereMaterialFolder.add(sphereMaterial, 'metalness', 0, 1)

    const planeMaterialFolder = materialFolder.addFolder('Plane Material')
    planeMaterialFolder.add(planeMaterial, 'roughness', 0, 1)
    planeMaterialFolder.add(planeMaterial, 'metalness', 0, 1)
  // // SHININESS DÀNH CHO PhongMaterial
  // const materialFolder = gui.addFolder("Materials");
  // materialFolder.open();
  // materialFolder.add(sphereMaterial, 'shininess', 0, 1000)



  // Thiết lập vị trí và góc quay của các đối tượng
  //   box.position.y = box.geometry.parameters.height / 2;
  sphere.position.y = sphere.geometry.parameters.radius;
  // sphere.position.y = 4;
  plane.rotation.x = Math.PI / 2;
  plane.name = "plane-1";


  // Thêm các đối tượng vào scene
  //   scene.add(box);
  scene.add(sphere);
  scene.add(plane);
  scene.add(lightLeft);
  scene.add(lightRight);
  // scene.add(groupBox);
  //   scene.add(helper);
  // directionLight.add(sphere);

  // Bắt đầu vòng lặp render
  renderer.setAnimationLoop(animate);
  update(renderer, scene, camera, orbit, clock);

  function animate(time) {
    

    // Di chuyển hình cầu theo hàm sin
    step += options.speed;
    if (options.animateEnable) {
      sphere.position.y =
        4 * Math.abs(Math.sin(step)) + sphere.geometry.parameters.radius;
    }

    if (keyboard[87]) { // W key
        camera.position.x -= Math.sin(camera.rotation.y) * player.speed;
        camera.position.z -= -Math.cos(camera.rotation.y) * player.speed;
    }

    if (keyboard[83]) { // S key
        camera.position.x -= Math.sin(camera.rotation.y) * -player.speed;
        camera.position.z -= -Math.cos(camera.rotation.y) * -player.speed;
    }

    if (keyboard[65]) { // A key
        camera.position.x += Math.sin(camera.rotation.y + Math.PI/2) * player.speed;
        camera.position.z += -Math.cos(camera.rotation.y + Math.PI/2) * player.speed;
    }

    if (keyboard[68]) { // D key
        camera.position.x += Math.sin(camera.rotation.y - Math.PI/2) * player.speed;
        camera.position.z += -Math.cos(camera.rotation.y - Math.PI/2) * player.speed;
    }
    
 
    if (keyboard[37]) { // left arrow key
        camera.rotation.y -= player.turnSpeed
    }

    if (keyboard[39]) { // right arrow key
        camera.rotation.y += player.turnSpeed
    }

    renderer.render(scene, camera);
  }

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

  document.addEventListener("keydown", keyDown);
  document.addEventListener("keyup", keyUp);

  return scene;
}

function keyDown(e) {
    keyboard[e.keyCode] = true;
}

function keyUp(e) {
    keyboard[e.keyCode] = false;
}

// Cập nhật scene
function update(renderer, scene, camera, orbit, clock) {
  renderer.render(scene, camera);

  requestAnimationFrame(function () {
    update(renderer, scene, camera, orbit, clock);
  });
}

// Tạo hình hộp
function getBox(w, h, d) {
  var geometry = new THREE.BoxGeometry(w, h, d);
  var material = new THREE.MeshPhongMaterial({
    color: "rgb(120,120,120)",
  });
  var mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  return mesh;
}

// Tạo 1 nhóm nhiều hình hộp
function getGroupBox(amount, separationMultiplier) {
  var group = new THREE.Group();

  for (var i = 0; i < amount; i++) {
    var obj = getBox(1, 2, 1);
    obj.position.x = i * separationMultiplier;
    obj.position.y = obj.geometry.parameters.height / 2;
    group.add(obj);
    for (var j = 0; j < amount; j++) {
      var obj = getBox(1, 2, 1);
      obj.position.x = i * separationMultiplier;
      obj.position.y = obj.geometry.parameters.height / 2;
      obj.position.z = j * separationMultiplier;
      group.add(obj);
    }
  }

  group.position.x = -(separationMultiplier * (amount - 1)) / 2;
  group.position.z = -(separationMultiplier * (amount - 1)) / 2;

  return group;
}

// Tạo mặt phẳng
function getPlane(material,size) {
  var geometry = new THREE.PlaneGeometry(size, size);
  var mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

// Tạo hình cầu
function getSphere(material, radius, wSegments = 24, hSegments = 24) {
  var geometry = new THREE.SphereGeometry(radius, wSegments, hSegments);
  // var material = new THREE.MeshBasicMaterial({
  //   color: 0xffffff,
  // });
  var mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true
  return mesh;
}

// Tạo điểm sáng
function getPointLight(intensity) {
  var light = new THREE.directionLight(0xffffff, intensity);
  light.castShadow = true; // Đổ bóng
  return light;
}

// Nguồn sáng này sẽ giống Spotlight trên sân khấu
function getSpotLight(intensity, color) {
  color = color === undefined ? "rgb(255,255,255)" : color;
  var light = new THREE.DirectionalLight(color, intensity);
  light.castShadow = true; // Đổ bóng
  light.shadow.bias = 0.01; // Làm cho phần viền, phần tiếp xúc giữa box và plane mịn hơn
  light.penumbra = 0.5;
  // Tăng resolution của shadow, giúp nhìn sharp hơn, giá trị default là 512, lưu ý đừng tăng nhiều quá
  light.shadow.mapSize.width = 1024;
  // Tăng resolution của shadow, giúp nhìn sharp hơn, giá trị default là 512, lưu ý đừng tăng nhiều quá
  light.shadow.mapSize.height = 1024;

  return light;
}

// Nguồn sáng này sẽ giống với hướng chiếu sáng của mặt trời khi ở Trải Đất
function getDirectionLight(intensity) {
  var light = new THREE.DirectionalLight(0xffffff, intensity);
  light.castShadow = true; // Đổ bóng

  light.shadow.camera.left = -50; // giá trị mặc định là -5
  light.shadow.camera.bottom = -50; // giá trị mặc định là -5
  light.shadow.camera.Left = 50; // giá trị mặc định là 5
  light.shadow.camera.top = 50; // giá trị mặc định là 5

  return light;
}

function getMaterial(type, color) {
  var selectedMaterial;
  var materialOptions = {
    color: color === undefined ? "rgb(255,255,255)" : color,
  };

  switch (type) {
    case "basic":
      selectedMaterial = new THREE.MeshBasicMaterial(materialOptions);
      break;
    case "lambert":
      selectedMaterial = new THREE.MeshLambertMaterial(materialOptions);
      break;
    case "phong":
      selectedMaterial = new THREE.MeshPhongMaterial(materialOptions);
      break;
    case "standard":
      selectedMaterial = new THREE.MeshStandardMaterial(materialOptions);
      break;
    default:
      selectedMaterial = new THREE.MeshBasicMaterial(materialOptions);
      break;
  }
  return selectedMaterial;
}

function getplaneMaterial(type, color) {
  var selectedMaterial;
  var materialOptions = {
    color: color === undefined ? "rgb(255,255,255)" : color,
    side: THREE.DoubleSide,
  };

  switch (type) {
    case "basic":
      selectedMaterial = new THREE.MeshBasicMaterial(materialOptions);
      break;
    case "lambert":
      selectedMaterial = new THREE.MeshLambertMaterial(materialOptions);
      break;
    case "phong":
      selectedMaterial = new THREE.MeshPhongMaterial(materialOptions);
      break;
    case "standard":
      selectedMaterial = new THREE.MeshStandardMaterial(materialOptions);
      break;
    default:
      selectedMaterial = new THREE.MeshBasicMaterial(materialOptions);
      break;
  }
  return selectedMaterial;
}

// Đây là nguồn sáng tự nhiên, sẽ giống như khi phòng ta vào ban ngày, không phải nguồn sáng chính xác
// như ánh sáng từ mặt trời hoặc đèn, mà thay vào đó nó đại diện cho ánh sáng phản xạ từ các bề mặt
// xung quanh trong không gian. (nhớ là KHÔNG CÓ ĐỔ BÓNG)
function getAmbientLight(intensity) {
  var light = new THREE.AmbientLight("rgb(10,30,50)", intensity);
  // light.castShadow = true; // trong AmbientLight sẽ không có đổ bóng
  return light;
}



// Khởi tạo scene
var scene = init();
