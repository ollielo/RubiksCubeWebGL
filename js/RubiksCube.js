// Model for cubes in the Rubik's Cubes. They are just sequential ids for the
// cube. The cubes are initially numbered from the bottom layer, left to
// right, front to back. The model needs to record the relative location
// (permutation) of the cubes, the global position and orientation of the cubes.
// The model will be extended with the meshes of the
// cubes. The model will be permuted as the faces are rotated.
var cubesModel = [
    {id: 0, mesh: null},
    {id: 1, mesh: null},
    {id: 2, mesh: null},
    {id: 3, mesh: null},
    {id: 4, mesh: null},
    {id: 5, mesh: null},
    {id: 6, mesh: null},
    {id: 7, mesh: null}
];

// Model for each face, a set of indices to the cubes in the cubesModel.
var Faces = {
    FRONT: [0, 1, 4, 5],
    BACK:  [2, 3, 6, 7],
    UP:    [4, 5, 6, 7],
    DOWN:  [0, 1, 2, 3],
    RIGHT: [1, 3, 5, 7],
    LEFT:  [0, 2, 4, 6]
};

// Get the cubes of the specified face.
var getCubesOfFace = function(face) {
    var faceCubes = [];
    face.forEach(function(index) {
        faceCubes.push(cubesModel[index]);
    });
    return faceCubes;
};

// Axes for rotations.
var Axes = {
    X:      new THREE.Vector3(1, 0, 0),
    X_NEG:  new THREE.Vector3(-1, 0, 0),
    Y:      new THREE.Vector3(0, 1, 0),
    Y_NEG:  new THREE.Vector3(0, -1, 0),
    Z:      new THREE.Vector3(0, 0, 1),
    Z_NEG:  new THREE.Vector3(0, 0, -1)
};

var Rotations = {
    RIGHT: {
        face: Faces.RIGHT,
        axis: Axes.X_NEG,
        permutation: [0, 3, 2, 7, 4, 1, 6, 5]
    },
    RIGHT_PRIME: {
        face: Faces.RIGHT,
        axis: Axes.X,
        permutation: [0, 5, 2, 1, 4, 7, 6, 3]
    },
    LEFT: {
        face: Faces.LEFT,
        axis: Axes.X,
        permutation: [4, 1, 0, 3, 6, 5, 2, 7]
    },
    LEFT_PRIME: {
        face: Faces.LEFT,
        axis: Axes.X_NEG,
        permutation: [2, 1, 6, 3, 0, 5, 4, 7]
    },
    BACK: {
        face: Faces.BACK,
        axis: Axes.Y_NEG,
        permutation: [0, 1, 6, 2, 4, 5, 7, 3]
    },
    BACK_PRIME: {
        face: Faces.BACK,
        axis: Axes.Y,
        permutation: [0, 1, 3, 7, 4, 5, 2, 6]
    },
    FRONT: {
        face: Faces.FRONT,
        axis: Axes.Y,
        permutation: [1, 5, 2, 3, 0, 4, 6, 7]
    },
    FRONT_PRIME: {
        face: Faces.FRONT,
        axis: Axes.Y_NEG,
        permutation: [4, 0, 2, 3, 5, 1, 6, 7]
    },
    UP: {
        face: Faces.UP,
        axis: Axes.Z_NEG,
        permutation: [0, 1, 2, 3, 5, 7, 4, 6]
    },
    UP_PRIME: {
        face: Faces.UP,
        axis: Axes.Z,
        permutation: [0, 1, 2, 3, 6, 4, 7, 5]
    },
    DOWN: {
        face: Faces.DOWN,
        axis: Axes.Z,
        permutation: [2, 0, 3, 1, 4, 5, 6, 7]
    },
    DOWN_PRIME: {
        face: Faces.DOWN,
        axis: Axes.Z_NEG,
        permutation: [1, 3, 0, 2, 4, 5, 6, 7]
    }
};

// View
var cubeSize = 1;
var createCubes = function() {
    var initCubeFaceColors = [
        ["black", "orange", "black", "blue",  "black", "white"],
        ["red",   "black",  "black", "blue",  "black", "white"],
        ["black", "orange", "green", "black", "black", "white"],
        ["red",   "black",  "green", "black", "black", "white"],

        ["black", "orange", "black", "blue", "yellow", "black"],
        ["red",   "black",  "black", "blue", "yellow", "black"],
        ["black", "orange", "green", "black","yellow", "black"],
        ["red",   "black",  "green", "black","yellow", "black"]
    ];

    var createOneCube = function(x, y, z, faceColors) {
        var materialArray = [];
        faceColors.forEach(function (color) {
            materialArray.push(new THREE.MeshBasicMaterial({color: color}));
        });

        var cubeShape = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        var cubeMesh = new THREE.Mesh(cubeShape, new THREE.MeshFaceMaterial(materialArray));

        cubeMesh.position.set(x, y, z);

        return cubeMesh;
    };

    for (var layer = 0; layer < 2; layer++) {
        for (var row = 0; row < 2; row++) {
            for (var col = 0; col < 2; col++) {
                cubesModel[layer*4+row*2+col].mesh =
                    createOneCube(col*1.1-0.55, row*1.1 -.55, layer*1.1 -.55,
                        initCubeFaceColors[0]);
                initCubeFaceColors.shift();
            }
        }
    }
};


// Control

// Singleton object for the current state of rotation of a face
var rotationState = {
    isOn : false,
    angle : 0,
    cubes : [],
    rotation : null
};

var resetRotationState = function() {
    rotationState.isOn = false;
    rotationState.angle = 0;
    rotationState.cubes = [];
    rotationState.rotation = null;
};

var rotateFaceStart = function(rotation) {
    // gather the meshes of cubes of the face to be rotated
    var face = Rotations[rotation].face;
    var cubes = getCubesOfFace(face);
    cubes.forEach(function (cube) {
        rotationState.cubes.push(cube.mesh);
    });

    rotationState.rotation = Rotations[rotation];
    rotationState.isOn = true;
};

var rotatingFaceMiddle = function() {
    // Actually rotating the meshes of cubes in steps so it is animated.
    rotationState.angle += Math.PI/16;

    // We have to rotate the cube by using the 4x4 rotation matrix, .rotationXYZ
    // is in the object space and there is no Object3D.applyQuaternion.
    var matrix = new THREE.Matrix4().makeRotationAxis(rotationState.rotation.axis, Math.PI/16);
    rotationState.cubes.forEach(function(cube) {
        cube.applyMatrix(matrix);
    });
};

var rotatingFaceEnd = function() {
    // update to the Cubes Model
    var newModel = [];
    rotationState.rotation.permutation.forEach(function(index) {
        newModel.push(cubesModel[index]);
    });
    cubesModel = newModel;

    resetRotationState();
};


// Scene initialization and rendering
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
var axisHelper = new THREE.AxisHelper(5);
scene.add(axisHelper);
var controls = new THREE.TrackballControls(camera);

var renderer = new THREE.WebGLRenderer();
renderer.setClearColor(0xf0f0f0);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

createCubes();

var allCubes = new THREE.Object3D();

cubesModel.forEach(function(cube) {
    allCubes.add(cube.mesh);
});

scene.add(allCubes);

scene.add(cubesModel[0].mesh);
camera.position.z = 5;

function render() {
    setTimeout( function() {
        requestAnimationFrame(render);

        if (rotationState.isOn) {
            rotatingFaceMiddle();
            if (rotationState.angle >= Math.PI/2) {
                rotatingFaceEnd();
            }
        } else {
            var keys = Object.keys(Rotations);
            var op = keys[Math.floor(Math.random()*keys.length)];
            console.log(op);
            rotateFaceStart(op);
        }

        controls.update();
        renderer.render(scene, camera);
    }, 100);
}

render();
