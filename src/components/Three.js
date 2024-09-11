import React, { useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const Three = () => {
    const canvasRef = useRef();

    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderConfig({ type: 'js' });
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    loader.setDRACOLoader(dracoLoader);
    loader.load('/korrigan wolf.gltf', (gltf) => {
        if (gltf.scene) {
          const scene = gltf.scene;
          scene.scale.set(0.5, 0.5, 0.5);
          scene.position.set(0, 0, 0);

          // 동적으로 div 요소 생성
          const meshInfoDiv = document.createElement('div');
          meshInfoDiv.style.position = 'absolute';
          meshInfoDiv.style.top = '10px';
          meshInfoDiv.style.left = '1100px'; // canvas 오른쪽에 위치
          meshInfoDiv.style.color = 'white';
          meshInfoDiv.style.backgroundColor = 'rgba(0, 0, 0, 1)';
          meshInfoDiv.style.padding = '10px';
          document.body.appendChild(meshInfoDiv);

          const meshes = [];
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
              const exporter = new GLTFExporter();
              exporter.parse(
                scene,
                function (result) {
                  const blob = new Blob([JSON.stringify(result)], { type: 'application/json' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = 'modified_model.gltf';
                  link.click();
                },
                function (error) {
                  console.error('An error occurred during parsing', error);
                }
              );
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

          // 축 선 그리기
          const axesHelper = new THREE.AxesHelper(50);
          scene.add(axesHelper);

          // 그리드 그리기
          const gridHelper = new THREE.GridHelper(100,100);
          scene.add(gridHelper);
  
          const controls = new OrbitControls(camera, renderer.domElement);
          // controls.enableDamping = true;
  
          const ambientLight = new THREE.AmbientLight(0xffffff, 1);
          scene.add(ambientLight);
  
          const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
          directionalLight.position.set(0, 1, 0);
          scene.add(directionalLight);

          // 애니메이션 믹서 추가
          const mixer = new THREE.AnimationMixer(scene);
          gltf.animations.forEach((clip) => {
              mixer.clipAction(clip).play(); // 모든 애니메이션 클립 재생
          });

          // 두 번 클릭 이벤트 추가
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
          // 메모리 누수를 방지하기 위한 cleanup
          return () => {
            renderer.dispose();
            document.body.removeChild(meshInfoDiv); // 동적으로 생성한 div 제거
            document.body.removeChild(renderer.domElement);
          };
        } else { console.error('Failed to load GLTF file: scene is undefined'); }},
      undefined, (error) => { console.error('Failed to load GLTF file:', error); });

    return (
        <div>
            <canvas ref={canvasRef}></canvas>
        </div>
    )
}

export default Three;