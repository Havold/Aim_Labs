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

// var footstepSounds = [];
// var currentFootstepSound = 0, footstepInterval;

// bullet.position.set(
//   meshes["playerWeapon"].position.x + vector.x,
//   meshes["playerWeapon"].position.y + vector.y,
//   meshes["playerWeapon"].position.z + vector.z
// );

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

// Add code to handle what happens when the game ends, e.g., stop the game, show a message, etc.
//   alert("Time's up! Game over.");
// Optionally, you can stop the animation loop by setting RESOURCES_LOADED to false
//   RESOURCES_LOADED = false;

//   meshes["playerWeapon"] = models.blasterB.mesh.clone();
//   meshes["playerWeapon"].position.set(9, 0, 4);
//   meshes["playerWeapon"].scale.set(1, 1, 1);

//   scene.add(meshes["playerWeapon"]);

// position the gun in front of the controls
//   meshes["playerWeapon"].position.set(
//     controls.getObject().position.x -
//       Math.sin(controls.getObject().rotation.y + Math.PI / 6) * 0.75,
//     controls.getObject().position.y - 0.5,
//     controls.getObject().position.z +
//       Math.cos(controls.getObject().rotation.y + Math.PI / 6) * 0.75
//   );

//   meshes["playerWeapon"].rotation.set(
//     controls.getObject().rotation.x,
//     controls.getObject().rotation.y,
//     controls.getObject().rotation.z
//   );
