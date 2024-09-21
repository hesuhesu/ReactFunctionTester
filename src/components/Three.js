import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import "../css/Three.css";

const Three = () => {
  const canvasRef = useRef();
  const [true1, setTrue1] = useState(false);

  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderConfig({ type: 'js' });
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
  loader.setDRACOLoader(dracoLoader);

  loader.load('/bike.gltf', (gltf) => {
    if (gltf.scene) {
      dracoLoader.dispose(); // 메모리 누수 방지
      const scene = gltf.scene;

      // 애니메이션 믹서 추가
      const mixer = new THREE.AnimationMixer(scene);
      gltf.animations.forEach((clip) => {
        mixer.clipAction(clip).play(); // 모든 애니메이션 클립 재생
      });
      // 동적으로 div 요소 생성
      const meshInfoDiv = document.getElementById('information');
      const meshes = [];
      meshInfoDiv.innerHTML = '';
      scene.traverse((child) => {
        if (child.isMesh) {
          meshes.push(child);

          // 메쉬 이름 추가
          const meshName = document.createElement('div');
          meshName.innerText = child.name;
          meshName.style.fontWeight = 'bold'; // 텍스트 굵게 표시

          // 색상 선택기 추가
          const colorInput = document.createElement('input');
          colorInput.type = 'color';
          colorInput.value = '#ffffff'; // 기본 색상 흰색

          // 색상 변경 이벤트 추가
          colorInput.addEventListener('input', (event) => {
            const color = new THREE.Color(event.target.value);
            child.material.color.set(color);
          });

          // 크기 조절 입력 필드 추가
          const sizeInput = document.createElement('input');
          sizeInput.type = 'number';
          sizeInput.value = child.scale.x; // 기본 크기
          sizeInput.min = 0; // 최소 크기
          sizeInput.step = "any"; // 모든 범위 허용

          // 크기 변경 이벤트 추가
          sizeInput.addEventListener('input', (event) => {
            const newSize = parseFloat(event.target.value);
            child.scale.set(newSize, newSize, newSize);
          });

          meshInfoDiv.appendChild(meshName);
          meshInfoDiv.appendChild(colorInput);
          meshInfoDiv.appendChild(sizeInput);
        }
      });

      // 저장하기 버튼 추가
      const saveButton = document.createElement('button');
      saveButton.type = 'button';
      saveButton.innerText = '파일 즉시 저장하기';
      saveButton.style.marginTop = '10px';
      meshInfoDiv.appendChild(saveButton);

      // 저장 버튼 클릭 이벤트 핸들러 함수
      function onSaveButtonClick() {
        const helpers = [axesHelper, gridHelper];
        helpers.forEach(helper => helper.visible = false); // 도우미들 숨기기

        // Check for sizeInput values of 0
        const sizeInputs = document.querySelectorAll('input[type="number"]');
        const hasZeroSize = Array.from(sizeInputs).some(input => parseFloat(input.value) === 0);

        if (hasZeroSize) {
          helpers.forEach(helper => helper.visible = true); // 도우미들 다시 보이기
          return; // 저장하지 않고 종료
        }

        // 애니메이션 클립이 있는 경우 애니메이션 데이터를 포함하여 GLTF로 저장
        const options = {
          binary: false,   // JSON 형태로 저장, binary: true로 하면 GLB 형태로 저장
          animations: gltf.animations  // 애니메이션을 포함하여 저장
        };
        const exporter = new GLTFExporter();
        exporter.parse(
          scene,
          (result) => {
            const blob = new Blob([JSON.stringify(result)], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'model.gltf';
            link.click();
          },
          (error) => console.error('GLTF 파일 저장 중 오류가 발생했습니다:', error),
          options  // 애니메이션을 포함한 옵션을 전달
        );
        helpers.forEach(helper => helper.visible = true); // 도우미들 다시 보이기
      }
      // 저장 버튼 클릭 이벤트 등록
      saveButton.addEventListener('click', onSaveButtonClick);

      const allRemoveBtn = document.getElementById("ThreeD-Delete");
      allRemoveBtn.addEventListener('click', function () {
        setTrue1(0);
        scene.traverse((object) => {
          if (!object.isMesh) return;
          object.geometry.dispose();
          if (object.material.isMaterial) {
            object.material.dispose();
          }
        });
        meshInfoDiv.innerHTML = '';
        saveButton.removeEventListener('click', onSaveButtonClick); // 클릭 이벤트 제거

        lightControlsDiv.innerHTML = '';
        // 두 번 클릭 이벤트 리스너 제거
        renderer.domElement.removeEventListener('dblclick', handleDblClick);
        renderer.dispose();
        controls.dispose();
        scene.clear();
      }, { once: true });

      // 모델의 bounding box 계산
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // 모든 위치를 정중앙으로 조정
      scene.position.sub(center);
      const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.set(center.x, center.y, size.z * 2); // 모델 크기에 따라 카메라 위치 조정

      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
      });
      renderer.setSize(1400, 900);
      renderer.setClearColor(0xffffff, 1);

      const controls = new OrbitControls(camera, renderer.domElement);
      // controls.enableDamping = true;

      // 축 선 그리기
      const axesHelper = new THREE.AxesHelper(50);
      scene.add(axesHelper);

      // 그리드 그리기
      const gridHelper = new THREE.GridHelper(100, 100);
      scene.add(gridHelper);

      const ambientLight = new THREE.AmbientLight(0xffffff, 1);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(0, 1, 0);
      scene.add(directionalLight);
      
      // 조명 값 조정 UI 추가 (색상 및 강도)
      const lightControlsDiv = document.createElement('div');
      lightControlsDiv.style.marginTop = '20px'; // 조명 조정 영역 아래에 20px 간격 추가
      lightControlsDiv.style.fontWeight = 'bold'; // 텍스트 굵게 표시
      lightControlsDiv.style.border = '2px solid black'; // 테두리 추가
      lightControlsDiv.style.padding = '10px'; // 테두리 안쪽 여백 추가
      lightControlsDiv.innerHTML = `
        <div>
          <label>Directional Light Color:</label>
          <input type="color" id="directionalLightColor" value="#ffffff" />
          <label>Intensity:</label>
          <input type="range" id="directionalLightIntensity" min="0" max="2" step="0.01" value="1" />
        </div>
        <div>
          <label>Ambient Light Color:</label>
          <input type="color" id="ambientLightColor" value="#ffffff" />
          <label>Intensity:</label>
          <input type="range" id="ambientLightIntensity" min="0" max="2" step="0.01" value="1" />
        </div>
        <div>
          <label>Directional Light Position X:</label>
          <input type="range" id="directionalLightPosX" min="-10" max="10" step="0.1" value="0" />
        </div>
        <div>
          <label>Directional Light Position Y:</label>
          <input type="range" id="directionalLightPosY" min="-10" max="10" step="0.1" value="1" />
        </div>
        <div>
          <label>Directional Light Position Z:</label>
          <input type="range" id="directionalLightPosZ" min="-10" max="10" step="0.1" value="0" />
        </div>
      `;
      meshInfoDiv.appendChild(lightControlsDiv);

      // 조명 값 변경 이벤트 핸들러 정의
      const handleDirectionalLightColorChange = (event) => {
        const color = new THREE.Color(event.target.value);
        directionalLight.color.set(color);
      };

      const handleDirectionalLightIntensityChange = (event) => {
        directionalLight.intensity = parseFloat(event.target.value);
      };

      const handleAmbientLightColorChange = (event) => {
        const color = new THREE.Color(event.target.value);
        ambientLight.color.set(color);
      };

      const handleAmbientLightIntensityChange = (event) => {
        ambientLight.intensity = parseFloat(event.target.value);
      };

      const handleDirectionalLightPosXChange = (event) => {
        directionalLight.position.x = parseFloat(event.target.value);
      };

      const handleDirectionalLightPosYChange = (event) => {
        directionalLight.position.y = parseFloat(event.target.value);
      };

      const handleDirectionalLightPosZChange = (event) => {
        directionalLight.position.z = parseFloat(event.target.value);
      };

      // 이벤트 리스너 등록
      document.getElementById('directionalLightColor').addEventListener('input', handleDirectionalLightColorChange);
      document.getElementById('directionalLightIntensity').addEventListener('input', handleDirectionalLightIntensityChange);
      document.getElementById('ambientLightColor').addEventListener('input', handleAmbientLightColorChange);
      document.getElementById('ambientLightIntensity').addEventListener('input', handleAmbientLightIntensityChange);
      document.getElementById('directionalLightPosX').addEventListener('input', handleDirectionalLightPosXChange);
      document.getElementById('directionalLightPosY').addEventListener('input', handleDirectionalLightPosYChange);
      document.getElementById('directionalLightPosZ').addEventListener('input', handleDirectionalLightPosZChange);

      // 두 번 클릭 이벤트 핸들러 정의
      let autoRotate = false; // 자동 회전 상태 변수

      const handleDblClick = () => {
        autoRotate = !autoRotate; // 자동 회전 상태 전환
      };
      // 두 번 클릭 이벤트 추가
      renderer.domElement.addEventListener('dblclick', handleDblClick);

      const clock = new THREE.Clock();
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update(); // clock.getDelta() 안에 추가할려면 추가
        const delta = clock.getDelta(); // 시간 간격 계산
        mixer.update(delta); // 애니메이션 믹서 업데이트
        // 자동 회전 기능
        if (autoRotate) {
          scene.rotation.y += 0.01; // Y축을 기준으로 회전
        }
        renderer.render(scene, camera);
      };
      animate();
      console.log("Success Load GLTF!!", canvasRef.current);
    } else { console.error('Failed to load GLTF file: scene is undefined'); }
  },
    undefined, (error) => { console.error('Failed to load GLTF file:', error); });

  const handleTrue = () => { setTrue1(!true1); }

  return (
    <div>
      {true1 ? <div className="ThreeD-div">
        <button id="ThreeD-Delete">3D Upload 삭제</button>
        <div className="canvas-container">
          <canvas ref={canvasRef}></canvas>
          <div id="information">Loading...</div>
        </div>
      </div> : <button onClick={handleTrue}>3D Upload 시작</button>}
    </div>
  )
}

export default Three;