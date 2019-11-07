'use strict';

const camera = {
    fov: 75,
    aspect: 1,
    near: 0.1,
    far: 400,
};

const box = {
    width: 100.0,
    height: 100.0,
    depth: 100.0,
};

var particleAmount = 700000;

function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({
        canvas
    });

    const ThreeCamera = new THREE.PerspectiveCamera(camera.fov, camera.aspect, camera.near, camera.far);
    ThreeCamera.position.z = 20;

    const controls = new THREE.OrbitControls(ThreeCamera, canvas);

    const roomGeometry = new THREE.BoxGeometry(box.width, box.height, box.depth);

    const roomMaterial = new THREE.MeshPhongMaterial({
        color: 0xe8a52a,
        side: THREE.BackSide
    });

    const room = new THREE.Mesh(roomGeometry, roomMaterial);

    var particleGeometry = new THREE.BufferGeometry();
    var vertices = [];

    for (var i = 0; i < particleAmount; i++) {
        var x = Math.random() * 100 - 50;
        var y = Math.random() * 100 - 50;
        var z = Math.random() * 100 - 50;

        vertices.push(x, y, z);
    }

    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    var textureLoader = new THREE.TextureLoader();

    var particleTexture = textureLoader.load('textures/particletest.png');

    var lightBoxPos = new THREE.Vector3(0,0,0);
    var lightBox = new THREE.Object3D();

    var particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
          color: {
            value: new THREE.Color("0xffffff")
          },
          size:{
              value: 2
          },
          boxPosition: {
              value: lightBoxPos
          },
          boxSize: {
              value: new THREE.Vector3(5, 5, 5)
          },
          texture:{
              type: 't',
              value: particleTexture
          },
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
          
          uniform vec3 boxPosition;
          uniform vec3 boxSize;
          
          varying vec3 vPosition;
    
          void main() {
            
            vec3 particleInBox = abs(boxPosition - vPosition);
            if(particleInBox.x > boxSize.x || particleInBox.y > boxSize.y || particleInBox.z > boxSize.z) 
            {
                gl_FragColor = vec4( color, 0.01 );
            }
            else{
                gl_FragColor = vec4( color, 1.0 );
            }
          }
      `
      });

    var particles = new THREE.Points(particleGeometry, particleMaterial);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0008);

    addLight(scene);

    scene.add(room);
    scene.add(particles);

    function render() {

        moveParticles(particleGeometry);


        renderer.render(scene, ThreeCamera);

            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
    }

    function addLight(scene) {
        const color = 0xFFFFFF;
        const intensity = 0.5;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
        hemiLight.color.setHSL(0.6, 1, 0.6);
        hemiLight.groundColor.setHSL(0.095, 1, 0.75);
        hemiLight.position.set(0, 50, 0);
        scene.add(hemiLight);
    }

    function moveParticles(particleGeometry) {
        //var time = Date.now() * 0.005;
        var vertices = particleGeometry.attributes.position.array;
            

        for ( var i = 0; i < particleAmount*3; i ++ ) {
  
                vertices[i] += Math.random() * 0.0001 - 0.001;


        }
        particleGeometry.attributes.position.needsUpdate = true;
        
    }

    main();