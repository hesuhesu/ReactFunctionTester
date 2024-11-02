import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import Swal from "sweetalert2";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
// import '../css/WebEditor.css';
import '../css/WebEditor.scss';

const WebEditor = () => {
  // Ref 영역
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
  const transformControlsRef2 = useRef(); // TransformControls 참조
  const copiedObjectRef = useRef(null); // 복사된 객체 참조
  const copiedObjectRef2 = useRef(null); // 복사된 객체 참조

  // state 영역
  const [guiTrue, setGuiTrue] = useState(true);
  const [tipTrue, setTipTrue] = useState(false);
  const [axesHelperTrue, setAxesHelperTrue] = useState(true);
  const [gridHelperTrue, setGridHelperTrue] = useState(true);
  const [objects, setObjects] = useState([]);
  const [uploadObjects, setUploadObjects] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null); // 수정 중인 도형의 인덱스
  const [selectedObject, setSelectedObject] = useState([]); // 선택된 객체 참조
  const [selectedObject2, setSelectedObject2] = useState([]); // 선택된 객체 참조
  const [selectedShape, setSelectedShape] = useState('box');
  const [currentMode, setCurrentMode] = useState('translate'); // 현재 TransformControls 모드 상태
  const [selectedMaterial, setSelectedMaterial] = useState('standard'); // 재질 선택
  const [selectedIndexUploadMeshes, setSelectedIndexUploadMeshes] = useState(new Set()); // Upload Meshes 체크박스 조절

  const [sceneSettings, setSceneSettings] = useState({ // 조명 세팅
    rendererBackgroundColor: "#ffffff",
    directionalLightColor: "#ffffff", directionalLightIntensity: 1, directionalLightPosX: 0, directionalLightPosY: 1, directionalLightPosZ: 0,
    ambientLightColor: "#ffffff", ambientLightIntensity: 1,
  });
  const [cameraPosition, setCameraPosition] = useState({ x: 5, y: 5, z: 5 });

  const [shapeSettings, setShapeSettings] = useState({ // Add Meshes 모양 세팅
    length: 1, width: 1, height: 1, depth: 1, radius: 1, detail: 0,
    widthSegments: 1, heightSegments: 1, depthSegments: 1, radialSegments: 8, capSegments: 4, tubularSegments: 48,
    radiusTop: 1, radiusBottom: 1,
    thetaStart: 0, thetaLength: 2 * Math.PI,
    phiStart: 0, phiLength: 2 * Math.PI,
    tube: 0.4, arc: 2 * Math.PI, p: 2, q: 3,
    color: '#ffffff',
    posX: 0, posY: 0, posZ: 0,
  });
  const [shapeModifySettings, setShapeModifySettings] = useState({ // Add Meshes 모양 수정 세팅
    length: 1, width: 1, height: 1, depth: 1, radius: 1, detail: 0,
    widthSegments: 1, heightSegments: 1, depthSegments: 1, radialSegments: 8, capSegments: 4, tubularSegments: 48,
    radiusTop: 1, radiusBottom: 1,
    thetaStart: 0, thetaLength: 2 * Math.PI,
    phiStart: 0, phiLength: 2 * Math.PI,
    tube: 0.4, arc: 2 * Math.PI, p: 2, q: 3,
    color: '#ffffff',
    posX: 0, posY: 0, posZ: 0,
  });

  const sweetAlertError = (str, str2) => {
    Swal.fire({
      title: str,
      icon: 'error',
      html: str2,
      showCancelButton: false,
      confirmButtonText: "확인",
    }).then(() => { });
  }

  useEffect(() => {
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(sceneSettings.rendererBackgroundColor, 1);
    rendererRef.current = renderer;

    // 리사이즈 핸들러
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // 렌더러와 카메라 비율 조정
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;

    const transformControls = new TransformControls(camera, renderer.domElement);
    transformControlsRef.current = transformControls;
    scene.add(transformControls);

    const transformControls2 = new TransformControls(camera, renderer.domElement);
    transformControlsRef2.current = transformControls2;
    scene.add(transformControls2);

    // TransformControls 이벤트 리스너: 드래그 중에 OrbitControls 비활성화
    transformControls.addEventListener('dragging-changed', function (event) {
      controls.enabled = !event.value;
    });
    // TransformControls 이벤트 리스너: 드래그 중에 OrbitControls 비활성화
    transformControls2.addEventListener('dragging-changed', function (event) {
      controls.enabled = !event.value;
    });

    const axesHelper = new THREE.AxesHelper(50);
    scene.add(axesHelper);
    axesHelperRef.current = axesHelper;

    const gridHelper = new THREE.GridHelper(100, 100);
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

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
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      scene.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // 마우스 클릭으로 객체 선택 및 TransformControls 적용
  useEffect(() => {
    const canvas = canvasRef.current;

    const handleMouseClick = (event) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

      // objects와 uploadObjects 둘 다 탐색
      const intersectsObjects = raycasterRef.current.intersectObjects(objects);
      const intersectsUploadObjects = raycasterRef.current.intersectObjects(uploadObjects);

      // 두 배열에서 가장 가까운 객체 선택
      const closestIntersect = [...intersectsObjects, ...intersectsUploadObjects].sort(
        (a, b) => a.distance - b.distance
      )[0];

      if (closestIntersect) {
        const intersectedObject = closestIntersect.object;

        // TransformControls 활성화 (적용할 TransformControls에 따라 분기)
        if (objects.includes(intersectedObject)) {
          if (transformControlsRef2.current.object) { transformControlsRef2.current.detach(); }
          transformControlsRef.current.attach(intersectedObject);
          const index = objects.findIndex((obj) => obj === intersectedObject);
          setSelectedObject(intersectedObject);
          setSelectedObject2(null);
          setEditingIndex(index);
          editShape(index);
          const { x, y, z } = intersectedObject.position;
          setShapeModifySettings((prevSettings) => ({
            ...prevSettings, posX: x, posY: y, posZ: z,
          }));
        }
        else if (uploadObjects.includes(intersectedObject)) {
          if (transformControlsRef.current.object) { transformControlsRef.current.detach(); }
          transformControlsRef2.current.attach(intersectedObject);
          setSelectedObject2(intersectedObject);
          setSelectedObject(null);
        }
      } else {
        // 빈 공간 클릭 시 TransformControls 해제
        if (transformControlsRef.current.object) { transformControlsRef.current.detach(); }
        if (transformControlsRef2.current.object) { transformControlsRef2.current.detach(); }
        setSelectedObject(null);
        setSelectedObject2(null);
        setEditingIndex(null);
      }
    };

    canvas.addEventListener('click', handleMouseClick);
    return () => {
      canvas.removeEventListener('click', handleMouseClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objects, uploadObjects]);

  // 객체 복사 기능
  const copyObject = () => {
    setCurrentMode("copy");
    if (selectedObject) { copiedObjectRef.current = selectedObject.clone(); }
    else { setCurrentMode("Non Copy"); }
  };
  const copyObject2 = () => {
    setCurrentMode("copy");
    if (selectedObject2) { copiedObjectRef2.current = selectedObject2.clone(); }
    else { setCurrentMode("Non Copy"); }
  };

  const pasteObject = () => {
    if (copiedObjectRef.current) {
      setCurrentMode("Paste");
      const copiedMesh = copiedObjectRef.current.clone(); // 복사된 객체 복사

      // 객체의 크기를 계산
      copiedMesh.geometry.computeBoundingBox(); // 경계 박스 계산
      const boundingBox = copiedMesh.geometry.boundingBox;
      const size = new THREE.Vector3();
      boundingBox.getSize(size); // 객체의 크기 추출

      // 새로운 위치로 복사: 크기만큼 x, y, z 좌표에 더한 위치로 설정
      copiedMesh.position.set(
        copiedObjectRef.current.position.x + size.x,
        copiedObjectRef.current.position.y + size.y,
        copiedObjectRef.current.position.z + size.z
      );

      sceneRef.current.add(copiedMesh); // 새로운 객체를 씬에 추가
      setObjects((prevObjects) => [...prevObjects, copiedMesh]); // 상태 업데이트

      copiedObjectRef.current = null; // 붙여넣기 후 복사된 객체 초기화 (중복 방지)
    }
  };
  const pasteObject2 = () => {
    if (copiedObjectRef2.current) {
      setCurrentMode("Paste");
      const copiedMesh = copiedObjectRef2.current.clone(); // 복사된 객체 복사

      // 객체의 크기를 계산
      copiedMesh.geometry.computeBoundingBox(); // 경계 박스 계산
      const boundingBox = copiedMesh.geometry.boundingBox;
      const size = new THREE.Vector3();
      boundingBox.getSize(size); // 객체의 크기 추출

      // 새로운 위치로 복사: 크기만큼 x, y, z 좌표에 더한 위치로 설정
      copiedMesh.position.set(
        copiedObjectRef2.current.position.x + size.x,
        copiedObjectRef2.current.position.y + size.y,
        copiedObjectRef2.current.position.z + size.z
      );

      sceneRef.current.add(copiedMesh); // 새로운 객체를 씬에 추가
      setUploadObjects((prevObjects) => [...prevObjects, copiedMesh]); // 상태 업데이트

      copiedObjectRef2.current = null; // 붙여넣기 후 복사된 객체 초기화 (중복 방지)
    }
  };

  // 객체 삭제 함수
  const deleteObject = () => {
    if (selectedObject) {
      sceneRef.current.remove(selectedObject);
      setObjects((prevObjects) => prevObjects.filter((obj) => obj !== selectedObject));
      transformControlsRef.current.detach();
      setSelectedObject(null);
      setEditingIndex(null);
      setCurrentMode("Delete");
    }
    else { setCurrentMode("Non Delete"); }
  };
  const deleteObject2 = () => {
    if (selectedObject2) {
      // selectedObject2의 index 찾기
      const indexToDelete = uploadObjects.findIndex((obj) => obj === selectedObject2);
      sceneRef.current.remove(selectedObject2);
      setUploadObjects((prevObjects) => prevObjects.filter((obj) => obj !== selectedObject2));

      // 선택된 인덱스 관리
      setSelectedIndexUploadMeshes((prevSet) => {
        const updatedSet = new Set();

        prevSet.forEach((index) => {
          if (index < indexToDelete) {
            updatedSet.add(index);  // 삭제된 인덱스보다 작은 인덱스는 그대로 유지
          } else if (index > indexToDelete) {
            updatedSet.add(index - 1);  // 삭제된 인덱스 이후의 인덱스는 1씩 감소
          }
        });
        return updatedSet;
      });

      transformControlsRef2.current.detach();
      setSelectedObject2(null);
      setCurrentMode("Delete");
    }
    else { setCurrentMode("Non Delete"); }
  };

  // 키보드 이벤트 핸들러
  const handleKeyDown = (event) => {
    if (event.ctrlKey && event.key === 'c') { copyObject(); }
    else if (event.ctrlKey && event.key === 'v') { pasteObject(); }
    else if (event.key === 'Delete') { deleteObject(); }
    else {
      switch (event.key) {
        case 'a':
          setCurrentMode('Translate');
          transformControlsRef.current.setMode('translate');
          break;
        case 's':
          setCurrentMode('Rotate');
          transformControlsRef.current.setMode('rotate');
          break;
        case 'd':
          setCurrentMode('Scale');
          transformControlsRef.current.setMode('scale');
          break;
        default:
          break;
      }
    }
  };
  const handleKeyDown2 = (event) => {
    if (event.ctrlKey && event.key === 'c') { copyObject2(); }
    else if (event.ctrlKey && event.key === 'v') { pasteObject2(); }
    else if (event.key === 'Delete') { deleteObject2(); }
    else {
      switch (event.key) {
        case 'a':
          setCurrentMode('Translate');
          transformControlsRef2.current.setMode('translate');
          break;
        case 's':
          setCurrentMode('Rotate');
          transformControlsRef2.current.setMode('rotate');
          break;
        case 'd':
          setCurrentMode('Scale');
          transformControlsRef2.current.setMode('scale');
          break;
        default:
          break;
      }
    }
  };

  // 키보드 이벤트 리스너 추가
  useEffect(() => {
    const handleKeyDownWrapper = (event) => handleKeyDown(event);

    window.addEventListener('keydown', handleKeyDownWrapper);

    return () => {
      window.removeEventListener('keydown', handleKeyDownWrapper);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedObject]);
  useEffect(() => {
    const handleKeyDownWrapper2 = (event) => handleKeyDown2(event);

    window.addEventListener('keydown', handleKeyDownWrapper2);

    return () => {
      window.removeEventListener('keydown', handleKeyDownWrapper2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedObject2]);


  // GUI, Tip 저장 영역 
  const guiTurn = () => { setGuiTrue(!guiTrue); }
  const tipTurn = () => { setTipTrue(!tipTrue); }

  const saveScene = () => {
    const scene = sceneRef.current;
    const gridHelper = gridHelperRef.current;
    const axesHelper = axesHelperRef.current;
    const transformControls = transformControlsRef.current;
    const transformControls2 = transformControlsRef2.current;

    if (gridHelperTrue) { scene.remove(gridHelperRef.current); }
    if (axesHelperTrue) { scene.remove(axesHelperRef.current); }

    // TransformControls에서 해당 객체 제거 (detach)
    if (transformControlsRef.current.object) {
      scene.remove(transformControlsRef.current);
      transformControlsRef.current.detach();
    }
    if (transformControlsRef2.current.object) {
      scene.remove(transformControlsRef2.current);
      transformControlsRef2.current.detach();
    }

    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (result) => {
        const output = JSON.stringify(result, null, 2);
        const blob = new Blob([output], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'model.gltf';
        link.click();
      },
      { binary: false }
    );
    if (gridHelperTrue) { scene.add(gridHelper); }
    if (axesHelperTrue) { scene.add(axesHelper); }        
    scene.add(transformControls);
    scene.add(transformControls2);
  };

  /* 조명, 카메라, Axes, Grid 설정
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  */
  const handleChange = (event) => {
    const { id, value } = event.target;
    setSceneSettings((prevSettings) => ({
      ...prevSettings,
      [id]: id.includes('Intensity') || id.includes('Pos') ? parseFloat(value) : value,
    }));
  };
  
  const handleCameraPositionChange = (axis, value) => {
    const newPosition = { ...cameraPosition, [axis]: value };
    setCameraPosition(newPosition);

    const camera = cameraRef.current;
    if (camera) {
      camera.position.set(newPosition.x, newPosition.y, newPosition.z);
      camera.updateProjectionMatrix(); // 카메라의 프로젝션 행렬 업데이트
    }
  };

  const resetLightControls = () => {
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

  const resetCameraControls = () => {
    setCameraPosition({ x: 5, y: 5, z: 5 });
    cameraRef.current.position.x = 5;
    cameraRef.current.position.y = 5;
    cameraRef.current.position.z = 5;
  }

  const handleAxesHelper = () => {
    const scene = sceneRef.current;
    if (axesHelperTrue === true){
      scene.remove(axesHelperRef.current);
      setAxesHelperTrue(!axesHelperTrue);
    }
    else {
      scene.add(axesHelperRef.current);
      setAxesHelperTrue(!axesHelperTrue);
    }
  }
  const handleGridHelper = () => {
    const scene = sceneRef.current;
    if (gridHelperTrue === true){
      scene.remove(gridHelperRef.current);
      setGridHelperTrue(!gridHelperTrue);
    }
    else {
      scene.add(gridHelperRef.current);
      setGridHelperTrue(!gridHelperTrue);
    }
  }

  /* 매쉬 더하기, 수정 영역 
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  */
  const turnOff = () => {
    setEditingIndex(null);
  }

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

  const handleDeleteMeshes = (index) => {
    if (transformControlsRef.current.object) {
      transformControlsRef.current.detach();
    }
    else if (transformControlsRef2.current.object) {
      transformControlsRef2.current.detach();
    }
    const updatedObjects = [...objects];
    const objToRemove = updatedObjects[index];

    sceneRef.current.remove(objToRemove);
    setObjects(updatedObjects.filter((_, i) => i !== index));
    setEditingIndex(null);
  };

  const handleDeleteAllMeshes = () => {
    objects.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
      sceneRef.current.remove(mesh);
    });
    setSelectedObject(null);
    setSelectedObject2(null);
    if (transformControlsRef.current.object) {
      transformControlsRef.current.detach();
    }
    else if (transformControlsRef2.current.object) {
      transformControlsRef2.current.detach();
    }
    setObjects([]);
    setEditingIndex(null);
  };
  
  /* 업로드 영역
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  */
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.') + 1).toLowerCase(); // 마지막 점 이후의 문자열 추출
    if (!file) return;
    else if (fileExtension !== 'gltf' && fileExtension !== 'glb') {
      sweetAlertError("GLTF, GLB 가 아님", "올바른 형식의 파일을 업로드 하십시오.");
      return;
    }
    const url = URL.createObjectURL(file);
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    loader.setDRACOLoader(dracoLoader);

    loader.load(url, (gltf) => {
      if (gltf.scene) {
        const scene = gltf.scene;
        let meshes = [];
        // GLTF 씬의 모든 노드를 순회
        scene.traverse((child) => {
          if (child.isMesh) { meshes.push(child); }
        });
        setUploadObjects((prev) => [...prev, ...meshes]); // 상태 업데이트
        sceneRef.current.add(...meshes);
      }
      dracoLoader.dispose();
    }, undefined, (error) => {
      console.error('모델을 로딩하는 도중 오류 발생:', error);
    });
    URL.revokeObjectURL(url);
    // 파일 선택 후 input 값을 초기화하여 동일한 파일 다시 선택 가능하게 함
    event.target.value = ''; // 이 부분을 추가하여 input 초기화
  };

  const [scaleValues, setScaleValues] = useState({}); // 각 매쉬의 크기를 저장할 상태

  // 매쉬 삭제
  const handleDeleteUploadMesh = (mesh, indexToDelete) => {
    if (transformControlsRef.current.object) {
      transformControlsRef.current.detach();
    }
    else if (transformControlsRef2.current.object) {
      transformControlsRef2.current.detach();
    }
    setUploadObjects((prev) => prev.filter((m) => m !== mesh));

    // Set에서 삭제하고, 그 이후 인덱스를 하나씩 당기는 로직
    setSelectedIndexUploadMeshes((prevSet) => {
      const updatedSet = new Set();

      prevSet.forEach(index => {
        if (index < indexToDelete) {
          updatedSet.add(index); // 삭제된 인덱스보다 작은 인덱스는 그대로 유지
        } else if (index > indexToDelete) {
          updatedSet.add(index - 1); // 삭제된 인덱스 이후의 인덱스는 1씩 감소
        }
      });

      return updatedSet;
    });

    mesh.geometry.dispose();
    mesh.material.dispose();
    sceneRef.current.remove(mesh);
  };

  // 모든 업로드 매쉬 삭제
  const handleDeleteAllUploadMeshes = () => {
    uploadObjects.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
      sceneRef.current.remove(mesh);
    });
    if (transformControlsRef.current.object) {
      transformControlsRef.current.detach();
    }
    else if (transformControlsRef2.current.object) {
      transformControlsRef2.current.detach();
    }
    setSelectedIndexUploadMeshes(new Set());
    setSelectedObject(null);
    setSelectedObject2(null);
    setUploadObjects([]);
    setScaleValues({});
  };

  const handleColorChange = (index, color) => {
    uploadObjects[index].material.color.set(color);
  };

  const handleSizeChange = (mesh, size, index) => {
    const updatedScaleValues = { ...scaleValues, [index]: size };
    setScaleValues(updatedScaleValues); // 크기 상태 업데이트
    mesh.scale.set(size, size, size); // 매쉬 크기 반영
  };

  const handleSelectAll = () => {
    if (selectedIndexUploadMeshes.size === uploadObjects.length) {
      setSelectedIndexUploadMeshes(new Set()); // 전체 해제
    } else {
      setSelectedIndexUploadMeshes(new Set(uploadObjects.map((_, index) => index))); // 전체 선택
    }
  };

  const handleCheckboxChange = (index) => {
    const newSelectedIndexes = new Set(selectedIndexUploadMeshes);
    if (newSelectedIndexes.has(index)) {
      newSelectedIndexes.delete(index); // 선택 해제
    } else {
      newSelectedIndexes.add(index); // 선택
    }
    setSelectedIndexUploadMeshes(newSelectedIndexes);
  };

  const handleDeleteSelected = () => {
    if (transformControlsRef.current.object) {
      transformControlsRef.current.detach();
    }
    else if (transformControlsRef2.current.object) {
      transformControlsRef2.current.detach();
    }
    // 삭제될 배열 생성
    const objectsToRemove = uploadObjects.filter((_, index) => selectedIndexUploadMeshes.has(index));

    // sceneRef.current에서 요소 제거
    objectsToRemove.forEach((mesh) => {
      mesh.geometry.dispose();
      mesh.material.dispose();
      sceneRef.current.remove(mesh); // 요소 삭제
    });

    // 새로운 배열 생성 (삭제된 요소 제외)
    const newUploadObjects = uploadObjects.filter((_, index) => !selectedIndexUploadMeshes.has(index));
    setUploadObjects(newUploadObjects);
    setSelectedIndexUploadMeshes(new Set()); // 선택된 인덱스 초기화
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>

          <canvas ref={canvasRef} style={{ maxWidth: '100%', display: 'block' }}></canvas>
          <div className="web-editor-inf">
            {guiTrue ? <>
              <button type="button" style={{ marginBottom: '10px' }} onClick={guiTurn}>GUI Close</button>
              <button type="button" onClick={tipTurn}>User Tip</button>
              <button type="button" onClick={saveScene} >Scene Save</button>
              <button type="button" onClick={() => window.location.href = "/"}>Cache All Clear</button>
              {tipTrue &&
                <div className="web-editor-tip">
                  🚀 3D 모델을 생성, 업로드, 다운로드 가능한 Basic 한 에디터 입니다. <br /><br />
                  1. 카메라 조절과 빛의 조절이 가능하며, 카메라 조절 시 수동으로 숫자 입력(0 이상)도 되지만, OrbitControls 기능으로 마우스 조절도 가능합니다.<br /><br />
                  2. AxesHelper, GridHelper 가 거슬린다면 끄고 켜는게 가능합니다. 직관적인 모델의 구상을 보려면 기능을 활용해보세요.<br /><br />
                  3. 생성한 모델은 속성값과 재질의 변경, 색상 변경 등의 기능이 존재하며 고유한 Shape 속성 변경은 <span style={{ color: "red" }}>불가</span>합니다.<br /><br />
                  4. 모델을 생성하려 하지만 생성되지 않는 경우 Segement 가 생성 최소 수준을 벗어나거나, 길이가 0 인 경우 등 다양한 요인이 존재할 수 있습니다.<br /><br />
                  5. 생성된 모델은 마우스로 쉽게 조작이 가능합니다. 크기 확대축소, 모델 위치 변경, 모델의 회전, 삭제 등 기능이 존재하며 a,s,d,del 키를 누르게되면 모드가 변경됩니다.<br /><br />
                  6. 모델을 선택한 이후 ctrl + c, ctrl + v 가능합니다. 단 1회성 복사 붙여넣기 이므로 원하는 객체를 다음 기회에 선택 해야합니다.<br /><br />
                  7. 도형을 업로드 가능합니다. 해당 모델을 잘 컨트롤하여 본 페이지에서 적용되는 생성 모델과 조화를 이뤄보세요!
                </div>}
              <div className="web-editor-light">
                <h3>Light Setup</h3>
                <div>
                  <label>배경 색 변경 </label>
                  <input type="color" id="rendererBackgroundColor" value={sceneSettings.rendererBackgroundColor} onChange={handleChange} />
                </div>
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
                <h3>Camera Position</h3>
                <label>X : </label><input type="number" step="0.1" style={{ width: '50px' }} value={cameraPosition.x} onChange={(e) => handleCameraPositionChange('x', parseFloat(e.target.value))} />
                <label>Y : </label><input type="number" step="0.1" style={{ width: '50px' }} value={cameraPosition.y} onChange={(e) => handleCameraPositionChange('y', parseFloat(e.target.value))} />
                <label>Z : </label><input type="number" step="0.1" style={{ width: '50px' }} value={cameraPosition.z} onChange={(e) => handleCameraPositionChange('z', parseFloat(e.target.value))} /><br />
                <button type="button" onClick={resetLightControls} style={{ marginTop: '10px' }}>Reset Light</button>
                <button type="button" onClick={resetCameraControls}>Reset Camera</button>
                {axesHelperTrue ? <button onClick={handleAxesHelper}>AxesHelper OFF</button>:<button onClick={handleAxesHelper}>AxesHelper ON</button>}
                {gridHelperTrue ? <button onClick={handleGridHelper}>GridHelper OFF</button>:<button onClick={handleGridHelper}>GridHelper ON</button>}
              </div>

              {editingIndex === null ? (
                <div className="web-editor-add-mesh">
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
                  </div>
                  <br />
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
                  }
                  <div>
                    <label>X : </label>
                    <input style={{ width: "40px" }} type="number" id="posX" value={shapeSettings.posX} onChange={(e) => { setShapeSettings(prev => ({ ...prev, posX: parseFloat(e.target.value) })); }} />
                    <label> Y : </label>
                    <input style={{ width: "40px" }} type="number" id="posY" value={shapeSettings.posY} onChange={(e) => { setShapeSettings(prev => ({ ...prev, posY: parseFloat(e.target.value) })); }} />
                    <label> Z : </label>
                    <input style={{ width: "40px" }} type="number" id="posZ" value={shapeSettings.posZ} onChange={(e) => { setShapeSettings(prev => ({ ...prev, posZ: parseFloat(e.target.value) })); }} />
                  </div><br />
                  <button type="button" onClick={addShape}>매쉬 추가</button>
                </div>
              ) : (
                <div className="web-editor-modify-mesh">
                  <h3>Edit "Mesh {editingIndex + 1}"</h3>
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
              <div className="web-editor-meshes">
                <h3>Add Mesh : {currentMode} Mode</h3>
                {objects.length > 0 && <button onClick={handleDeleteAllMeshes}>Delete All Meshes</button>}
                {objects.map((obj, index) => (
                  <div className="web-editor-mini-div" key={index}>
                    <span>Mesh {index + 1}</span><br />
                    <button type="button" style={{ marginTop: '5px' }} onClick={() => editShape(index)}>도형 수정</button>
                    <button type="button" onClick={() => handleDeleteMeshes(index)}>❌</button>
                  </div>
                ))}
              </div>
              <div className="web-editor-upload-meshes">
                <h3>Upload Mesh : {currentMode} Mode</h3>
                <input id="file-input" type="file" accept=".glb,.gltf" className="upload-input" onChange={handleFileUpload} />
                <button className="upload-label" onClick={() => document.getElementById('file-input').click()}>Upload File</button>
                {uploadObjects.length > 0 && <>
                  <button onClick={handleDeleteSelected}>선택 삭제</button>
                  <button onClick={handleSelectAll}>{selectedIndexUploadMeshes.size === uploadObjects.length ? '전체 해제' : '전체 선택'}</button>
                  <button onClick={handleDeleteAllUploadMeshes}>Delete All Meshes</button>
                </>}
                {uploadObjects.map((mesh, index) => (
                  <div className="web-editor-mini-div" key={index}>
                    <span>{mesh.name || `Object ${index + 1}`} </span>
                    <input type="color" value={`#${mesh.material.color.getHexString()}`} onChange={(e) => handleColorChange(index, e.target.value)} />
                    <input type="checkbox" className="custom-checkbox" checked={selectedIndexUploadMeshes.has(index)} onChange={() => handleCheckboxChange(index)} /><br />
                    <input type="number" min="0" step="any" value={mesh.scale.x} style={{ height: '20px', width: '250px', marginRight: '5px' }} onChange={(e) => handleSizeChange(mesh, parseFloat(e.target.value), index)} />
                    <button onClick={() => handleDeleteUploadMesh(mesh, index)}>❌</button>
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