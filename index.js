let isPaused = false;
let activePopup = null;
let isTouching = false;
let touchX = 0;
let touchY = 0;

const data = [
    // {name:"videos/v1.mp4"},
    // {name:"videos/v2.mp4"},
    // {name:"videos/v3.mp4"},
    // {name:"videos/v4.mp4"},
    // {name:"videos/v5.mp4"},
    // {name:"videos/v6.mp4"},
    // {name:"videos/v7.mp4"},
    // {name:"videos/v8.mp4"},
    // {name:"videos/v9.mp4"},
    // {name:"videos/v10.mp4"},
    {name:"images/8-1.jpg"},
    {name:"images/8-2.jpg"},
    {name:"images/8-3.jpg"},
    {name:"images/8-4.jpg"},
    {name:"images/8-5.jpg"},
    {name:"images/8-6.jpg"},
    {name:"images/8-7.jpg"},
    {name:"images/8-8.jpg"},
    {name:"images/8-9.jpg"},
    {name:"images/8-10.jpg"},
    {name:"images/8-11.jpg"},
    {name:"images/8-12.jpg"},
];

const params = {
    row:7,
    columns:7,
    curvature:5,
    spacing:10,
    imageWidth:7,
    imageHeight:7,
    depth:7.5,
    elevation:0,
    lookAtRange:20,
    verticalCurvature:0.5,
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    25,
    window.innerWidth / window.innerHeight, 
    0.1, 
    1000
);
camera.position.set(0,0,40);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xffffff);
document.body.appendChild(renderer.domElement);

const DEBUG_MODE = false;
let gui;
if(DEBUG_MODE){
    gui = new dat.GUI();
    gui.add(params, "row", 1, 8).onChange(updateGallery);
    gui.add(params, "columns", 1, 10).onChange(updateGallery);
    gui.add(params, "imageWidth", 0, 10).onChange(updateGallery);
    gui.add(params, "imageHeight", 0, 10).onChange(updateGallery);
    gui.add(params, "spacing", 2, 10).onChange(updateGallery);
    gui.add(params, "curvature", 0, 10).onChange(updateGallery);
    gui.add(params, "verticalCurvature", 0, 2).onChange(updateGallery);
    gui.add(params, "depth", 5, 50).onChange(updateGallery);
    gui.add(params, "elevation", -10, 10).onChange(updateGallery);
    gui.add(params, "lookAtRange", 5, 50).name("look Range");
}

const header = document.querySelector("header");
let headerRotationX = 0;
let headerRotationY = 0;
let headerRotationZ = 0;

let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

const lookAtTarget = new THREE.Vector3(0,0,0);

/**
 * Create texture loader for images
 */
const textureLoader = new THREE.TextureLoader();

/**
 * Create plane with image texture
 */
function createVideoPlane(row, col) {
    // Random image selection
    const imageData = data[Math.floor(Math.random() * data.length)];

    const geometry = new THREE.PlaneGeometry(
        params.imageWidth,
        params.imageHeight,
    );

    // Load image texture instead of video
    const texture = textureLoader.load(imageData.name);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;

    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
    });

    const plane = new THREE.Mesh(geometry, material);
    const {x, y, z, rotationX, rotationY} = calculatePosition(row, col);

    plane.position.set(x, y, z);
    plane.rotation.x = rotationX;
    plane.rotation.y = rotationY;

    plane.userData.basePosition = {x, y, z};
    plane.userData.baseRotation = {x: rotationX, y: rotationY, z: 0};
    plane.userData.parallaxFactor = Math.random() * 0.5 + 0.5;
    plane.userData.randomoffset = {
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random() * 2 - 1,
    };
    plane.userData.rotationModifier = {
        x: Math.random() * 0.15 - 0.075,
        y: Math.random() * 0.15 - 0.075,
        z: Math.random() * 0.2 - 0.1,
    };
    plane.userData.phaseoffset = Math.random() * Math.PI * 2;

    // Add click interaction
    plane.userData.onClick = () => {
        isPaused = true;
        createImagePopup(texture);
    };

    return plane;
}

/**
 * Simplified gallery update function for images
 */
function updateGallery() {
    videos.forEach((plane) => {
        scene.remove(plane);
    });

    videos = [];

    for(let row = 0; row < params.row; row++) {
        for(let col = 0; col < params.columns; col++) {
            const plane = createVideoPlane(row, col);
            videos.push(plane);
            scene.add(plane);
        }
    }
}

/**
 * 计算给定点的旋转角度
 * 该函数用于根据给定的x和y坐标计算点在三维空间中的旋转角度
 * 旋转角度包括绕x轴和绕y轴的旋转，旨在为创建某种视觉效果或动画
 * 
 * @param {number} x - 点的x坐标
 * @param {number} y - 点的y坐标
 * @returns {Object} 返回一个包含绕x轴和绕y轴旋转角度的对象
 */
function calculateRotation(x,y){
    // 计算绕y轴旋转的曲率系数
    const a = 1/(params.depth * params.curvature);
    // 计算斜率，用于确定绕y轴的旋转角度
    const slopeY = -2 * a * x;
    // 计算绕y轴的旋转角度
    const rotationY = Math.atan(slopeY);

    // 垂直方向的曲率因子
    const verticalFactor = params.verticalCurvature;
    // 计算最大的y轴距离，用于归一化y值
    const maxYDistance = (params.row * params.spacing) / 2;
    // 对y值进行归一化处理
    const normalizedY = y / maxYDistance;
    // 计算绕x轴的旋转角度
    const rotationX = normalizedY * verticalFactor;

    // 返回计算得到的旋转角度
    return {rotationX, rotationY};
}

/**
 * 根据行和列计算位置
 * 此函数用于根据给定的行和列参数计算出一个三维位置和旋转角度
 * 它考虑了全局参数如列数、行数、间距、深度、曲率等，以计算最终的位置和旋转角度
 * 
 * @param {number} row - 行号，表示在网格中的垂直位置
 * @param {number} col - 列号，表示在网格中的水平位置
 * @returns {Object} - 返回一个包含x、y、z坐标以及rotationX和rotationY旋转角度的对象
 */
function calculatePosition(row,col){
    // 计算x轴位置，相对于中心点的偏移量，乘以间距得到实际位置
    let x = (col - params.columns  / 2) * params.spacing;
    // 计算y轴位置，相对于中心点的偏移量，乘以间距得到实际位置
    let y = (row - params.row  / 2) * params.spacing;

    // 根据x轴位置计算z轴位置，使用深度和曲率参数来调整z轴位置
    let z = (x * x)/(params.depth * params.curvature);

    // 计算归一化的y轴位置，用于后续的z轴位置调整
    const normalizedY = y/((params.row * params.spacing)/2);
    // 根据归一化的y轴位置调整z轴位置，以模拟垂直方向的曲率
    z += Math.abs(normalizedY) * normalizedY * params.verticalCurvature * 5;
    
    // 在y轴位置上加上一个基础的高度，以模拟整体的提升
    y += params.elevation;

    // 计算旋转角度，根据x和y轴的位置
    const {rotationX, rotationY} = calculateRotation(x,y);

    // 返回计算出的位置和旋转角度
    return {x,y,z,rotationX,rotationY};
}

let videos = [];

document.addEventListener("mousemove",(event) => {
    mouseX = (event.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
    mouseY = (event.clientY - window.innerHeight / 2) / (window.innerHeight / 2);

    headerRotationX = mouseX * 30;
    headerRotationY = mouseY * 30;
    headerRotationZ = Math.abs(mouseX * mouseY) * 50;
});


window.addEventListener("resize",() => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

/**
 * 主动画函数，用于更新场景中的元素位置和状态
 * 使用requestAnimationFrame实现动画循环
 */
function animate(){
    requestAnimationFrame(animate);

    if (!isPaused) {
        // 如果header元素存在，更新其变换属性
        if (header) {
            // 构造header元素的目标变换属性，包括透视、旋转和缩放
            const targetTransform = `
            translate(-50%,-50%)
            perspective(1000px)
            rotateX(${headerRotationX}deg)
            rotateY(${headerRotationY}deg)
            translateZ(${headerRotationZ}px)
            `;

            // 应用变换属性，并设置变换的过渡效果
            header.style.transform = targetTransform;
            header.style.transition = "transform 0.5s cubic-bezier(0.215,0.61,0.355,1)";
        }

        // 平滑处理鼠标位置，以实现更流畅的动画效果
        targetX += (mouseX - targetX) * 0.05;
        targetY += (mouseY - targetY) * 0.05;

        // 根据鼠标位置和参数计算出视角目标点的坐标
        lookAtTarget.x = targetX * params.lookAtRange;
        lookAtTarget.y = -targetY * params.lookAtRange;
        lookAtTarget.z = 
        (lookAtTarget.x * lookAtTarget.x) / (params.depth * params.curvature);

        // 获取当前时间，用于计算动画帧的时长
        const time = performance.now() * 0.001

        // 遍历每个视频平面，更新其位置和旋转
        videos.forEach((plane) => {
            const{
                basePosition,
                baseRotation,
                parallaxFactor,
                randomoffset,
                rotationModifier,
                phaseoffset,
            } = plane.userData;

            // 计算鼠标到中心的距离，用于后续的视差和旋转计算
            const mouseDistance = Math.sqrt(targetX * targetX  + targetY * targetY);
            // 计算视差滚动的X和Y轴偏移量
            const parallaxX = targetX * parallaxFactor * 3 * randomoffset.x;
            const parallaxY = targetY * parallaxFactor * 3 * randomoffset.y;
            // 计算随时间波动的振荡效果
            const oscillation = Math.sin(time + phaseoffset) * mouseDistance * 0.01;

            // 更新视频平面的位置，结合基础位置、视差滚动和振荡效果
            plane.position.x = basePosition.x + parallaxX + oscillation * randomoffset.x;
            plane.position.y = basePosition.y + parallaxY + oscillation * randomoffset.y;
            plane.position.z = basePosition.z + oscillation * randomoffset.z * parallaxFactor;

            // 更新视频平面的旋转，结合基础旋转、鼠标位置和振荡效果
            plane.rotation.x = 
            baseRotation.x + targetY * rotationModifier.x +mouseDistance + oscillation * randomoffset.x * 0.2

            plane.rotation.y = 
            baseRotation.y + targetX * rotationModifier.y +mouseDistance + oscillation * randomoffset.y * 0.2

            plane.rotation.z = 
            baseRotation.z + targetX * targetY * randomoffset.z * 2 + oscillation * randomoffset.z * 0.3
        });

        // 更新摄像机的视角目标点
        camera.lookAt(lookAtTarget);
    }

    renderer.render(scene,camera);
}

// Add click event listener for the scene
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// Simplified touch handling
function handlePointerEvent(event) {
    // Get coordinates from either mouse or touch event
    const point = event.touches ? event.touches[0] : event;
    const x = (point.clientX / window.innerWidth) * 2 - 1;
    const y = -(point.clientY / window.innerHeight) * 2 + 1;

    // Update mouse/touch position
    mouseX = x;
    mouseY = y;

    // Handle clicks/taps
    if (event.type === 'mousedown' || event.type === 'touchstart') {
        if (activePopup && !activePopup.contains(event.target)) {
            document.body.removeChild(activePopup);
            activePopup = null;
            isPaused = false;
            return;
        }

        // Check for image clicks
        pointer.set(x, y);
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(videos);

        if (intersects.length > 0) {
            intersects[0].object.userData.onClick?.();
        }
    }
}

// Unified event listeners
window.addEventListener('mousemove', handlePointerEvent);
window.addEventListener('mousedown', handlePointerEvent);
window.addEventListener('touchstart', handlePointerEvent, { passive: false });
window.addEventListener('touchmove', handlePointerEvent, { passive: false });

// Modify the popup creation to handle touch events
function createImagePopup(texture) {
    // Remove existing popup if any
    if (activePopup) {
        document.body.removeChild(activePopup);
        activePopup = null;
    }

    // Create popup container
    const popup = document.createElement('div');
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1000;
        cursor: pointer;
        transition: transform 0.3s ease;
    `;

    // Create image element
    const img = document.createElement('img');
    img.src = texture.image.src;
    img.style.cssText = `
        max-width: 80vw;
        max-height: 80vh;
        object-fit: contain;
        box-shadow: 0 0 20px rgba(0,0,0,0.3);
    `;

    popup.appendChild(img);
    document.body.appendChild(popup);
    activePopup = popup;

    // Add click event to close popup
    popup.addEventListener('click', closePopup);
    popup.addEventListener('touchstart', (e) => {
        e.preventDefault();
        closePopup();
    });

    function closePopup() {
        document.body.removeChild(popup);
        activePopup = null;
        isPaused = false;
    }
}

updateGallery();
animate();