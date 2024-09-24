import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import "../css/WebEditor.css";

const WebEditor = () => {
  const canvasRef = useRef();
  const sceneRef = useRef();
  const rendererRef = useRef();
  const cameraRef = useRef();
  const controlsRef = useRef();
  const ambientLightRef = useRef();
  const directionalLightRef = useRef();
  const [objects, setObjects] = useState([]);
  const [selectedShape, setSelectedShape] = useState('box');
  const [selectedMaterial, setSelectedMaterial] = useState('standard'); // 재질 선택
  const [shapeSettings, setShapeSettings] = useState({
    width: 1,
    height: 1,
    depth: 1,
    radius: 1,
    color: '#ffffff',
    posX: 0,
    posY: 0,
    posZ: 0,
  });

  const [sceneSettings, setSceneSettings] = useState({
    rendererBackgroundColor: "#ffffff",
    directionalLightColor: "#ffffff",
    directionalLightIntensity: 1,
    ambientLightColor: "#ffffff",
    ambientLightIntensity: 1,
    directionalLightPosX: 0,
    directionalLightPosY: 1,
    directionalLightPosZ: 0,
  });

  useEffect(() => {
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(window.innerWidth, 900);
    renderer.setClearColor(sceneSettings.rendererBackgroundColor, 1);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;

    const axesHelper = new THREE.AxesHelper(50);
    scene.add(axesHelper);

    const gridHelper = new THREE.GridHelper(100, 100);
    scene.add(gridHelper);

    const ambientLight = new THREE.AmbientLight(sceneSettings.ambientLightColor, sceneSettings.ambientLightIntensity);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const directionalLight = new THREE.DirectionalLight(sceneSettings.directionalLightColor, sceneSettings.directionalLightIntensity);
    directionalLight.position.set(sceneSettings.directionalLightPosX, sceneSettings.directionalLightPosY, sceneSettings.directionalLightPosZ);
    scene.add(directionalLight);
    directionalLightRef.current = directionalLight;

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
      scene.clear();
    };
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setClearColor(sceneSettings.rendererBackgroundColor, 1);
    }
    if (ambientLightRef.current) {
      ambientLightRef.current.color.set(sceneSettings.ambientLightColor);
      ambientLightRef.current.intensity = sceneSettings.ambientLightIntensity;
    }
    if (directionalLightRef.current) {
      directionalLightRef.current.color.set(sceneSettings.directionalLightColor);
      directionalLightRef.current.intensity = sceneSettings.directionalLightIntensity;
      directionalLightRef.current.position.set(
        sceneSettings.directionalLightPosX,
        sceneSettings.directionalLightPosY,
        sceneSettings.directionalLightPosZ
      );
    }
  }, [sceneSettings]);

  const handleChange = (event) => {
    const { id, value } = event.target;
    setSceneSettings((prevSettings) => ({
      ...prevSettings,
      [id]: id.includes('Intensity') || id.includes('Pos') ? parseFloat(value) : value,
    }));
  };

  const handleShapeChange = (event) => {
    const { id, value } = event.target;
    setShapeSettings((prevSettings) => ({
      ...prevSettings,
      [id]: id.includes('width') || id.includes('height') || id.includes('depth') || id.includes('radius') || id.includes('pos') ? parseFloat(value) : value,
    }));
  };

  const addShape = () => {
    const { width, height, depth, radius, color, posX, posY, posZ } = shapeSettings;
    let geometry;
    let material;

    // 재질 선택 로직
    switch (selectedMaterial) {
      case 'basic':
        material = new THREE.MeshBasicMaterial({ color });
        break;
      case 'standard':
        material = new THREE.MeshStandardMaterial({ color });
        break;
      case 'phong':
        material = new THREE.MeshPhongMaterial({ color });
        break;
      case 'lambert':
        material = new THREE.MeshLambertMaterial({ color });
        break;
      default:
        material = new THREE.MeshStandardMaterial({ color });
    }

    switch (selectedShape) {
      case 'box':
        geometry = new THREE.BoxGeometry(width, height, depth);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(radius, 32, 32);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(radius, height, 32);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(radius, radius / 2, 16, 100);
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(posX, posY, posZ);
    sceneRef.current.add(mesh);
    setObjects((prevObjects) => [...prevObjects, mesh]);
  };

  const removeShape = (index) => {
    const updatedObjects = [...objects];
    const objToRemove = updatedObjects[index];
    sceneRef.current.remove(objToRemove);
    setObjects(updatedObjects.filter((_, i) => i !== index));
  };

  const [hoveredObjectIndex, setHoveredObjectIndex] = useState(null);
  const [intervalId, setIntervalId] = useState(null);

  const handleMouseEnter = (index) => {
    setHoveredObjectIndex(index);
    const obj = objects[index];

    let isEmissiveOn = false;

    // 0.5초 간격으로 깜빡이는 효과
    const blinkInterval = setInterval(() => {
      if (obj.material && obj.material.emissive) {
        if (isEmissiveOn) {
          obj.material.emissive.setHex(0x000000); // 어둡게
        } else {
          obj.material.emissive.setHex(0xffffff); // 밝게
        }
        isEmissiveOn = !isEmissiveOn;
      }
    }, 500); // 500ms 간격으로 깜빡임

    setIntervalId(blinkInterval);
  };

  const handleMouseLeave = (index) => {
    const obj = objects[index];

    // 마우스가 떠났을 때, emissive를 원상복귀하고 깜빡임 중단
    if (obj.material && obj.material.emissive) {
      obj.material.emissive.setHex(0x000000); // 빛을 제거
    }

    if (intervalId) {
      clearInterval(intervalId); // 깜빡임 중지
      setIntervalId(null);
    }

    setHoveredObjectIndex(null);
  };

  const resetControls = () => {
    setSceneSettings({
      directionalLightColor: "#ffffff",
      directionalLightIntensity: 1,
      ambientLightColor: "#ffffff",
      ambientLightIntensity: 1,
      directionalLightPosX: 0,
      directionalLightPosY: 1,
      directionalLightPosZ: 0,
    });
  };

  return (
    <div>
      <div className="ThreeD-div-webEditor">
        <div className="canvas-container-webEditor">
          <canvas ref={canvasRef}></canvas>
          <div id="information-webEditor">
            <div style={{ fontWeight: 'bold', border: '2px solid black', padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.5)' }}>
              <div>
                <label>배경 색 변경 :</label>
                <input type="color" id="rendererBackgroundColor" value={sceneSettings.rendererBackgroundColor} onChange={handleChange} />
              </div>
              <br />
              <div>
                <label>Directional Light Color:</label>
                <input type="color" id="directionalLightColor" value={sceneSettings.directionalLightColor} onChange={handleChange} />
                <label> Intensity :</label>
                <input type="range" id="directionalLightIntensity" min="0" max="5" step="0.01" value={sceneSettings.directionalLightIntensity} onChange={handleChange} />
              </div>
              <div>
                <label>Ambient Light Color :</label>
                <input type="color" id="ambientLightColor" value={sceneSettings.ambientLightColor} onChange={handleChange} />
                <label> Intensity :</label>
                <input type="range" id="ambientLightIntensity" min="0" max="5" step="0.01" value={sceneSettings.ambientLightIntensity} onChange={handleChange} />
              </div>
              <div>
                <label>Directional Light Position X :</label>
                <input type="range" id="directionalLightPosX" min="-100" max="100" step="0.1" value={sceneSettings.directionalLightPosX} onChange={handleChange} />
              </div>
              <div>
                <label>Directional Light Position Y :</label>
                <input type="range" id="directionalLightPosY" min="-100" max="100" step="0.1" value={sceneSettings.directionalLightPosY} onChange={handleChange} />
              </div>
              <div>
                <label>Directional Light Position Z :</label>
                <input type="range" id="directionalLightPosZ" min="-100" max="100" step="0.1" value={sceneSettings.directionalLightPosZ} onChange={handleChange} />
              </div>
              <button onClick={resetControls} style={{ marginTop: '10px' }}>Reset Light</button>
              </div>

              <br />
              <div style={{ fontWeight: 'bold', border: '2px solid black', padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.5)' }}>
              <div>
                <label>도형 선택 :</label>
                <select value={selectedShape} onChange={(e) => setSelectedShape(e.target.value)}>
                  <option value="box">Box</option>
                  <option value="sphere">Sphere</option>
                  <option value="cylinder">Cylinder</option>
                  <option value="cone">Cone</option>
                  <option value="torus">Torus</option>
                </select>
              </div>
              <div>
                <label>재질 선택 :</label>
                <select value={selectedMaterial} onChange={(e) => setSelectedMaterial(e.target.value)}>
                  <option value="basic">Basic</option>
                  <option value="lambert">Lambert</option>
                  <option value="standard">Standard</option>
                  <option value="phong">Phong</option>
                </select>
              </div>
              <div>
                <label>도형 색상 :</label>
                <input type="color" id="color" value={shapeSettings.color} onChange={handleShapeChange} />
              </div>
              <br />
              <div>
                <label>가로 (Width):</label>
                <input type="number" id="width" value={shapeSettings.width} onChange={handleShapeChange} /><br/>
                <label>세로 (Height):</label>
                <input type="number" id="height" value={shapeSettings.height} onChange={handleShapeChange}/><br/>
                <label>깊이 (Depth):</label>
                <input type="number" id="depth" value={shapeSettings.depth} onChange={handleShapeChange}/><br/>
              </div>
              <div>
                <label>반지름 (Radius):</label>
                <input type="number" id="radius" value={shapeSettings.radius} onChange={handleShapeChange} />
              </div>
              <br />
              <div>
                <label>X : </label>
                <input style={{ width:"40px"}} type="number" id="posX" value={shapeSettings.posX} onChange={handleShapeChange} />
                <label> Y : </label>
                <input style={{ width:"40px"}} type="number" id="posY" value={shapeSettings.posY} onChange={handleShapeChange} />
                <label> Z : </label>
                <input style={{ width:"40px"}} type="number" id="posZ" value={shapeSettings.posZ} onChange={handleShapeChange} />
              </div>
              <br />
              <button onClick={addShape}>도형 추가</button>
              </div>
              <br/>

              <div style={{ fontWeight: 'bold', border: '2px solid black', padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.5)', maxHeight:'300px', overflowY:'auto'}}>
                <h3>추가된 도형 목록</h3>
                {objects.map((obj, index) => (
                  <div
                    key={index}
                    onMouseEnter={() => handleMouseEnter(index)}
                    onMouseLeave={() => handleMouseLeave(index)}
                  >
                    <span>도형 {index + 1}</span>
                    <button onClick={() => removeShape(index)}>삭제</button>
                  </div>
                ))}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebEditor;