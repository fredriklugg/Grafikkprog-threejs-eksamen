'use strict';

const camera = {
    fov: 75,
    aspect: window.innerWidth / window.innerHeight,
    near: 1,
    far: 400,
};

const box = {
    width: 100.0,
    height: 100.0,
    depth: 100.0,
};

const lightBoxSize = {
    width: 100.0,
    height: 30.0,
    depth: 30.0,
};

var particleAmount = 10000;

function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({
        canvas
    });

    const ThreeCamera = new THREE.PerspectiveCamera(camera.fov, camera.aspect, camera.near, camera.far);
    ThreeCamera.position.z = 100;

    const controls = new THREE.OrbitControls(ThreeCamera, canvas);

    var textureLoader = new THREE.TextureLoader();

    var wallTexture = textureLoader.load('textures/Cubemap/Brickwall.png');
    var wallWindowTexture = textureLoader.load('textures/Cubemap/BrickwallwBars.png');

    const roomGeometry = new THREE.BoxGeometry(box.width, box.height, box.depth);

    const roomMaterialsCube = [
        new THREE.MeshPhongMaterial({
            color: 0xfff0b3,
            side: THREE.BackSide,
            map: wallTexture
        }),
        new THREE.MeshPhongMaterial({
            color: 0xfff0b3,
            side: THREE.BackSide,
            map: wallWindowTexture
        }),
        new THREE.MeshPhongMaterial({
            color: 0xfff0b3,
            side: THREE.BackSide,
            map: wallTexture
        }),
        new THREE.MeshPhongMaterial({
            color: 0xfff0b3,
            side: THREE.BackSide,
            map: wallTexture
        }),
        new THREE.MeshPhongMaterial({
            color: 0xfff0b3,
            side: THREE.BackSide,
            map: wallTexture
        }),
        new THREE.MeshPhongMaterial({
            color: 0xfff0b3,
            side: THREE.BackSide,
            map: wallTexture
        }),
    ];

    const room = new THREE.Mesh(roomGeometry, roomMaterialsCube);

    room.geometry.computeBoundingBox();
    var roomBB = room.geometry.boundingBox.clone();

    var particleGeometry = new THREE.Geometry();

    for (var i = 0; i < particleAmount; i++) {

        var pos = new THREE.Vector3();
        pos.x = THREE.Math.randFloatSpread(100) - 50;
        pos.y = THREE.Math.randFloatSpread(100) - 50;
        pos.z = THREE.Math.randFloatSpread(100) - 50;

        var dir = new THREE.Vector3()
        dir.x = THREE.Math.randFloatSpread(1) - 0.5;
        dir.y = THREE.Math.randFloatSpread(1) - 0.5;
        dir.z = THREE.Math.randFloatSpread(1) - 0.5;

        pos.dir = dir;

        particleGeometry.vertices.push(pos);
    }

    var particleTexture = textureLoader.load('textures/particle.png');
    var fadedParticleTexture = textureLoader.load('textures/particlefaded.png');

    var lightBoxPos = new THREE.Vector3(0, -20, 0);

    var Syx = 0.75;
    var Szx = 0;
    var Sxy = 0;
    var Sxz = 0;
    var Szy = 0;
    var Syz = 0;

    var shearMatrix = new THREE.Matrix4().set(
        1, Sxy, Sxz, 0,
        Syx, 1, Syz, 0,
        Szx, Szy, 1, 0,
        0, 0, 0, 1
    );

    var particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            size: {
                value: 5
            },
            boxPosition: {
                value: lightBoxPos
            },
            boxSize: {
                value: new THREE.Vector3(lightBoxSize.width, lightBoxSize.height, lightBoxSize.depth)
            },
            texture: {
                type: 't',
                value: particleTexture
            },
            texture2: {
                type: 't',
                value: fadedParticleTexture
            },
            transf: {
                value: shearMatrix
            }
        },
        transparent: true,

        vertexShader: `
          uniform float scale;
          uniform float size;
          
          varying vec3 vPosition;
          
          void main() {
            vPosition = position;
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
            gl_PointSize = size;
            gl_Position = projectionMatrix * mvPosition;
          }
      `,
        fragmentShader: `
          uniform vec3 color;   
          uniform sampler2D texture;
          uniform sampler2D texture2;
          
          uniform vec3 boxPosition;
          uniform vec3 boxSize;
          
          uniform mat4 transf;
          varying vec3 vPosition;
    
          void main() {
            
            vec3 halfBox = boxSize * 0.5;
            vec4 boxPos4 = vec4(boxPosition, 1.0);
            vec4 vPos4 = vec4(vPosition, 1.0);
            vec4 vPosTrans = transf*vPos4;
            vec4 particleBox = abs(boxPos4 - vPosTrans);
            
            if(particleBox.x > halfBox.x || particleBox.y > halfBox.y || particleBox.z > halfBox.z) 
            {
                gl_FragColor = texture2D( texture2, gl_PointCoord );
                //discard;
            }
            else{
                gl_FragColor = texture2D( texture, gl_PointCoord );
            }
          }
      `
    });

    var particles = new THREE.Points(particleGeometry, particleMaterial);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xFFFFFF, 0.002);

    addLight(scene);

    scene.add(room);
    scene.add(particles);

    var then = 0;

    function render(now) {
        now *= 0.001; // convert to seconds
        const deltaTime = now - then;
        then = now;
        updateParticles(particleGeometry, roomBB, deltaTime)

        renderer.render(scene, ThreeCamera);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function addLight(scene) {
    var bulbLight, bulbMat

    var bulbGeometry = new THREE.SphereBufferGeometry(0.001, 16, 8);
    bulbLight = new THREE.PointLight(0xffee88, 1.5, 100, 1);
    bulbMat = new THREE.MeshStandardMaterial({
        emissive: 0xffffee,
        emissiveIntensity: 1,
        color: 0x000000,
    });
    bulbLight.add(new THREE.Mesh(bulbGeometry, bulbMat));
    bulbLight.position.set(0, 0, 0);
    bulbLight.castShadow = true;
    scene.add(bulbLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.2);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.1, 1, 0.75);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);
}

function updateParticles(particleGeometry, roomBB, deltaTime) {

    var speed = 0.5;

    for (var i = 0; i < particleAmount; i++) {
        if (!roomBB.containsPoint(particleGeometry.vertices[i])) {
            particleGeometry.vertices[i].x = Math.random() * 100 - 50;
            particleGeometry.vertices[i].y = Math.random() * 100 - 50;
            particleGeometry.vertices[i].z = Math.random() * 100 - 50;
        }

        //TODO: Implement deltatime
        particleGeometry.vertices[i].x += particleGeometry.vertices[i].dir.x * speed * deltaTime;
        particleGeometry.vertices[i].y += particleGeometry.vertices[i].dir.y * speed * deltaTime;
        particleGeometry.vertices[i].z += particleGeometry.vertices[i].dir.z * speed * deltaTime;
    }
    particleGeometry.colorsNeedUpdate = true;
    particleGeometry.verticesNeedUpdate = true;
}

main();