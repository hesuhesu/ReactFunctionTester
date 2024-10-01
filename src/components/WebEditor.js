import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';

const WebEditor = () => {
  const canvasRef = useRef();
  const sceneRef = useRef();
  const rendererRef = useRef();
  const cameraRef = useRef();
  const controlsRef = useRef();
  const gridHelperRef = useRef();
  const axesHelperRef = useRef();
  const ambientLightRef = useRef();
  const directionalLightRef = useRef();
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const transformControlsRef = useRef(); // TransformControls 참조
  const [selectedObject, setSelectedObject] = useState(null); // 선택된 객체
  const [currentMode, setCurrentMode] = useState('translate'); // 현재 TransformControls 모드 상태

  const [guiTrue, setGuiTrue] = useState(true);
  const [objects, setObjects] = useState([]);
  const [selectedShape, setSelectedShape] = useState('box');
  const [selectedMaterial, setSelectedMaterial] = useState('standard'); // 재질 선택

  const [sceneSettings, setSceneSettings] = useState({ // 조명 세팅
    rendererBackgroundColor: "#ffffff",
    directionalLightColor: "#ffffff", directionalLightIntensity: 1, directionalLightPosX: 0, directionalLightPosY: 1, directionalLightPosZ: 0,
    ambientLightColor: "#ffffff", ambientLightIntensity: 1,
  });

  const [shapeSettings, setShapeSettings] = useState({ // 모양 세팅
    length: 1, width: 1, height: 1, depth: 1, radius: 1, detail: 0,
    widthSegments: 1, heightSegments: 1, depthSegments: 1, radialSegments: 8, capSegments: 4, tubularSegments: 48,
    radiusTop: 1, radiusBottom: 1,
    thetaStart: 0, thetaLength: 2 * Math.PI,
    phiStart: 0, phiLength: 2 * Math.PI,
    tube: 0.4, arc: 2 * Math.PI, p: 2, q: 3,
    color: '#ffffff',
    posX: 0, posY: 0, posZ: 0,
  });

  const [shapeModifySettings, setShapeModifySettings] = useState({ // 모양 수정 세팅
    length: 1, width: 1, height: 1, depth: 1, radius: 1, detail: 0,
    widthSegments: 1, heightSegments: 1, depthSegments: 1, radialSegments: 8, capSegments: 4, tubularSegments: 48,
    radiusTop: 1, radiusBottom: 1,
    thetaStart: 0, thetaLength: 2 * Math.PI,
    phiStart: 0, phiLength: 2 * Math.PI,
    tube: 0.4, arc: 2 * Math.PI, p: 2, q: 3,
    color: '#ffffff',
    posX: 0, posY: 0, posZ: 0,
  });

  const [editingIndex, setEditingIndex] = useState(null); // 수정 중인 도형의 인덱스

  // transformcontrol 참조

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

    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControlsRef.current = transformControls;
    scene.add(transformControls);

    // TransformControls 이벤트 리스너: 드래그 중에 OrbitControls 비활성화
    transformControls.addEventListener('dragging-changed', function (event) {
      controls.enabled = !event.value;
    });

    const handleKeyDown = (event) => {
      switch (event.key) {
        case 'a':
          setCurrentMode('translate');
          transformControls.setMode('translate');
          break;
        case 's':
          setCurrentMode('rotate');
          transformControls.setMode('rotate');
          break;
        case 'd':
          setCurrentMode('scale');
          transformControls.setMode('scale');
          break;
        default:
          break;
      }
    };
    // 키 다운 이벤트 리스너 등록
    window.addEventListener('keydown', handleKeyDown);

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
      window.removeEventListener('keydown', handleKeyDown);
      renderer.dispose();
      scene.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 마우스 클릭으로 객체 선택 및 TransformControls 적용
  useEffect(() => {
    const canvas = canvasRef.current;

    const handleMouseClick = (event) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(objects);

      if (intersects.length > 0) {
        const intersectedObject = intersects[0].object;
        setSelectedObject(intersectedObject);
        transformControlsRef.current.attach(intersectedObject); // 선택한 객체에 TransformControls 적용
      } else {
        // 빈 공간 클릭 시 TransformControls을 해제
        if (transformControlsRef.current.object) {
          transformControlsRef.current.detach(); // TransformControls 해제
        }
        setSelectedObject(null);
      }
    };
    canvas.addEventListener('click', handleMouseClick);

    return () => {
      canvas.removeEventListener('click', handleMouseClick);
    };
  }, [objects]);

  useEffect(() => {
    if (rendererRef.current) { rendererRef.current.setClearColor(sceneSettings.rendererBackgroundColor, 1); }
    if (ambientLightRef.current) {
      ambientLightRef.current.color.set(sceneSettings.ambientLightColor);
      ambientLightRef.current.intensity = sceneSettings.ambientLightIntensity;
    }
    if (directionalLightRef.current) {
      directionalLightRef.current.color.set(sceneSettings.directionalLightColor);
      directionalLightRef.current.intensity = sceneSettings.directionalLightIntensity;
      directionalLightRef.current.position.set(sceneSettings.directionalLightPosX, sceneSettings.directionalLightPosY, sceneSettings.directionalLightPosZ);
    }
  }, [sceneSettings]);

  const handleChange = (event) => {
    const { id, value } = event.target;
    setSceneSettings((prevSettings) => ({
      ...prevSettings,
      [id]: id.includes('Intensity') || id.includes('Pos') ? parseFloat(value) : value,
    }));
  };

  const addShape = () => {
    const { length, width, height, depth, radius, detail,
      widthSegments, heightSegments, depthSegments, capSegments, radialSegments, tubularSegments,
      radiusTop, radiusBottom,
      thetaStart, thetaLength,
      phiStart, phiLength,
      arc, tube, p, q, color,
      posX, posY, posZ } = shapeSettings;
    let geometry;
    let material;

    // 재질 선택 로직
    switch (selectedMaterial) {
      case 'basic': material = new THREE.MeshBasicMaterial({ color });
        break;
      case 'standard': material = new THREE.MeshStandardMaterial({ color });
        break;
      case 'phong': material = new THREE.MeshPhongMaterial({ color });
        break;
      case 'lambert': material = new THREE.MeshLambertMaterial({ color });
        break;
      case 'matcap': material = new THREE.MeshMatcapMaterial({ color });
        break;
      case 'toon': material = new THREE.MeshToonMaterial({ color });
        break;
      case 'physical': material = new THREE.MeshPhysicalMaterial({ color });
        break;
      default: material = new THREE.MeshStandardMaterial({ color });
    }

    switch (selectedShape) {
      case 'box': geometry = new THREE.BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments);
        break;
      case 'capsule': geometry = new THREE.CapsuleGeometry(radius, length, capSegments, radialSegments);
        break;
      case 'cone': geometry = new THREE.ConeGeometry(radius, height, radialSegments, heightSegments, false, thetaStart, thetaLength);
        break;
      case 'cylinder': geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, false, thetaStart, thetaLength);
        break;
      case 'tetrahydron': geometry = new THREE.TetrahedronGeometry(radius, detail);
        break;
      case 'octahedron': geometry = new THREE.OctahedronGeometry(radius, detail);
        break;
      case 'dodecahedron': geometry = new THREE.DodecahedronGeometry(radius, detail);
        break;
      case 'icosahedron': geometry = new THREE.IcosahedronGeometry(radius, detail);
        break;
      case 'sphere': geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength);
        break;
      case 'torus': geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc);
        break;
      case 'torusknot': geometry = new THREE.TorusKnotGeometry(radius, tube, tubularSegments, radialSegments, p, q);
        break;
      default: geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(posX, posY, posZ);
    mesh.userData = {
      length, width, height, depth, radius, detail,
      widthSegments, heightSegments, depthSegments, capSegments, radialSegments, tubularSegments,
      radiusTop, radiusBottom,
      thetaStart, thetaLength,
      phiStart, phiLength,
      arc, tube, p, q, color,
      shape: selectedShape,
      material: selectedMaterial
    };

    sceneRef.current.add(mesh); // group
    setObjects((prevObjects) => [...prevObjects, mesh]);
  };

  const editShape = (index) => {
    const obj = objects[index];
    setShapeModifySettings({
      length: obj.userData.length, width: obj.userData.width, height: obj.userData.height, depth: obj.userData.depth, radius: obj.userData.radius, detail: obj.userData.detail,
      widthSegments: obj.userData.widthSegments, heightSegments: obj.userData.heightSegments, depthSegments: obj.userData.depthSegments, capSegments: obj.userData.capSegments, radialSegments: obj.userData.radialSegments, tubularSegments: obj.userData.tubularSegments,
      radiusTop: obj.userData.radiusTop, radiusBottom: obj.userData.radiusBottom,
      thetaStart: obj.userData.thetaStart, thetaLength: obj.userData.thetaLength,
      phiStart: obj.userData.phiStart, phiLength: obj.userData.phiLength,
      arc: obj.userData.arc, tube: obj.userData.tube, p: obj.userData.p, q: obj.userData.q,
      color: `#${obj.material.color.getHexString()}`,
      posX: obj.position.x,
      posY: obj.position.y,
      posZ: obj.position.z,
    });
    setSelectedMaterial(obj.userData.material);
    setSelectedShape(obj.userData.shape);
    setEditingIndex(index);
  };

  const applyChanges = () => {
    if (editingIndex !== null) {
      const obj = objects[editingIndex];
      obj.geometry.dispose(); // 기존 도형 제거
      obj.material.dispose(); // 기존 재질 제거

      const { length, width, height, depth, radius, detail,
        widthSegments, heightSegments, depthSegments, capSegments, radialSegments, tubularSegments,
        radiusTop, radiusBottom,
        thetaStart, thetaLength,
        phiStart, phiLength,
        arc, tube, p, q, color,
        posX, posY, posZ } = shapeModifySettings;
      let material;
      let geometry;

      // 재질 선택 로직
      switch (selectedMaterial) {
        case 'basic': material = new THREE.MeshBasicMaterial({ color });
          break;
        case 'standard': material = new THREE.MeshStandardMaterial({ color });
          break;
        case 'phong': material = new THREE.MeshPhongMaterial({ color });
          break;
        case 'lambert': material = new THREE.MeshLambertMaterial({ color });
          break;
        case 'matcap': material = new THREE.MeshMatcapMaterial({ color });
          break;
        case 'toon': material = new THREE.MeshToonMaterial({ color });
          break;
        case 'physical': material = new THREE.MeshPhysicalMaterial({ color });
          break;
        default: material = new THREE.MeshStandardMaterial({ color });
      }

      switch (selectedShape) {
        case 'box': geometry = new THREE.BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments);
          break;
        case 'capsule': geometry = new THREE.CapsuleGeometry(radius, length, capSegments, radialSegments);
          break;
        case 'cone': geometry = new THREE.ConeGeometry(radius, height, radialSegments, heightSegments, false, thetaStart, thetaLength);
          break;
        case 'cylinder': geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, false, thetaStart, thetaLength);
          break;
        case 'tetrahydron': geometry = new THREE.TetrahedronGeometry(radius, detail);
          break;
        case 'octahedron': geometry = new THREE.OctahedronGeometry(radius, detail);
          break;
        case 'dodecahedron': geometry = new THREE.DodecahedronGeometry(radius, detail);
          break;
        case 'icosahedron': geometry = new THREE.IcosahedronGeometry(radius, detail);
          break;
        case 'sphere': geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength);
          break;
        case 'torus': geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc);
          break;
        case 'torusknot': geometry = new THREE.TorusKnotGeometry(radius, tube, tubularSegments, radialSegments, p, q);
          break;
        default: geometry = new THREE.BoxGeometry(1, 1, 1);
      }

      obj.userData = {
        length, width, height, depth, radius, detail,
        widthSegments, heightSegments, depthSegments, capSegments, radialSegments, tubularSegments,
        radiusTop, radiusBottom,
        thetaStart, thetaLength,
        phiStart, phiLength,
        arc, tube, p, q, color,
        shape: selectedShape,
        material: selectedMaterial
      };

      obj.geometry = geometry;
      obj.material = material;
      obj.position.set(posX, posY, posZ);
    }
    setEditingIndex(null); // 수정 모드 해제
  };

  const turnOff = () => {
    setEditingIndex(null);
  }

  const removeShape = (index) => {
    const updatedObjects = [...objects];
    const objToRemove = updatedObjects[index];
    // TransformControls에서 해당 객체 제거 (detach)
    if (transformControlsRef.current.object) {
      transformControlsRef.current.detach();
    }
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

  const guiTurn = () => {
    setGuiTrue(!guiTrue);
  }

  const saveScene = () => {
    const scene = sceneRef.current;

    // Remove gridHelper and axesHelper
    if (gridHelperRef.current) {
      scene.remove(gridHelperRef.current);
    }
    if (axesHelperRef.current) {
      scene.remove(axesHelperRef.current);
    }
    // TransformControls에서 해당 객체 제거 (detach)
    if (transformControlsRef.current.object) {
      transformControlsRef.current.detach();
    }

    // Export the scene using GLTFExporter
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (result) => {
        const output = JSON.stringify(result, null, 2);
        const blob = new Blob([output], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'model.glb';
        link.click();
      },
      { binary: true }
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <canvas ref={canvasRef} style={{ maxWidth: '100%', border: '5px solid black', borderRadius: '10px', display: 'block' }}></canvas>
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            padding: '10px',
            maxHeight: '800px',
            maxWidth: '500px',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}>
            {guiTrue ? <><button type="button" onClick={guiTurn} style={{ marginBottom: '10px' }}>GUI Close</button><button type="button" onClick={saveScene} >Scene 저장하기</button>
              <div style={{ fontWeight: 'bold', border: '2px solid black', padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.5)' }}>
                <div>
                  <label>배경 색 변경 </label>
                  <input type="color" id="rendererBackgroundColor" value={sceneSettings.rendererBackgroundColor} onChange={handleChange} />
                </div>
                <br />
                <div>
                  <label>Directional Light Color </label>
                  <input type="color" id="directionalLightColor" value={sceneSettings.directionalLightColor} onChange={handleChange} />
                  <label> Intensity :</label>
                  <input type="range" id="directionalLightIntensity" min="0" max="5" step="0.01" value={sceneSettings.directionalLightIntensity} onChange={handleChange} />
                </div>
                <div>
                  <label>Ambient Light Color </label>
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
                <button type="button" onClick={resetControls} style={{ marginTop: '10px' }}>Reset Light</button>
              </div>
              <br />

              {editingIndex === null ? (
                <div style={{ fontWeight: 'bold', border: '2px solid black', padding: '10px', backgroundColor: 'rgba(73, 169, 61, 1)' }}>
                  <h3>새로운 도형 추가</h3>
                  <div>
                    <label>도형 선택 </label>
                    <select value={selectedShape} onChange={(e) => setSelectedShape(e.target.value)}>
                      <option value="box">box</option>
                      <option value="capsule">캡슐</option>
                      <option value="cone">원뿔</option>
                      <option value="cylinder">원통</option>
                      <option value="tetrahydron">4면체</option>
                      <option value="octahedron">8면체</option>
                      <option value="dodecahedron">12면체</option>
                      <option value="icosahedron">20면체</option>
                      <option value="sphere">구</option>
                      <option value="torus">Torus</option>
                      <option value="torusknot">TorusKnot</option>
                    </select>
                  </div>
                  <div>
                    <label>재질 선택 </label>
                    <select value={selectedMaterial} onChange={(e) => setSelectedMaterial(e.target.value)}>
                      <option value="basic">Basic</option>
                      <option value="lambert">Lambert</option>
                      <option value="matcap">Matcap</option>
                      <option value="phong">Phong</option>
                      <option value="physical">Physical</option>
                      <option value="standard">Standard</option>
                      <option value="toon">Toon</option>
                    </select>
                  </div>
                  <div>
                    <label>도형 색상 </label>
                    <input type="color" id="color" value={shapeSettings.color} onChange={(e) => { setShapeSettings(prev => ({ ...prev, color: e.target.value })); }} />
                  </div><br />
                  {selectedShape === 'box' &&
                    <div>
                      <label>가로(Width):</label>
                      <input type="number" id="width" value={shapeSettings.width} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, width: parseFloat(e.target.value) })); }} /><br />
                      <label>세로(Height):</label>
                      <input type="number" id="height" value={shapeSettings.height} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, height: parseFloat(e.target.value) })); }} /><br />
                      <label>깊이(Depth):</label>
                      <input type="number" id="depth" value={shapeSettings.depth} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, depth: parseFloat(e.target.value) })); }} /><br />
                      <label title="x축으로 분할된 직사각형 면의 수">x축 세그먼트 수(WidthSegments):</label>
                      <input type="number" id="widthsegments" value={shapeSettings.widthSegments} min={1} max={100} onChange={(e) => { setShapeSettings(prev => ({ ...prev, widthSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="y축으로 분할된 직사각형 면의 수">y축 세그먼트 수(HeightSegments):</label>
                      <input type="number" id="heightsegments" value={shapeSettings.heightSegments} min={1} max={100} onChange={(e) => { setShapeSettings(prev => ({ ...prev, heightSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="z축으로 분할된 직사각형 면의 수">z축 세그먼트 수(DepthSegments):</label>
                      <input type="number" id="depthsegments" value={shapeSettings.depthSegments} min={1} max={100} onChange={(e) => { setShapeSettings(prev => ({ ...prev, depthSegments: parseInt(e.target.value, 10) })); }} /><br />
                    </div>
                  }
                  {selectedShape === 'capsule' &&
                    <div>
                      <label>반지름(Radius):</label>
                      <input type="number" id="radius" value={shapeSettings.radius} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, radius: parseFloat(e.target.value) })); }} /><br />
                      <label>길이(Length):</label>
                      <input type="number" id="length" value={shapeSettings.length} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, length: parseFloat(e.target.value) })); }} /><br />
                      <label title="캡슐 머리 부분을 중심으로 나뉘는 직사각형 면의 수">캡슐 세그먼트 수(CapSegments):</label>
                      <input type="number" id="capsegments" value={shapeSettings.capSegments} min={1} onChange={(e) => { setShapeSettings(prev => ({ ...prev, capSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="원형을 중심으로 나뉘는 직사각형 면의 수">원형 세그먼트 수(RadialSegments):</label>
                      <input type="number" id="radialsegments" value={shapeSettings.radialSegments} min={1} onChange={(e) => { setShapeSettings(prev => ({ ...prev, radialSegments: parseInt(e.target.value, 10) })); }} /><br />
                    </div>
                  }
                  {selectedShape === 'cone' &&
                    <div>
                      <label>반지름(Radius):</label>
                      <input type="number" id="radius" value={shapeSettings.radius} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, radius: parseFloat(e.target.value) })); }} /><br />
                      <label>세로(Height):</label>
                      <input type="number" id="height" value={shapeSettings.height} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, height: parseFloat(e.target.value) })); }} /><br />
                      <label title="원형을 중심으로 나뉘는 직사각형 면의 수">원형 세그먼트 수(RadialSegments):</label>
                      <input type="number" id="radialsegments" value={shapeSettings.radialSegments} min={3} onChange={(e) => { setShapeSettings(prev => ({ ...prev, radialSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="y축으로 분할된 직사각형 면의 수">y축 세그먼트 수(HeightSegments):</label>
                      <input type="number" id="heightsegments" value={shapeSettings.heightSegments} min={1} max={100} onChange={(e) => { setShapeSettings(prev => ({ ...prev, heightSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="원뿔 회전 각">원뿔 위치 회전(ThetaStart):</label>
                      <input type="number" id="thetastart" value={shapeSettings.thetaStart} min={0} max={Math.PI * 2} onChange={(e) => { setShapeSettings(prev => ({ ...prev, thetaStart: parseFloat(e.target.value) })); }} /><br />
                      <label title="원형 섹터의 중심 각">원뿔 중심 각(ThetaLength):</label>
                      <input type="number" id="thetalength" value={shapeSettings.thetaLength} min={0} max={Math.PI * 2} onChange={(e) => { setShapeSettings(prev => ({ ...prev, thetaLength: parseFloat(e.target.value) })); }} /><br />
                      <button type="button" onClick={() => { document.getElementById('thetalength').value = Math.PI; setShapeSettings(prev => ({ ...prev, thetaLength: Math.PI })); }}>Math.PI 변경</button>
                      <button type="button" onClick={() => { document.getElementById('thetalength').value = Math.PI * 2; setShapeSettings(prev => ({ ...prev, thetaLength: Math.PI * 2 })); }}>Math.PI * 2 변경</button>
                    </div>
                  }
                  {selectedShape === 'cylinder' &&
                    <div>
                      <label>원통 윗부분(RadiusTop):</label>
                      <input type="number" id="radiustop" value={shapeSettings.radiusTop} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, radiusTop: parseFloat(e.target.value) })); }} /><br />
                      <label>원통 아래부분(RadiusBottom):</label>
                      <input type="number" id="radiusbottom" value={shapeSettings.radiusBottom} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, radiusBottom: parseFloat(e.target.value) })); }} /><br />
                      <label>세로 (Height):</label>
                      <input type="number" id="height" value={shapeSettings.height} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, height: parseFloat(e.target.value) })); }} /><br />
                      <label title="원형을 중심으로 나뉘는 직사각형 면의 수">원형 세그먼트 수(RadialSegments):</label>
                      <input type="number" id="radialsegments" value={shapeSettings.radialSegments} min={3} onChange={(e) => { setShapeSettings(prev => ({ ...prev, radialSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="y축으로 분할된 직사각형 면의 수">y축 세그먼트 수(HeightSegments):</label>
                      <input type="number" id="heightsegments" value={shapeSettings.heightSegments} min={1} max={100} onChange={(e) => { setShapeSettings(prev => ({ ...prev, heightSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="원뿔 회전 각">원뿔 위치 회전(ThetaStart):</label>
                      <input type="number" id="thetastart" value={shapeSettings.thetaStart} min={0} max={Math.PI * 2} onChange={(e) => { setShapeSettings(prev => ({ ...prev, thetaStart: parseFloat(e.target.value) })); }} /><br />
                      <label title="원형 섹터의 중심 각">원뿔 중심 각(ThetaLength):</label>
                      <input type="number" id="thetalength" value={shapeSettings.thetaLength} min={0} max={Math.PI * 2} onChange={(e) => { setShapeSettings(prev => ({ ...prev, thetaLength: parseFloat(e.target.value) })); }} /><br />
                      <button type="button" onClick={() => { document.getElementById('thetalength').value = Math.PI; setShapeSettings(prev => ({ ...prev, thetaLength: Math.PI })); }}>Math.PI 변경</button>
                      <button type="button" onClick={() => { document.getElementById('thetalength').value = Math.PI * 2; setShapeSettings(prev => ({ ...prev, thetaLength: Math.PI * 2 })); }}>Math.PI * 2 변경</button>
                    </div>
                  }
                  {selectedShape === 'tetrahydron' &&
                    <div>
                      <label>반지름(Radius):</label>
                      <input type="number" id="radius" value={shapeSettings.radius} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, radius: parseFloat(e.target.value) })); }} /><br />
                      <label title="4면체 입니다. 0보다 커진다면 원형에 가까워집니다. 4면체의 기본값은 0입니다.">복잡도(Detail)</label>
                      <input type="number" id="detail" value={shapeSettings.detail} min={0} max={100} onChange={(e) => { setShapeSettings(prev => ({ ...prev, detail: parseInt(e.target.value, 10) })); }} /><br />
                    </div>
                  }
                  {selectedShape === 'octahedron' &&
                    <div>
                      <label>반지름(Radius):</label>
                      <input type="number" id="radius" value={shapeSettings.radius} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, radius: parseFloat(e.target.value) })); }} /><br />
                      <label title="8면체 입니다. 0보다 커진다면 원형에 가까워집니다. 8면체의 기본값은 0입니다.">복잡도(Detail)</label>
                      <input type="number" id="detail" value={shapeSettings.detail} min={0} max={100} onChange={(e) => { setShapeSettings(prev => ({ ...prev, detail: parseInt(e.target.value, 10) })); }} /><br />
                    </div>
                  }
                  {selectedShape === 'dodecahedron' &&
                    <div>
                      <label>반지름(Radius):</label>
                      <input type="number" id="radius" value={shapeSettings.radius} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, radius: parseFloat(e.target.value) })); }} /><br />
                      <label title="12면체 입니다. 0보다 커진다면 원형에 가까워집니다. 12면체의 기본값은 0입니다.">복잡도(Detail)</label>
                      <input type="number" id="detail" value={shapeSettings.detail} min={0} max={100} onChange={(e) => { setShapeSettings(prev => ({ ...prev, detail: parseInt(e.target.value, 10) })); }} /><br />
                    </div>
                  }
                  {selectedShape === 'icosahedron' &&
                    <div>
                      <label>반지름(Radius):</label>
                      <input type="number" id="radius" value={shapeSettings.radius} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, radius: parseFloat(e.target.value) })); }} /><br />
                      <label title="20면체 입니다. 0보다 커진다면 원형에 가까워집니다. 20면체의 기본값은 0입니다.">복잡도(Detail)</label>
                      <input type="number" id="detail" value={shapeSettings.detail} min={0} max={100} onChange={(e) => { setShapeSettings(prev => ({ ...prev, detail: parseInt(e.target.value, 10) })); }} /><br />
                    </div>
                  }
                  {selectedShape === 'sphere' &&
                    <div>
                      <label>반지름(Radius):</label>
                      <input type="number" id="radius" value={shapeSettings.radius} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, radius: parseFloat(e.target.value) })); }} /><br />
                      <label title="x축에서 보이는 변의 수">x축 세그먼트 수(WidthSegments):</label>
                      <input type="number" id="widthsegments" value={shapeSettings.widthSegments} min={2} max={100} onChange={(e) => { setShapeSettings(prev => ({ ...prev, widthSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="y축에서 보이는 변의 수">y축 세그먼트 수(HeightSegments):</label>
                      <input type="number" id="heightsegments" value={shapeSettings.heightSegments} min={3} max={100} onChange={(e) => { setShapeSettings(prev => ({ ...prev, heightSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="">구형 중점 회전(PhiStart):</label>
                      <input type="number" id="phistart" value={shapeSettings.phiStart} min={0} max={Math.PI * 2} onChange={(e) => { setShapeSettings(prev => ({ ...prev, phiStart: parseFloat(e.target.value) })); }} /><br />
                      <label title="">구형 중심 구현(PhiLength):</label>
                      <input type="number" id="philength" value={shapeSettings.phiLength} min={0} max={Math.PI * 2} onChange={(e) => { setShapeSettings(prev => ({ ...prev, phiLength: parseFloat(e.target.value) })); }} /><br />
                      <button type="button" onClick={() => { document.getElementById('philength').value = Math.PI; setShapeSettings(prev => ({ ...prev, phiLength: Math.PI })); }}>Math.PI 변경</button>
                      <button type="button" onClick={() => { document.getElementById('philength').value = Math.PI * 2; setShapeSettings(prev => ({ ...prev, phiLength: Math.PI * 2 })); }}>Math.PI * 2 변경</button><br />
                      <label title="원뿔 회전 각">점 중심 회전(ThetaStart):</label>
                      <input type="number" id="thetastart" value={shapeSettings.thetaStart} min={0} max={Math.PI * 2} onChange={(e) => { setShapeSettings(prev => ({ ...prev, thetaStart: parseFloat(e.target.value) })); }} /><br />
                      <label title="원형 섹터의 중심 각">점 중심 구현(ThetaLength):</label>
                      <input type="number" id="thetalength" value={shapeSettings.thetaLength} min={0} max={Math.PI * 2} onChange={(e) => { setShapeSettings(prev => ({ ...prev, thetaLength: parseFloat(e.target.value) })); }} /><br />
                      <button type="button" onClick={() => { document.getElementById('thetalength').value = Math.PI; setShapeSettings(prev => ({ ...prev, thetaLength: Math.PI })); }}>Math.PI 변경</button>
                      <button type="button" onClick={() => { document.getElementById('thetalength').value = Math.PI * 2; setShapeSettings(prev => ({ ...prev, thetaLength: Math.PI * 2 })); }}>Math.PI * 2 변경</button>
                    </div>
                  }
                  {selectedShape === 'torus' &&
                    <div>
                      <label>반지름(Radius):</label>
                      <input type="number" id="radius" value={shapeSettings.radius} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, radius: parseFloat(e.target.value) })); }} /><br />
                      <label title="torus 를 감싸는 튜브의 두께">튜브(Tube):</label>
                      <input type="number" id="tube" value={shapeSettings.tube} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, tube: parseFloat(e.target.value) })); }} /><br />
                      <label title="튜브의 정점 조절. 숫자가 커질수록 원형에 가까워짐">원형 세그먼트 수(RadialSegments):</label>
                      <input type="number" id="radialsegments" value={shapeSettings.radialSegments} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, radialSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="튜브의 구간 개수 조절. 숫자가 커질수록 구간 별로 촘촘해짐">튜브 세그먼트 수(TubularSegments):</label>
                      <input type="number" id="tubularsegments" value={shapeSettings.tubularSegments} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, tubularSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="torus 가 생성되는 회전 각">Torus 생성 각(Arc):</label>
                      <input type="number" id="arc" value={shapeSettings.arc} min={0} max={Math.PI * 2} onChange={(e) => { setShapeSettings(prev => ({ ...prev, arc: parseFloat(e.target.value) })); }} /><br />
                      <button type="button" onClick={() => { document.getElementById('arc').value = Math.PI; setShapeSettings(prev => ({ ...prev, arc: Math.PI })); }}>Math.PI 변경</button>
                      <button type="button" onClick={() => { document.getElementById('arc').value = Math.PI * 2; setShapeSettings(prev => ({ ...prev, arc: Math.PI * 2 })); }}>Math.PI * 2 변경</button>
                    </div>
                  }
                  {selectedShape === 'torusknot' &&
                    <div>
                      <label>반지름(Radius):</label>
                      <input type="number" id="radius" value={shapeSettings.radius} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, radius: parseFloat(e.target.value) })); }} /><br />
                      <label title="torus 를 감싸는 튜브의 두께">튜브(Tube):</label>
                      <input type="number" id="tube" value={shapeSettings.tube} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, tube: parseFloat(e.target.value) })); }} /><br />
                      <label title="튜브의 구간 개수 조절. 숫자가 커질수록 구간 별로 촘촘해짐">튜브 세그먼트 수(TubularSegments):</label>
                      <input type="number" id="tubularsegments" value={shapeSettings.tubularSegments} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, tubularSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="튜브의 정점 조절. 숫자가 커질수록 원형에 가까워짐">원형 세그먼트 수(RadialSegments):</label>
                      <input type="number" id="radialsegments" value={shapeSettings.radialSegments} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, radialSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="기하학적 회전 대칭 축 감김 정도">(P)</label>
                      <input type="number" id="p" value={shapeSettings.p} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, p: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="torus 내부 원을 감은 정도">(Q)</label>
                      <input type="number" id="q" value={shapeSettings.q} min={0} onChange={(e) => { setShapeSettings(prev => ({ ...prev, q: parseInt(e.target.value, 10) })); }} /><br />
                    </div>
                  }<br />
                  <div>
                    <label>X : </label>
                    <input style={{ width: "40px" }} type="number" id="posX" value={shapeSettings.posX} onChange={(e) => { setShapeSettings(prev => ({ ...prev, posX: parseFloat(e.target.value) })); }} />
                    <label> Y : </label>
                    <input style={{ width: "40px" }} type="number" id="posY" value={shapeSettings.posY} onChange={(e) => { setShapeSettings(prev => ({ ...prev, posY: parseFloat(e.target.value) })); }} />
                    <label> Z : </label>
                    <input style={{ width: "40px" }} type="number" id="posZ" value={shapeSettings.posZ} onChange={(e) => { setShapeSettings(prev => ({ ...prev, posZ: parseFloat(e.target.value) })); }} />
                  </div><br />
                  <button type="button" onClick={addShape}>도형 추가</button>
                </div>
              ) : (
                <div style={{ fontWeight: 'bold', border: '2px solid black', padding: '10px', backgroundColor: 'rgba(205, 103, 24, 1)' }}>
                  <h3>도형 {editingIndex + 1} 수정 중...</h3>
                  <div>
                    <label>재질 선택 </label>
                    <select value={selectedMaterial} onChange={(e) => setSelectedMaterial(e.target.value)}>
                      <option value="basic">Basic</option>
                      <option value="lambert">Lambert</option>
                      <option value="matcap">Matcap</option>
                      <option value="phong">Phong</option>
                      <option value="physical">Physical</option>
                      <option value="standard">Standard</option>
                      <option value="toon">Toon</option>
                    </select>
                  </div>
                  <div>
                    <label>도형 색상 </label>
                    <input type="color" id="color" value={shapeModifySettings.color} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, color: e.target.value })); }} />
                  </div><br />
                  {selectedShape === 'box' &&
                    <div>
                      <label>가로 (Width):</label>
                      <input type="number" id="width" value={shapeModifySettings.width} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, width: parseFloat(e.target.value) })); }} /><br />
                      <label>세로 (Height):</label>
                      <input type="number" id="height" value={shapeModifySettings.height} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, height: parseFloat(e.target.value) })); }} /><br />
                      <label>깊이 (Depth):</label>
                      <input type="number" id="depth" value={shapeModifySettings.depth} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, depth: parseFloat(e.target.value) })); }} /><br />
                      <label title="x축으로 분할된 직사각형 면의 수">x축 세그먼트 수 (WidthSegments):</label>
                      <input type="number" id="widthsegments" value={shapeModifySettings.widthSegments} min={1} max={100} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, widthSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="y축으로 분할된 직사각형 면의 수">y축 세그먼트 수 (HeightSegments):</label>
                      <input type="number" id="heightsegments" value={shapeModifySettings.heightSegments} min={1} max={100} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, heightSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="z축으로 분할된 직사각형 면의 수">z축 세그먼트 수 (DepthSegments):</label>
                      <input type="number" id="depthsegments" value={shapeModifySettings.depthSegments} min={1} max={100} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, depthSegments: parseInt(e.target.value, 10) })); }} /><br />
                    </div>
                  }
                  {selectedShape === 'capsule' &&
                    <div>
                      <label>반지름 (Radius):</label>
                      <input type="number" id="radius" value={shapeModifySettings.radius} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, radius: parseFloat(e.target.value) })); }} /><br />
                      <label>길이 (Length):</label>
                      <input type="number" id="length" value={shapeModifySettings.length} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, length: parseFloat(e.target.value) })); }} /><br />
                      <label title="캡슐 머리 부분을 중심으로 나뉘는 직사각형 면의 수">캡슐 세그먼트 수 (CapSegments):</label>
                      <input type="number" id="capsegments" value={shapeModifySettings.capSegments} min={1} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, capSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="원형을 중심으로 나뉘는 직사각형 면의 수">원통 세그먼트 수 (RadialSegments):</label>
                      <input type="number" id="radialsegments" value={shapeModifySettings.radialSegments} min={1} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, radialSegments: parseInt(e.target.value, 10) })); }} /><br />
                    </div>
                  }
                  {selectedShape === 'cone' &&
                    <div>
                      <label>반지름 (Radius):</label>
                      <input type="number" id="radius" value={shapeModifySettings.radius} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, radius: parseFloat(e.target.value) })); }} /><br />
                      <label>세로 (Height):</label>
                      <input type="number" id="height" value={shapeModifySettings.height} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, height: parseFloat(e.target.value) })); }} /><br />
                      <label title="원형을 중심으로 나뉘는 직사각형 면의 수">원형 세그먼트 수 (RadialSegments):</label>
                      <input type="number" id="radialsegments" value={shapeModifySettings.radialSegments} min={3} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, radialSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="y축으로 분할된 직사각형 면의 수">y축 세그먼트 수 (HeightSegments):</label>
                      <input type="number" id="heightsegments" value={shapeModifySettings.heightSegments} min={1} max={100} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, heightSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="원뿔 회전 각">원뿔 위치 회전(ThetaStart):</label>
                      <input type="number" id="thetastart" value={shapeModifySettings.thetaStart} min={0} max={Math.PI * 2} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, thetaStart: parseFloat(e.target.value) })); }} /><br />
                      <label title="원형 섹터의 중심 각">원뿔 중심 각(ThetaLength):</label>
                      <input type="number" id="thetalength" value={shapeModifySettings.thetaLength} min={0} max={Math.PI * 2} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, thetaLength: parseFloat(e.target.value) })); }} /><br />
                      <button type="button" onClick={() => { document.getElementById('thetalength').value = Math.PI; setShapeModifySettings(prev => ({ ...prev, thetaLength: Math.PI })); }}>Math.PI 변경</button>
                      <button type="button" onClick={() => { document.getElementById('thetalength').value = Math.PI * 2; setShapeModifySettings(prev => ({ ...prev, thetaLength: Math.PI * 2 })); }}>Math.PI * 2 변경</button>
                    </div>
                  }
                  {selectedShape === 'cylinder' &&
                    <div>
                      <label>원통 윗부분(RadiusTop):</label>
                      <input type="number" id="radiustop" value={shapeModifySettings.radiusTop} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, radiusTop: parseFloat(e.target.value) })); }} /><br />
                      <label>원통 아래부분(RadiusBottom):</label>
                      <input type="number" id="radiusbottom" value={shapeModifySettings.radiusBottom} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, radiusBottom: parseFloat(e.target.value) })); }} /><br />
                      <label>세로 (Height):</label>
                      <input type="number" id="height" value={shapeModifySettings.height} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, height: parseFloat(e.target.value) })); }} /><br />
                      <label title="원형을 중심으로 나뉘는 직사각형 면의 수">원형 세그먼트 수 (RadialSegments):</label>
                      <input type="number" id="radialsegments" value={shapeModifySettings.radialSegments} min={3} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, radialSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="y축으로 분할된 직사각형 면의 수">y축 세그먼트 수 (HeightSegments):</label>
                      <input type="number" id="heightsegments" value={shapeModifySettings.heightSegments} min={1} max={100} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, heightSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="원뿔 회전 각">원뿔 위치 회전(ThetaStart):</label>
                      <input type="number" id="thetastart" value={shapeModifySettings.thetaStart} min={0} max={Math.PI * 2} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, thetaStart: parseFloat(e.target.value) })); }} /><br />
                      <label title="원형 섹터의 중심 각">원뿔 중심 각(ThetaLength):</label>
                      <input type="number" id="thetalength" value={shapeModifySettings.thetaLength} min={0} max={Math.PI * 2} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, thetaLength: parseFloat(e.target.value) })); }} /><br />
                      <button type="button" onClick={() => { document.getElementById('thetalength').value = Math.PI; setShapeModifySettings(prev => ({ ...prev, thetaLength: Math.PI })); }}>Math.PI 변경</button>
                      <button type="button" onClick={() => { document.getElementById('thetalength').value = Math.PI * 2; setShapeModifySettings(prev => ({ ...prev, thetaLength: Math.PI * 2 })); }}>Math.PI * 2 변경</button>
                    </div>
                  }
                  {selectedShape === 'tetrahydron' &&
                    <div>
                      <label>반지름(Radius):</label>
                      <input type="number" id="radius" value={shapeModifySettings.radius} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, radius: parseFloat(e.target.value) })); }} /><br />
                      <label title="4면체 입니다. 0보다 커진다면 원형에 가까워집니다. 4면체의 기본값은 0입니다.">복잡도(Detail)</label>
                      <input type="number" id="detail" value={shapeModifySettings.detail} min={0} max={100} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, detail: parseInt(e.target.value, 10) })); }} /><br />
                    </div>
                  }
                  {selectedShape === 'octahedron' &&
                    <div>
                      <label>반지름 (Radius):</label>
                      <input type="number" id="radius" value={shapeModifySettings.radius} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, radius: parseFloat(e.target.value) })); }} /><br />
                      <label title="8면체 입니다. 0보다 커진다면 원형에 가까워집니다. 8면체의 기본값은 0입니다.">복잡도 (Detail)</label>
                      <input type="number" id="detail" value={shapeModifySettings.detail} min={0} max={100} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, detail: parseInt(e.target.value, 10) })); }} /><br />
                    </div>
                  }
                  {selectedShape === 'dodecahedron' &&
                    <div>
                      <label>반지름 (Radius):</label>
                      <input type="number" id="radius" value={shapeModifySettings.radius} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, radius: parseFloat(e.target.value) })); }} /><br />
                      <label title="12면체 입니다. 0보다 커진다면 원형에 가까워집니다. 12면체의 기본값은 0입니다.">복잡도 (Detail)</label>
                      <input type="number" id="detail" value={shapeModifySettings.detail} min={0} max={100} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, detail: parseInt(e.target.value, 10) })); }} /><br />
                    </div>
                  }
                  {selectedShape === 'icosahedron' &&
                    <div>
                      <label>반지름 (Radius):</label>
                      <input type="number" id="radius" value={shapeModifySettings.radius} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, radius: parseFloat(e.target.value) })); }} /><br />
                      <label title="20면체 입니다. 0보다 커진다면 원형에 가까워집니다. 20면체의 기본값은 0입니다.">복잡도 (Detail)</label>
                      <input type="number" id="detail" value={shapeModifySettings.detail} min={0} max={100} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, detail: parseInt(e.target.value, 10) })); }} /><br />
                    </div>
                  }
                  {selectedShape === 'sphere' &&
                    <div>
                      <label>반지름(Radius):</label>
                      <input type="number" id="radius" value={shapeModifySettings.radius} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, radius: parseFloat(e.target.value) })); }} /><br />
                      <label title="x축에서 보이는 변의 수">x축 세그먼트 수(WidthSegments):</label>
                      <input type="number" id="widthsegments" value={shapeModifySettings.widthSegments} min={2} max={100} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, widthSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="y축에서 보이는 변의 수">y축 세그먼트 수(HeightSegments):</label>
                      <input type="number" id="heightsegments" value={shapeModifySettings.heightSegments} min={3} max={100} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, heightSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="">구형 중점 회전(PhiStart):</label>
                      <input type="number" id="phistart" value={shapeModifySettings.phiStart} min={0} max={Math.PI * 2} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, phiStart: parseFloat(e.target.value) })); }} /><br />
                      <label title="">구형 중심 구현(PhiLength):</label>
                      <input type="number" id="philength" value={shapeModifySettings.phiLength} min={0} max={Math.PI * 2} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, phiLength: parseFloat(e.target.value) })); }} /><br />
                      <button type="button" onClick={() => { document.getElementById('philength').value = Math.PI; setShapeModifySettings(prev => ({ ...prev, phiLength: Math.PI })); }}>Math.PI 변경</button>
                      <button type="button" onClick={() => { document.getElementById('philength').value = Math.PI * 2; setShapeModifySettings(prev => ({ ...prev, phiLength: Math.PI * 2 })); }}>Math.PI * 2 변경</button><br />
                      <label title="원뿔 회전 각">점 중심 회전(ThetaStart):</label>
                      <input type="number" id="thetastart" value={shapeModifySettings.thetaStart} min={0} max={Math.PI * 2} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, thetaStart: parseFloat(e.target.value) })); }} /><br />
                      <label title="원형 섹터의 중심 각">점 중심 구현(ThetaLength):</label>
                      <input type="number" id="thetalength" value={shapeModifySettings.thetaLength} min={0} max={Math.PI * 2} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, thetaLength: parseFloat(e.target.value) })); }} /><br />
                      <button type="button" onClick={() => { document.getElementById('thetalength').value = Math.PI; setShapeModifySettings(prev => ({ ...prev, thetaLength: Math.PI })); }}>Math.PI 변경</button>
                      <button type="button" onClick={() => { document.getElementById('thetalength').value = Math.PI * 2; setShapeModifySettings(prev => ({ ...prev, thetaLength: Math.PI * 2 })); }}>Math.PI * 2 변경</button>
                    </div>
                  }
                  {selectedShape === 'torus' &&
                    <div>
                      <label>반지름(Radius):</label>
                      <input type="number" id="radius" value={shapeModifySettings.radius} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, radius: parseFloat(e.target.value) })); }} /><br />
                      <label title="torus 를 감싸는 튜브의 두께">튜브(Tube):</label>
                      <input type="number" id="tube" value={shapeModifySettings.tube} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, tube: parseFloat(e.target.value) })); }} /><br />
                      <label title="튜브의 정점 조절. 숫자가 커질수록 원형에 가까워짐">원형 세그먼트 수(RadialSegments):</label>
                      <input type="number" id="radialsegments" value={shapeModifySettings.radialSegments} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, radialSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="튜브의 구간 개수 조절. 숫자가 커질수록 구간 별로 촘촘해짐">튜브 세그먼트 수(TubularSegments):</label>
                      <input type="number" id="tubularsegments" value={shapeModifySettings.tubularSegments} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, tubularSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="torus 가 생성되는 회전 각">Torus 생성 각(Arc):</label>
                      <input type="number" id="arc" value={shapeModifySettings.arc} min={0} max={Math.PI * 2} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, arc: parseFloat(e.target.value) })); }} /><br />
                      <button type="button" onClick={() => { document.getElementById('arc').value = Math.PI; setShapeModifySettings(prev => ({ ...prev, arc: Math.PI })); }}>Math.PI 변경</button>
                      <button type="button" onClick={() => { document.getElementById('arc').value = Math.PI * 2; setShapeModifySettings(prev => ({ ...prev, arc: Math.PI * 2 })); }}>Math.PI * 2 변경</button>
                    </div>
                  }
                  {selectedShape === 'torusknot' &&
                    <div>
                      <label>반지름(Radius):</label>
                      <input type="number" id="radius" value={shapeModifySettings.radius} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, radius: parseFloat(e.target.value) })); }} /><br />
                      <label title="torus 를 감싸는 튜브의 두께">튜브(Tube):</label>
                      <input type="number" id="tube" value={shapeModifySettings.tube} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, tube: parseFloat(e.target.value) })); }} /><br />
                      <label title="튜브의 구간 개수 조절. 숫자가 커질수록 구간 별로 촘촘해짐">튜브 세그먼트 수(TubularSegments):</label>
                      <input type="number" id="tubularsegments" value={shapeModifySettings.tubularSegments} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, tubularSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="튜브의 정점 조절. 숫자가 커질수록 원형에 가까워짐">원형 세그먼트 수(RadialSegments):</label>
                      <input type="number" id="radialsegments" value={shapeModifySettings.radialSegments} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, radialSegments: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="기하학적 회전 대칭 축 감김 정도">(P)</label>
                      <input type="number" id="p" value={shapeModifySettings.p} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, p: parseInt(e.target.value, 10) })); }} /><br />
                      <label title="torus 내부 원을 감은 정도">(Q)</label>
                      <input type="number" id="q" value={shapeModifySettings.q} min={0} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, q: parseInt(e.target.value, 10) })); }} /><br />
                    </div>
                  }<br />
                  <div>
                    <label>X : </label>
                    <input style={{ width: "40px" }} type="number" id="posX" value={shapeModifySettings.posX} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, posX: parseFloat(e.target.value) })); }} />
                    <label> Y : </label>
                    <input style={{ width: "40px" }} type="number" id="posY" value={shapeModifySettings.posY} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, posY: parseFloat(e.target.value) })); }} />
                    <label> Z : </label>
                    <input style={{ width: "40px" }} type="number" id="posZ" value={shapeModifySettings.posZ} onChange={(e) => { setShapeModifySettings(prev => ({ ...prev, posZ: parseFloat(e.target.value) })); }} />
                  </div><br />
                  <button type="button" onClick={applyChanges}>적용</button><button onClick={turnOff}>수정 취소</button>
                </div>
              )
              }
              <br />

              <div style={{ fontWeight: 'bold', border: '2px solid black', padding: '10px', backgroundColor: 'rgba(255, 255, 255, 0.5)', maxHeight: '300px', overflowY: 'auto' }}>
                <h3>현재 모드 : {currentMode}(키보드로 모드 변경 : a,s,d)</h3>
                {objects.map((obj, index) => (
                  <div key={index}>
                    <span onMouseEnter={() => handleMouseEnter(index)} onMouseLeave={() => handleMouseLeave(index)}>도형 {index + 1} </span>
                    <button type="button" onClick={() => editShape(index)}>도형 수정</button>
                    <button type="button" onClick={() => removeShape(index)}>삭제</button>
                  </div>
                ))}
              </div>
            </> : <button type="button" onClick={guiTurn}>GUI Open</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebEditor;