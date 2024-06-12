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