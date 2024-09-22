import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import '../css/WebEditor.css'

const WebEditor = () => {
    const mountRef = useRef(null);
    const [selectedShape, setSelectedShape] = useState(null);
    const [config, setConfig] = useState({});
    const [shapes, setShapes] = useState([]);
    const [lighting, setLighting] = useState({
        ambientLightColor: "#ffffff",
        ambientLightIntensity: 1,
        directionalLightColor: "#ffffff",
        directionalLightIntensity: 1,
        directionalLightPosition: { x: 5, y: 5, z: 5 },
        pointLightColor: "#ffffff",
        pointLightIntensity: 1,
        pointLightPosition: { x: -5, y: 5, z: 5 },
        spotLightColor: "#ffffff",
        spotLightIntensity: 1,
        spotLightPosition: { x: 0, y: 5, z: 5 },
    });

    // Range 슬라이더의 값이 변경될 때마다 값을 업데이트
    const sliders = document.querySelectorAll('.light-information input[type="range"]');

    sliders.forEach(slider => {
        const span = slider.nextElementSibling;
        slider.addEventListener('input', () => {
            span.textContent = slider.value;
        });
    });
    const rendererRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    const lightsRef = useRef({});

    useEffect(() => {
        // Setup scene, camera, renderer, and controls
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0xffffff); // 배경을 하얀색으로 설정
        mountRef.current.appendChild(renderer.domElement);
        camera.position.z = 5;

        // OrbitControls 추가
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        // AxesHelper (축 헬퍼) 추가
        const axesHelper = new THREE.AxesHelper(50);
        scene.add(axesHelper);

        // GridHelper (그리드 헬퍼) 추가
        const gridHelper = new THREE.GridHelper(100, 100);
        scene.add(gridHelper);

        // 조명 추가
        const ambientLight = new THREE.AmbientLight(lighting.ambientLightColor, lighting.ambientLightIntensity);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(lighting.directionalLightColor, lighting.directionalLightIntensity);
        directionalLight.position.set(lighting.directionalLightPosition.x, lighting.directionalLightPosition.y, lighting.directionalLightPosition.z).normalize();
        scene.add(directionalLight);

        const pointLight = new THREE.PointLight(lighting.pointLightColor, lighting.pointLightIntensity, 100);
        pointLight.position.set(lighting.pointLightPosition.x, lighting.pointLightPosition.y, lighting.pointLightPosition.z);
        scene.add(pointLight);

        const spotLight = new THREE.SpotLight(lighting.spotLightColor, lighting.spotLightIntensity);
        spotLight.position.set(lighting.spotLightPosition.x, lighting.spotLightPosition.y, lighting.spotLightPosition.z);
        spotLight.angle = Math.PI / 6;
        spotLight.penumbra = 0.1;
        spotLight.decay = 2;
        spotLight.distance = 200;
        scene.add(spotLight);

        rendererRef.current = renderer;
        sceneRef.current = scene;
        cameraRef.current = camera;
        controlsRef.current = controls;
        lightsRef.current = { ambientLight, directionalLight, pointLight, spotLight };

        return () => {
            // Cleanup
            mountRef.current.removeChild(renderer.domElement);
        };
    }, []);

    useEffect(() => {
        if (rendererRef.current && sceneRef.current && cameraRef.current && controlsRef.current) {
            const renderer = rendererRef.current;
            const scene = sceneRef.current;
            const camera = cameraRef.current;
            const controls = controlsRef.current;

            const animate = () => {
                requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            };
            animate();
        }
    }, []);

    // Function to create shapes
    const addShapeToScene = (shape) => {
        const scene = sceneRef.current;
        const { type, config } = shape;
        const { x = 0, y = 0, z = 0 } = config;
        const radialSegments = Math.max(3, config.radialSegments || 32); // 최소값 3으로 설정

        // Validation
        if (type === "box" && (config.width <= 0 || config.height <= 0 || config.depth <= 0)) {
            alert("Box dimensions must be greater than 0.");
            return;
        }
        if (type === "line" && config.length <= 0) {
            alert("Line length must be greater than 0.");
            return;
        }
        if (type === "sphere" && config.radius <= 0) {
            alert("Sphere radius must be greater than 0.");
            return;
        }
        if (type === "plane" && (config.width <= 0 || config.height <= 0)) {
            alert("Plane dimensions must be greater than 0.");
            return;
        }
        if (type === "circle" && config.radius <= 0) {
            alert("Circle radius must be greater than 0.");
            return;
        }
        if (type === "cylinder" && (config.radiusTop <= 0 || config.radiusBottom <= 0 || config.height <= 0)) {
            alert("Cylinder dimensions must be greater than 0.");
            return;
        }
        if (type === "cone" && (config.radius <= 0 || config.height <= 0)) {
            alert("Cone dimensions must be greater than 0.");
            return;
        }
        if (type === "torus" && (config.radius <= 0 || config.tube <= 0)) {
            alert("Torus dimensions must be greater than 0.");
            return;
        }

        let mesh;
        let material;

        // Material 선택
        switch (config.materialType) {
            case "basic":
                material = new THREE.MeshBasicMaterial({
                    color: config.color || 0xffffff,
                });
                break;
            case "lambert":
                material = new THREE.MeshLambertMaterial({
                    color: config.color || 0xffffff,
                });
                break;
            case "phong":
                material = new THREE.MeshPhongMaterial({
                    color: config.color || 0xffffff,
                });
                break;
            case "standard":
                material = new THREE.MeshStandardMaterial({
                    color: config.color || 0xffffff,
                });
                break;
            case "toon":
                material = new THREE.MeshToonMaterial({
                    color: config.color || 0xffffff,
                });
                break;
            case "depth":
                material = new THREE.MeshDepthMaterial();
                break;
            case "normal":
                material = new THREE.MeshNormalMaterial();
                break;
            default:
                material = new THREE.MeshBasicMaterial({
                    color: config.color || 0xffffff,
                });
        }

        if (type === "box") {
            const geometry = new THREE.BoxGeometry(
                config.width || 1,
                config.height || 1,
                config.depth || 1
            );
            mesh = new THREE.Mesh(geometry, material);
        } else if (type === "line") {
            const material = new THREE.LineBasicMaterial({
                color: config.color || 0xffffff,
            });
            const points = [];
            points.push(new THREE.Vector3(x, y, z));
            points.push(new THREE.Vector3(x + (config.length || 10), y, z));
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            mesh = new THREE.Line(geometry, material);
        } else if (type === "sphere") {
            const geometry = new THREE.SphereGeometry(
                config.radius || 1,
                config.widthSegments || 32,
                config.heightSegments || 16
            );
            mesh = new THREE.Mesh(geometry, material);
        } else if (type === "plane") {
            const geometry = new THREE.PlaneGeometry(
                config.width || 1,
                config.height || 1
            );
            mesh = new THREE.Mesh(geometry, material);
        } else if (type === "circle") {
            const geometry = new THREE.CircleGeometry(
                config.radius || 1,
                radialSegments
            );
            mesh = new THREE.Mesh(geometry, material);
        } else if (type === "cylinder") {
            const geometry = new THREE.CylinderGeometry(
                config.radiusTop || 1,
                config.radiusBottom || 1,
                config.height || 2,
                radialSegments
            );
            mesh = new THREE.Mesh(geometry, material);
        } else if (type === "cone") {
            const geometry = new THREE.ConeGeometry(
                config.radius || 1,
                config.height || 2,
                radialSegments
            );
            mesh = new THREE.Mesh(geometry, material);
        } else if (type === "torus") {
            const geometry = new THREE.TorusGeometry(
                config.radius || 1,
                config.tube || 0.4,
                config.radialSegments || 16,
                config.tubularSegments || 100
            );
            mesh = new THREE.Mesh(geometry, material);
        }

        if (mesh) {
            mesh.position.set(config.x || 0, config.y || 0, config.z || 0);
            scene.add(mesh);
            setShapes((prevShapes) => [...prevShapes, { type, config, mesh }]);
        }
    };

    const removeShapeFromScene = (index) => {
        const scene = sceneRef.current;
        const shapeToRemove = shapes[index];
        if (shapeToRemove) {
            scene.remove(shapeToRemove.mesh);
            setShapes((prevShapes) => prevShapes.filter((_, i) => i !== index));
        }
    };

    const handleAddShape = () => {
        if (selectedShape) {
            addShapeToScene({ type: selectedShape, config });
        }
    };

    const handleShapeSelect = (shape) => {
        setSelectedShape(shape);
        setConfig({});
    };

    const handleConfigChange = (e) => {
        setConfig({
            ...config,
            [e.target.name]: e.target.value,
        });
    };

    const handleLightingChange = (e) => {
        setLighting({
            ...lighting,
            [e.target.name]: e.target.value,
        });

        // 조명 업데이트
        if (lightsRef.current.ambientLight) {
            lightsRef.current.ambientLight.color.set(lighting.ambientLightColor);
            lightsRef.current.ambientLight.intensity = lighting.ambientLightIntensity;
        }
        if (lightsRef.current.directionalLight) {
            lightsRef.current.directionalLight.color.set(lighting.directionalLightColor);
            lightsRef.current.directionalLight.intensity = lighting.directionalLightIntensity;
            lightsRef.current.directionalLight.position.set(
                lighting.directionalLightPosition.x,
                lighting.directionalLightPosition.y,
                lighting.directionalLightPosition.z
            );
        }
        if (lightsRef.current.pointLight) {
            lightsRef.current.pointLight.color.set(lighting.pointLightColor);
            lightsRef.current.pointLight.intensity = lighting.pointLightIntensity;
            lightsRef.current.pointLight.position.set(
                lighting.pointLightPosition.x,
                lighting.pointLightPosition.y,
                lighting.pointLightPosition.z
            );
        }
        if (lightsRef.current.spotLight) {
            lightsRef.current.spotLight.color.set(lighting.spotLightColor);
            lightsRef.current.spotLight.intensity = lighting.spotLightIntensity;
            lightsRef.current.spotLight.position.set(
                lighting.spotLightPosition.x,
                lighting.spotLightPosition.y,
                lighting.spotLightPosition.z
            );
        }
    };

    return (
        <div>
            <div>
                <button onClick={() => handleShapeSelect("box")}>Add Box</button>
                <button onClick={() => handleShapeSelect("line")}>Add Line</button>
                <button onClick={() => handleShapeSelect("sphere")}>Add Sphere</button>
                <button onClick={() => handleShapeSelect("plane")}>Add Plane</button>
                <button onClick={() => handleShapeSelect("circle")}>Add Circle</button>
                <button onClick={() => handleShapeSelect("cylinder")}>Add Cylinder</button>
                <button onClick={() => handleShapeSelect("cone")}>Add Cone</button>
                <button onClick={() => handleShapeSelect("torus")}>Add Torus</button>
            </div>

            {selectedShape && (
                <div>
                    <h3>Configure {selectedShape}</h3>
                    <label>
                        X Position:
                        <input
                            type="number"
                            name="x"
                            value={config.x || ""}
                            onChange={handleConfigChange}
                        />
                    </label>
                    <label>
                        Y Position:
                        <input
                            type="number"
                            name="y"
                            value={config.y || ""}
                            onChange={handleConfigChange}
                        />
                    </label>
                    <label>
                        Z Position:
                        <input
                            type="number"
                            name="z"
                            value={config.z || ""}
                            onChange={handleConfigChange}
                        />
                    </label>

                    {/* 선택된 도형에 따라 추가적인 설정 */}
                    {selectedShape === "box" && (
                        <>
                            <label>
                                Width:
                                <input
                                    type="number"
                                    name="width"
                                    value={config.width || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                            <label>
                                Height:
                                <input
                                    type="number"
                                    name="height"
                                    value={config.height || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                            <label>
                                Depth:
                                <input
                                    type="number"
                                    name="depth"
                                    value={config.depth || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                        </>
                    )}
                    {selectedShape === "line" && (
                        <>
                            <label>
                                Length:
                                <input
                                    type="number"
                                    name="length"
                                    value={config.length || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                        </>
                    )}
                    {selectedShape === "sphere" && (
                        <>
                            <label>
                                Radius:
                                <input
                                    type="number"
                                    name="radius"
                                    value={config.radius || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                            <label>
                                Width Segments:
                                <input
                                    type="number"
                                    name="widthSegments"
                                    value={config.widthSegments || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                            <label>
                                Height Segments:
                                <input
                                    type="number"
                                    name="heightSegments"
                                    value={config.heightSegments || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                        </>
                    )}
                    {selectedShape === "plane" && (
                        <>
                            <label>
                                Width:
                                <input
                                    type="number"
                                    name="width"
                                    value={config.width || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                            <label>
                                Height:
                                <input
                                    type="number"
                                    name="height"
                                    value={config.height || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                        </>
                    )}
                    {selectedShape === "circle" && (
                        <>
                            <label>
                                Radius:
                                <input
                                    type="number"
                                    name="radius"
                                    value={config.radius || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                            <label>
                                Segments:
                                <input
                                    type="number"
                                    name="segments"
                                    value={config.segments || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                        </>
                    )}
                    {selectedShape === "cylinder" && (
                        <>
                            <label>
                                Radius Top:
                                <input
                                    type="number"
                                    name="radiusTop"
                                    value={config.radiusTop || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                            <label>
                                Radius Bottom:
                                <input
                                    type="number"
                                    name="radiusBottom"
                                    value={config.radiusBottom || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                            <label>
                                Height:
                                <input
                                    type="number"
                                    name="height"
                                    value={config.height || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                            <label>
                                Radial Segments:
                                <input
                                    type="number"
                                    name="radialSegments"
                                    value={config.radialSegments || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                        </>
                    )}
                    {selectedShape === "cone" && (
                        <>
                            <label>
                                Radius:
                                <input
                                    type="number"
                                    name="radius"
                                    value={config.radius || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                            <label>
                                Height:
                                <input
                                    type="number"
                                    name="height"
                                    value={config.height || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                            <label>
                                Radial Segments:
                                <input
                                    type="number"
                                    name="radialSegments"
                                    value={config.radialSegments || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                        </>
                    )}
                    {selectedShape === "torus" && (
                        <>
                            <label>
                                Radius:
                                <input
                                    type="number"
                                    name="radius"
                                    value={config.radius || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                            <label>
                                Tube:
                                <input
                                    type="number"
                                    name="tube"
                                    value={config.tube || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                            <label>
                                Radial Segments:
                                <input
                                    type="number"
                                    name="radialSegments"
                                    value={config.radialSegments || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                            <label>
                                Tubular Segments:
                                <input
                                    type="number"
                                    name="tubularSegments"
                                    value={config.tubularSegments || ""}
                                    onChange={handleConfigChange}
                                />
                            </label>
                        </>
                    )}
                    <button onClick={handleAddShape}>Add Shape</button>
                </div>
            )}
            <div className="webgl-canvas-container">
                <div ref={mountRef} style={{ width: "100%", height: "100vh" }}></div>
                <div className="light-information">
                    <h3>Lighting Settings</h3>
                    <label>
                        Ambient Light Color:
                        <input
                            type="color"
                            name="ambientLightColor"
                            value={lighting.ambientLightColor}
                            onChange={handleLightingChange}
                        />
                    </label>
                    <label>
                        Ambient Light Intensity:
                        <input
                            type="range"
                            name="ambientLightIntensity"
                            value={lighting.ambientLightIntensity}
                            min="0"
                            max="2"
                            step="0.1"
                            onChange={handleLightingChange}
                        />
                        <span>{lighting.ambientLightIntensity}</span>
                    </label>
                    <label>
                        Directional Light Color:
                        <input
                            type="color"
                            name="directionalLightColor"
                            value={lighting.directionalLightColor}
                            onChange={handleLightingChange}
                        />
                    </label>
                    <label>
                        Directional Light Intensity:
                        <input
                            type="range"
                            name="directionalLightIntensity"
                            value={lighting.directionalLightIntensity}
                            min="0"
                            max="2"
                            step="0.1"
                            onChange={handleLightingChange}
                        />
                        <span>{lighting.directionalLightIntensity}</span>
                    </label>
                    <label>
                        Directional Light X Position:
                        <input
                            type="range"
                            name="directionalLightPosition[x]"
                            value={lighting.directionalLightPosition.x}
                            min="-100"
                            max="100"
                            step="0.1"
                            onChange={handleLightingChange}
                        />
                        <span>{lighting.directionalLightPosition.x}</span>
                    </label>
                    <label>
                        Directional Light Y Position:
                        <input
                            type="range"
                            name="directionalLightPosition[y]"
                            value={lighting.directionalLightPosition.y}
                            min="-100"
                            max="100"
                            step="0.1"
                            onChange={handleLightingChange}
                        />
                        <span>{lighting.directionalLightPosition.y}</span>
                    </label>
                    <label>
                        Directional Light Z Position:
                        <input
                            type="range"
                            name="directionalLightPosition[z]"
                            value={lighting.directionalLightPosition.z}
                            min="-100"
                            max="100"
                            step="0.1"
                            onChange={handleLightingChange}
                        />
                        <span>{lighting.directionalLightPosition.z}</span>
                    </label>
                    <label>
                        Point Light Color:
                        <input
                            type="color"
                            name="pointLightColor"
                            value={lighting.pointLightColor}
                            onChange={handleLightingChange}
                        />
                    </label>
                    <label>
                        Point Light Intensity:
                        <input
                            type="range"
                            name="pointLightIntensity"
                            value={lighting.pointLightIntensity}
                            min="0"
                            max="2"
                            step="0.1"
                            onChange={handleLightingChange}
                        />
                        <span>{lighting.pointLightIntensity}</span>
                    </label>
                    <label>
                        Point Light X Position:
                        <input
                            type="range"
                            name="pointLightPosition[x]"
                            value={lighting.pointLightPosition.x}
                            min="-100"
                            max="100"
                            step="0.1"
                            onChange={handleLightingChange}
                        />
                        <span>{lighting.pointLightPosition.x}</span>
                    </label>
                    <label>
                        Point Light Y Position:
                        <input
                            type="range"
                            name="pointLightPosition[y]"
                            value={lighting.pointLightPosition.y}
                            min="-100"
                            max="100"
                            step="0.1"
                            onChange={handleLightingChange}
                        />
                        <span>{lighting.pointLightPosition.y}</span>
                    </label>
                    <label>
                        Point Light Z Position:
                        <input
                            type="range"
                            name="pointLightPosition[z]"
                            value={lighting.pointLightPosition.z}
                            min="-100"
                            max="100"
                            step="0.1"
                            onChange={handleLightingChange}
                        />
                        <span>{lighting.pointLightPosition.z}</span>
                    </label>
                    <label>
                        Spot Light Color:
                        <input
                            type="color"
                            name="spotLightColor"
                            value={lighting.spotLightColor}
                            onChange={handleLightingChange}
                        />
                    </label>
                    <label>
                        Spot Light Intensity:
                        <input
                            type="range"
                            name="spotLightIntensity"
                            value={lighting.spotLightIntensity}
                            min="0"
                            max="2"
                            step="0.1"
                            onChange={handleLightingChange}
                        />
                        <span>{lighting.spotLightIntensity}</span>
                    </label>
                    <label>
                        Spot Light X Position:
                        <input
                            type="range"
                            name="spotLightPosition[x]"
                            value={lighting.spotLightPosition.x}
                            min="-100"
                            max="100"
                            step="0.1"
                            onChange={handleLightingChange}
                        />
                        <span>{lighting.spotLightPosition.x}</span>
                    </label>
                    <label>
                        Spot Light Y Position:
                        <input
                            type="range"
                            name="spotLightPosition[y]"
                            value={lighting.spotLightPosition.y}
                            min="-100"
                            max="100"
                            step="0.1"
                            onChange={handleLightingChange}
                        />
                        <span>{lighting.spotLightPosition.y}</span>
                    </label>
                    <label>
                        Spot Light Z Position:
                        <input
                            type="range"
                            name="spotLightPosition[z]"
                            value={lighting.spotLightPosition.z}
                            min="-100"
                            max="100"
                            step="0.1"
                            onChange={handleLightingChange}
                        />
                        <span>{lighting.spotLightPosition.z}</span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default WebEditor;