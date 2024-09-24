import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import "../css/WebEditor.css";
import { render } from '@testing-library/react';

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

  const [sceneSettings, setSceneSettings] = useState({ // 조명 세팅
    rendererBackgroundColor: "#ffffff",
    directionalLightColor: "#ffffff",
    directionalLightIntensity: 1,
    ambientLightColor: "#ffffff",
    ambientLightIntensity: 1,
    directionalLightPosX: 0,
    directionalLightPosY: 1,
    directionalLightPosZ: 0,
  });

  const [shapeSettings, setShapeSettings] = useState({ // 모양 세팅
    width: 1,
    height: 1,
    depth: 1,
    radius: 1,
    color: '#ffffff',
    posX: 0,
    posY: 0,
    posZ: 0,
  });

  const [shapeModifySettings, setShapeModifySettings] = useState({ // 모양 수정 세팅
    width: 1,
    height: 1,
    depth: 1,
    radius: 1,
    color: '#ffffff',
    posX: 0,
    posY: 0,
    posZ: 0,
  });

  const [editingIndex, setEditingIndex] = useState(null); // 수정 중인 도형의 인덱스

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
    renderer.setSize(window.innerWidth / 1.2, 900);
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

  /*
  useEffect(() => {
    const controls = controlsRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
  }, [shapeSettings]);
  */

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
      case 'depth':
        material = new THREE.MeshDepthMaterial({ color });
        break;
      case 'matcap':
        material = new THREE.MeshMatcapMaterial({ color });
        break;
      case 'toon':
        material = new THREE.MeshToonMaterial({ color });
        break;
      case 'physical':
        material = new THREE.MeshPhysicalMaterial({ color });
        break;
      default:
        material = new THREE.MeshStandardMaterial({ color });
    }

    switch (selectedShape) {
      case 'box':
        geometry = new THREE.BoxGeometry(width, height, depth);
        break;
      case 'capsule':
        geometry = new THREE.CapsuleGeometry(radius, depth, 16, 50);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(radius, height, 32);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
        break;
      case 'dodecahedron':
        geometry = new THREE.DodecahedronGeometry(radius, 3);
        break;
      case 'icosahedron':
        geometry = new THREE.IcosahedronGeometry(radius, 3);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(radius, 32, 32);
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

  const editShape = (index) => {
    const obj = objects[index];
    setShapeSettings({
      width: obj.geometry.parameters.width || 1,
      height: obj.geometry.parameters.height || 1,
      depth: obj.geometry.parameters.depth || 1,
      radius: obj.geometry.parameters.radius || 1,
      color: `#${obj.material.color.getHexString()}`,
      posX: obj.position.x,
      posY: obj.position.y,
      posZ: obj.position.z,
    });
    setEditingIndex(index);
  };

  const applyChanges = () => {
    if (editingIndex !== null) {
      const obj = objects[editingIndex];
      obj.material.dispose(); // 기존 재질 제거

      let material;
      const color = shapeSettings.color;
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
      case 'depth':
        material = new THREE.MeshDepthMaterial({ color });
        break;
      case 'matcap':
        material = new THREE.MeshMatcapMaterial({ color });
        break;
      case 'toon':
        material = new THREE.MeshToonMaterial({ color });
        break;
      case 'physical':
        material = new THREE.MeshPhysicalMaterial({ color });
        break;
      default:
        material = new THREE.MeshStandardMaterial({ color });
    }

      obj.material = material;
      obj.position.set(shapeSettings.posX, shapeSettings.posY, shapeSettings.posZ);
      setEditingIndex(null); // 수정 모드 해제
    }
  };


  const removeShape = (index) => {
    const updatedObjects = [...objects];
    const objToRemove = updatedObjects[index];
    sceneRef.current.remove(objToRemove);
    setObjects(updatedObjects.filter((_, i) => i !== index));
    setEditingIndex(null);
  };

  const [intervalId, setIntervalId] = useState(null);

  const handleMouseEnter = (index) => {
    
    const obj = objects[index];
  
    // Save the original color
    const originalColor = obj.material.color.getHex();
  
    // Start the color transition effect
    const rainbowColors = [
      0xff0000, // Red
      0xff7f00, // Orange
      0xffff00, // Yellow
      0x00ff00, // Green
      0x0000ff, // Blue
      0x4b0082, // Indigo
      0x8b00ff  // Violet
    ];
  
    let colorIndex = 0;
    let colorTransitionInterval = null;
  
    // Function to update the color
    const updateColor = () => {
      obj.material.color.setHex(rainbowColors[colorIndex]);
      colorIndex = (colorIndex + 1) % rainbowColors.length;
    };
  
    // Change color every 500ms
    colorTransitionInterval = setInterval(updateColor, 500);
  
    // Store interval ID and original color
    setIntervalId(colorTransitionInterval);
    obj.userData.originalColor = originalColor;
  };
  
  const handleMouseLeave = (index) => {
    const obj = objects[index];
  
    // Revert to the original color
    if (obj.material) {
      obj.material.color.setHex(obj.userData.originalColor || 0xffffff);
    }
  
    // Clear the color transition interval
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
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
                  <option value="capsule">Capsule</option>
                  <option value="cone">Cone</option>
                  <option value="cylinder">Cylinder</option>
                  <option value="dodecahedron">Dodecahedron</option>
                  <option value="icosahedron">Icosahedron</option>
                  <option value="sphere">Sphere</option>
                  <option value="torus">Torus</option>
                </select>
              </div>
              <div>
                <label>재질 선택 :</label>
                <select value={selectedMaterial} onChange={(e) => setSelectedMaterial(e.target.value)}>
                  <option value="basic">Basic</option>
                  <option value="depth">Depth</option>
                  <option value="lambert">Lambert</option>
                  <option value="matcap">Matcap</option>
                  <option value="phong">Phong</option>
                  <option value="physical">Physical</option>
                  <option value="standard">Standard</option>
                  <option value="toon">Toon</option>
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
                  <div key={index}>
                    <span  onMouseEnter={() => handleMouseEnter(index)} onMouseLeave={() => handleMouseLeave(index)}>도형 {index + 1} </span>
                    <button onClick={() => editShape(index)}>도형 수정</button>
                    <button onClick={() => removeShape(index)}>삭제</button>
                  </div>
                ))}
                {editingIndex !== null && (
              <div style={{ border: '2px solid black', padding: '10px', marginTop: '10px', backgroundColor: 'rgba(255, 255, 255, 1)'}}>
                <h3>도형 {editingIndex + 1} 수정 중</h3>
                <div>
                <label>재질 선택 :</label>
                <select value={selectedMaterial} onChange={(e) => setSelectedMaterial(e.target.value)}>
                  <option value="basic">Basic</option>
                  <option value="depth">Depth</option>
                  <option value="lambert">Lambert</option>
                  <option value="matcap">Matcap</option>
                  <option value="phong">Phong</option>
                  <option value="physical">Physical</option>
                  <option value="standard">Standard</option>
                  <option value="toon">Toon</option>
                </select>
              </div>
                <div>
                  <label>가로 (Width):</label>
                  <input type="number" id="width" value={shapeSettings.width} onChange={handleShapeChange} /><br />
                  <label>세로 (Height):</label>
                  <input type="number" id="height" value={shapeSettings.height} onChange={handleShapeChange} /><br />
                  <label>깊이 (Depth):</label>
                  <input type="number" id="depth" value={shapeSettings.depth} onChange={handleShapeChange} /><br />
                </div>
                <div>
                  <label>색상 (Color):</label>
                  <input type="color" id="color" value={shapeSettings.color} onChange={handleShapeChange} />
                </div>
                <div>
                  <label>X : </label>
                  <input type="number" id="posX" value={shapeSettings.posX} onChange={handleShapeChange} /><br />
                  <label>Y : </label>
                  <input type="number" id="posY" value={shapeSettings.posY} onChange={handleShapeChange} /><br />
                  <label>Z : </label>
                  <input type="number" id="posZ" value={shapeSettings.posZ} onChange={handleShapeChange} /><br />
                </div>
                <button onClick={applyChanges}>적용</button>
              </div>
            )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebEditor;