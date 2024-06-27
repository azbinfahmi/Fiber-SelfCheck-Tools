var renderer = new THREE.WebGLRenderer({
    antialias: true
});

/* Fullscreen */
renderer.setSize(window.innerWidth, window.innerHeight);
/* Append to HTML */
document.body.appendChild(renderer.domElement);
var onRenderFcts = [];
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.01, 1000);
/* Play around with camera positioning */
camera.position.z = 15;
camera.position.y = 2;
/* Fog provides depth to the landscape*/
scene.fog = new THREE.Fog(0x000, 0, 45);
(function () {
    var light = new THREE.AmbientLight(0x202020)
    scene.add(light)
    var light = new THREE.DirectionalLight('white', 5)
    light.position.set(0.5, 0.0, 2)
    scene.add(light)
    var light = new THREE.DirectionalLight('white', 0.75 * 2)
    light.position.set(-0.5, -0.5, -2)
    scene.add(light)
})();

// Create a moon with gray color
var moonMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa }); // Gray color for the moon
var moonGeometry = new THREE.SphereGeometry(1, 32, 32);
var moon = new THREE.Mesh(moonGeometry, moonMaterial);
moon.position.set(-8, 5, -10); // Example position for the moon
scene.add(moon);

// Create a commit
var cometMaterial = new THREE.MeshBasicMaterial({ color: 0xffaacc, transparent: true, opacity: 0.8 });
var cometGeometry = new THREE.SphereGeometry(0.2, 16, 16);
function spawnComet() {
    var cometMesh = new THREE.Mesh(cometGeometry, cometMaterial);
    cometMesh.position.set(-15, Math.random() * 10 + 5, Math.random() * 20 - 10); // Example starting position off-screen
    scene.add(cometMesh);

    var tween = new TWEEN.Tween(cometMesh.position)
        .to({ x: 15 }, 5000) // Adjust duration (in milliseconds) for comet to cross the screen
        .easing(TWEEN.Easing.Linear.None)
        .onComplete(function () {
            scene.remove(cometMesh); // Remove comet after it crosses the screen
        })
        .start();
}
//spawnComet()
setInterval(spawnComet, 3000);

var heightMap = THREEx.Terrain.allocateHeightMap(160, 256)
THREEx.Terrain.simplexHeightMap(heightMap)
var geometry = THREEx.Terrain.heightMapToPlaneGeometry(heightMap)
THREEx.Terrain.heightMapToVertexColor(heightMap, geometry)
/* Wireframe built-in color is white, no need to change that */
var material = new THREE.MeshBasicMaterial({
    wireframe: true
});
var mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);
mesh.lookAt(new THREE.Vector3(0, 1, 0));
/* Play around with the scaling */
mesh.scale.y = 3.5;
mesh.scale.x = 3;
mesh.scale.z = 0.20;
mesh.scale.multiplyScalar(10);
/* Play around with the camera */
onRenderFcts.push(function (delta, now) {
    mesh.rotation.z += 0.2 * delta;
})
onRenderFcts.push(function () {
    renderer.render(scene, camera);
})

// Function to handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Listen to window resize events
window.addEventListener('resize', onWindowResize, false);

// Initial call to resize renderer canvas
onWindowResize();

var lastTimeMsec = null
requestAnimationFrame(function animate(nowMsec) {
    requestAnimationFrame(animate);
    lastTimeMsec = lastTimeMsec || nowMsec - 1000 / 60
    var deltaMsec = Math.min(200, nowMsec - lastTimeMsec)
    lastTimeMsec = nowMsec
    onRenderFcts.forEach(function (onRenderFct) {
        onRenderFct(deltaMsec / 1000, nowMsec / 1000)
    })
})
