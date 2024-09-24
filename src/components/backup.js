import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import "../css/WebEditor.css"

const WebEditor = () => {
  const mountRef = useRef(null);
  const [selectedShape, setSelectedShape] = useState(null);
  const [config, setConfig] = useState({});
  const [shapes, setShapes] = useState([]);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);

  // Setup scene, camera, renderer, and controls
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  
  // AxesHelper (축 헬퍼) 추가
  const axesHelper = new THREE.AxesHelper(50);
  // GridHelper (그리드 헬퍼) 추가
  const gridHelper = new THREE.GridHelper(100, 100);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  useEffect(() => {
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
    });
    renderer.setSize(window.innerWidth, 900);
    renderer.setClearColor(0xffffff); // 배경을 하얀색으로 설정
    mountRef.current.appendChild(renderer.domElement);
    camera.position.x = 5;
    camera.position.y = 5;
    camera.position.z = 5;

    // OrbitControls 추가
    const controls = new OrbitControls(camera, renderer.domElement);
    scene.add(axesHelper);
    scene.add(gridHelper);

    
    scene.add(ambientLight);

    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);

    const meshInfoDiv = document.getElementById('light-information'); // 불러오기
    meshInfoDiv.innerHTML = '';
    
    // 조명 값 조정 UI 추가 (색상 및 강도)
    const lightControlsDiv = document.createElement('div');
    lightControlsDiv.style.fontWeight = 'bold'; // 텍스트 굵게 표시
    lightControlsDiv.style.border = '2px solid black'; // 테두리 추가
    lightControlsDiv.style.padding = '10px'; // 테두리 안쪽 여백 추가
    lightControlsDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'; // 흰색에 50% 투명도
    lightControlsDiv.innerHTML = `
      <div>
        <label>배경 색 변경 :</label>
        <input type="color" id="rendererBackgroundColor-webgl" value="#ffffff" />
      </div>
      <br>
      <div>
        <label>Directional Light Color:</label>
        <input type="color" id="directionalLightColor-webgl" value="#ffffff" />
        <label>Intensity :</label>
        <input type="range" id="directionalLightIntensity-webgl" min="0" max="5" step="0.01" value="1" />
      </div>
      <div>
        <label>Ambient Light Color :</label>
        <input type="color" id="ambientLightColor-webgl" value="#ffffff" />
        <label>Intensity :</label>
        <input type="range" id="ambientLightIntensity-webgl" min="0" max="5" step="0.01" value="1" />
      </div>
      <div>
        <label>Directional Light Position X :</label>
        <input type="range" id="directionalLightPosX-webgl" min="-100" max="100" step="0.1" value="0" />
      </div>
      <div>
        <label>Directional Light Position Y :</label>
        <input type="range" id="directionalLightPosY-webgl" min="-100" max="100" step="0.1" value="1" />
      </div>
      <div>
        <label>Directional Light Position Z :</label>
        <input type="range" id="directionalLightPosZ-webgl" min="-100" max="100" step="0.1" value="0" />
      </div>
    `;
    meshInfoDiv.appendChild(lightControlsDiv);

    // Renderer 배경색 변경 이벤트 핸들러 정의
    const handleRendererBackgroundColorChange = (event) => {
      renderer.setClearColor(event.target.value);
    };

    // 조명 값 조정 UI에 초기화 버튼 추가
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset to Default';
    resetButton.style.marginTop = '10px'; // 버튼과 조명 조정 영역 사이의 간격 추가

    // 초기화 버튼 클릭 시 호출할 함수 정의
    const resetControls = () => {
      document.getElementById('directionalLightColor-webgl').value = '#ffffff';
      document.getElementById('directionalLightIntensity-webgl').value = '1';
      document.getElementById('ambientLightColor-webgl').value = '#ffffff';
      document.getElementById('ambientLightIntensity-webgl').value = '1';
      document.getElementById('directionalLightPosX-webgl').value = '0';
      document.getElementById('directionalLightPosY-webgl').value = '1';
      document.getElementById('directionalLightPosZ-webgl').value = '0';

      // 조명 값을 초기값으로 설정
      directionalLight.color.set(new THREE.Color('#ffffff'));
      directionalLight.intensity = 1;
      ambientLight.color.set(new THREE.Color('#ffffff'));
      ambientLight.intensity = 1;
      directionalLight.position.set(0, 1, 0);
    };

    // 초기화 버튼 클릭 이벤트 리스너 등록
    resetButton.addEventListener('click', resetControls);

    // 초기화 버튼을 조명 조정 UI에 추가
    lightControlsDiv.appendChild(resetButton);

    // Renderer 배경색 입력 이벤트 리스너 등록
    document.getElementById('rendererBackgroundColor-webgl').addEventListener('input', handleRendererBackgroundColorChange);

    // Directional Light Color Change
    document.getElementById('directionalLightColor-webgl').addEventListener('input', (event) => {
      const color = new THREE.Color(event.target.value);
      directionalLight.color.set(color);
    });

    // Directional Light Intensity Change
    document.getElementById('directionalLightIntensity-webgl').addEventListener('input', (event) => {
      directionalLight.intensity = parseFloat(event.target.value);
    });

    // Ambient Light Color Change
    document.getElementById('ambientLightColor-webgl').addEventListener('input', (event) => {
      const color = new THREE.Color(event.target.value);
      ambientLight.color.set(color);
    });

    // Ambient Light Intensity Change
    document.getElementById('ambientLightIntensity-webgl').addEventListener('input', (event) => {
      ambientLight.intensity = parseFloat(event.target.value);
    });

    // Directional Light Position X Change
    document.getElementById('directionalLightPosX-webgl').addEventListener('input', (event) => {
      directionalLight.position.x = parseFloat(event.target.value);
    });

    // Directional Light Position Y Change
    document.getElementById('directionalLightPosY-webgl').addEventListener('input', (event) => {
      directionalLight.position.y = parseFloat(event.target.value);
    });

    // Directional Light Position Z Change
    document.getElementById('directionalLightPosZ-webgl').addEventListener('input', (event) => {
      directionalLight.position.z = parseFloat(event.target.value);
    });

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    controlsRef.current = controls;

    return () => {
      // Cleanup
      mountRef.current.removeChild(renderer.domElement);
      lightControlsDiv.innerHTML = '';
      meshInfoDiv.innerHTML = '';
    };
  }, []);

  // Render loop
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
        material = new THREE.MeshBasicMaterial({ color: config.color || 0x000000 });
        break;
      case "lambert":
        material = new THREE.MeshLambertMaterial({ color: config.color || 0x000000 });
        break;
      case "phong":
        material = new THREE.MeshPhongMaterial({ color: config.color || 0x000000 });
        break;
      case "standard":
        material = new THREE.MeshStandardMaterial({ color: config.color || 0x000000 });
        break;
      default:
        material = new THREE.MeshBasicMaterial({ color: config.color || 0x000000 });
    }
  
    // Create geometry and mesh based on shape type
    switch (type) {
      case "box":
        const boxGeometry = new THREE.BoxGeometry(config.width || 1, config.height || 1, config.depth || 1);
        mesh = new THREE.Mesh(boxGeometry, material);
        break;
      case "line":
        const lineMaterial = new THREE.LineBasicMaterial({ color: config.color || 0xffffff });
        const points = [new THREE.Vector3(x, y, z), new THREE.Vector3(x + (config.length || 10), y, z)];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        mesh = new THREE.Line(lineGeometry, lineMaterial);
        break;
      case "sphere":
        const sphereGeometry = new THREE.SphereGeometry(config.radius || 1, config.widthSegments || 32, config.heightSegments || 16);
        mesh = new THREE.Mesh(sphereGeometry, material);
        break;
      case "plane":
        const planeGeometry = new THREE.PlaneGeometry(config.width || 1, config.height || 1);
        mesh = new THREE.Mesh(planeGeometry, material);
        break;
      case "circle":
        const circleGeometry = new THREE.CircleGeometry(config.radius || 1, radialSegments);
        mesh = new THREE.Mesh(circleGeometry, material);
        break;
      case "cylinder":
        const cylinderGeometry = new THREE.CylinderGeometry(config.radiusTop || 1, config.radiusBottom || 1, config.height || 2, radialSegments);
        mesh = new THREE.Mesh(cylinderGeometry, material);
        break;
      case "cone":
        const coneGeometry = new THREE.ConeGeometry(config.radius || 1, config.height || 2, radialSegments);
        mesh = new THREE.Mesh(coneGeometry, material);
        break;
      case "torus":
        const torusGeometry = new THREE.TorusGeometry(config.radius || 1, config.tube || 0.4, radialSegments, config.tubularSegments || 100);
        mesh = new THREE.Mesh(torusGeometry, material);
        break;
      default:
        console.error(`Unknown shape type: ${type}`);
        return;
    }
  
    if (mesh) {
      mesh.position.set(x, y, z);
      scene.add(mesh);
      // 상태에 추가
      setShapes((prevShapes) => [...prevShapes, { type, config, mesh }]);
    }
  };

  const removeShapeFromScene = (index) => {
    setShapes((prevShapes) => {
      const shapeToRemove = prevShapes[index];
      if (shapeToRemove.mesh) {
        sceneRef.current.remove(shapeToRemove.mesh);
      }
      return prevShapes.filter((_, i) => i !== index);
    });
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
  <div className="config-form">
    <h3>Configure {selectedShape}</h3>
    
    {/* Position settings */}
    <div className="position-settings">
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
    </div>
    {/* Other settings */}
    <div className="other-settings">
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

      {/* Color and material type */}
      <div className="additional-settings">
        <label>
          Color:
          <input
            type="color"
            name="color"
            value={config.color || "#ffffff"}
            onChange={handleConfigChange}
          />
        </label>
        <label>
          Material Type:
          <select
            name="materialType"
            value={config.materialType || "basic"}
            onChange={handleConfigChange}
          >
            <option value="basic">Basic</option>
            <option value="lambert">Lambert</option>
            <option value="phong">Phong</option>
            <option value="standard">Standard</option>
          </select>
        </label>
      </div>

      <button onClick={handleAddShape}>Add {selectedShape}</button>
    </div>
  </div>
)}


      <h3>Added Shapes:</h3>
      <div className="added-shapes">
        
        <ul>
          {shapes.map((shape, index) => (
            <li key={index}>
              {shape.type} - {JSON.stringify(shape.config)}{" "}
              <button onClick={() => removeShapeFromScene(index)}>X</button>
            </li>
          ))}
        </ul>
      </div>

    <div className = "webgl-canvas-container">
        <div className= "webgl-threeD"ref={mountRef}></div>
        <div id ="light-information"></div>
    </div>
      
    </div>
  );
};

export default WebEditor;