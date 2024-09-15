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
                sizeInput.min = 0.1; // 최소 크기
                sizeInput.step = 0.1; // 증가 단위
                
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
        saveButton.innerText = '저장하기';
        saveButton.style.marginTop = '10px';
        meshInfoDiv.appendChild(saveButton);

        // 저장 버튼 클릭 이벤트
        saveButton.addEventListener('click', () => {
          const helpers = [axesHelper, gridHelper];
          helpers.forEach(helper => helper.visible = false); // 도우미들 숨기기
      
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
      });

          const allRemoveBtn = document.getElementById("ThreeD-Delete");
          allRemoveBtn.addEventListener('click', function () {
            setTrue1(false); // Reset state to hide 3D view
            scene.traverse((object) => {
                if (!object.isMesh) return;
                object.geometry.dispose();
                if (object.material.isMaterial) {
                    object.material.dispose();
                }
            });
            renderer.dispose();
            controls.dispose();
            scene.clear();
          });

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
          renderer.setSize(1000, 1000);
          renderer.setClearColor(0xffffff, 1);
  
          const controls = new OrbitControls(camera, renderer.domElement);
          // controls.enableDamping = true;
  
          // 축 선 그리기
          const axesHelper = new THREE.AxesHelper(50);
          scene.add(axesHelper);

          // 그리드 그리기
          const gridHelper = new THREE.GridHelper(100,100);
          scene.add(gridHelper);
          
          const ambientLight = new THREE.AmbientLight(0xffffff, 1);
          scene.add(ambientLight);
  
          const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
          directionalLight.position.set(0, 1, 0);
          scene.add(directionalLight);

          

          // 모델 두 번 클릭 이벤트 추가
          let autoRotate = false; // 자동 회전 상태 변수
          renderer.domElement.addEventListener('dblclick', () => {
            autoRotate = !autoRotate; // 자동 회전 상태 전환
          });

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
        } else { console.error('Failed to load GLTF file: scene is undefined'); }},
      undefined, (error) => { console.error('Failed to load GLTF file:', error); });
    
    const handleTrue = () => {
      setTrue1(!true1);
    }

    return (
        <div>
          {true1 ? <div className="ThreeD-div">
            <button id = "ThreeD-Delete">3D Upload 삭제</button>
            <div className="canvas-container">
              <canvas ref={canvasRef}></canvas>
              <div id="information">Loading...</div>
          </div>
          </div> : <button onClick={handleTrue}>3D Upload 시작</button>}
        </div>
    )
}

export default Three;