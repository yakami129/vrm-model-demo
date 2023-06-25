import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRM } from "@pixiv/three-vrm";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

function App() {
  // 利用React的useRef创建一个ref，然后把它附加到canvas元素上
  const canvasRef = useRef(null);

  useEffect(() => {
    // 获取canvas DOM元素，然后创建一个WebGL渲染器并将其附加到canvas上
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true, // 开启alpha，可以实现透明背景
    });

    // 设置渲染器的大小为窗口大小
    renderer.setSize(window.innerWidth, window.innerHeight);

    // 创建一个场景
    const scene = new THREE.Scene();

    // 创建一个透视相机
    const camera = new THREE.PerspectiveCamera(
      75, // 视角
      window.innerWidth / window.innerHeight, // 纵横比
      0.1, // 近截面
      1000 // 远截面
    );


    // 创建环境光源和定向光源，然后添加到场景中
    const light = new THREE.AmbientLight(0xffffff, 0.5); // 创建环境光源
    scene.add(light); // 将环境光源添加到场景中

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // 创建定向光源
    directionalLight.position.set(0, 1, 1).normalize(); // 设置光源的位置并进行归一化
    scene.add(directionalLight); // 将定向光源添加到场景中

    // 使用OrbitControls来控制相机的平移和旋转
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update(); // 更新控制器，如果开启了damping或者autoRotate，必须在动画循环中调用

    const mixer = new THREE.AnimationMixer(scene); // 创建一个动画混合器

    // 使用GLTFLoader加载vrm模型
    const loader = new GLTFLoader();
    loader.load(
      "/model/aili.vrm", // vrm模型的相对路径
      (gltf) => { // 模型加载完成后的回调函数
        VRM.from(gltf).then((vrm) => { // 从gltf加载出vrm模型
          // 调整模型的位置和大小
          adjustModel(vrm.scene);

          // 将模型添加到场景中
          scene.add(vrm.scene);

          // 如果模型包含动画，播放第一个动画
          if (gltf.animations && gltf.animations.length > 0) {
            const action = mixer.clipAction(gltf.animations[0]); // 创建一个动画动作
            action.play(); // 播放动画
            console.log("播放动画: ", gltf.animations[0].name); // 记录日志
          } else {
            console.log("模型不包含动画"); // 记录日志
          }

        });
      },
      (progress) => console.log("正在加载模型: ", progress), // 加载进度的回调函数
      (error) => console.error("加载模型失败: ", error) // 加载失败的回调函数
    );

    // 调整模型的位置和大小
    const adjustModel = (model) => {
      // 计算模型的包围盒
      const box = new THREE.Box3().setFromObject(model);

      // 计算包围盒的中心点
      const center = box.getCenter(new THREE.Vector3());

      // 将模型移动到场景的中心
      model.position.x += (model.position.x - center.x);
      model.position.y += (model.position.y - center.y);
      model.position.z += (model.position.z - center.z);

      // 计算包围盒的大小
      const size = box.getSize(new THREE.Vector3());

      // 计算缩放系数，使得模型的最大尺寸为1
      const scaleFactor = 1 / Math.max(size.x, size.y, size.z);

      // 缩放模型
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);

      // 调整相机的位置
      camera.position.copy(center); // 将相机的位置设置为包围盒的中心
      camera.position.x += size.x / 2; // 将相机向x轴正方向移动
      camera.position.y += size.y / 2; // 将相机向y轴正方向移动
      camera.position.z += size.z * 2; // 将相机向z轴正方向移动
      camera.lookAt(center); // 将相机的焦点设置为包围盒的中心
    }

    // 当窗口大小改变时，调整渲染器和相机的设置
    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight); // 更新渲染器的大小
      camera.aspect = window.innerWidth / window.innerHeight; // 更新相机的纵横比
      camera.updateProjectionMatrix(); // 重新计算投影矩阵
    };
    
    window.addEventListener('resize', handleResize); // 监听resize事件

    // 动画循环
    const animate = function () {
      requestAnimationFrame(animate); // 请求下一帧的动画
      controls.update(); // 更新控制器
      renderer.render(scene, camera); // 渲染场景
    };
    animate();

    // 在组件卸载时执行清理操作
    return () => {
      window.removeEventListener('resize', handleResize); // 移除resize事件监听器
      renderer.dispose(); // 释放渲染器的资源
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: 'fixed', top: 0, left: 0 }} />;
}

export default App;
