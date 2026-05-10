/**
 * Avatar3DPreview.tsx — AI主播 3D 预览组件 v1.0
 * 
 * 功能：
 * - Three.js 3D 场景，主播照片卡片 360° 旋转
 * - 鼠标/手指拖拽旋转，松手后惯性减速
 * - 自动旋转（无人交互时）
 * - 粒子背景 + 发光效果（游戏级视觉）
 * - 语音试听按钮（调用 TTS 生成试听音频）
 * - 纯客户端 WebGL 渲染，零服务器压力
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

interface Props {
  avatarImageUrl: string;
  avatarName: string;
  voice?: string;          // TTS voice ID
  profileId?: string;
  width?: number;
  height?: number;
  autoRotate?: boolean;
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

export default function Avatar3DPreview({
  avatarImageUrl,
  avatarName,
  voice,
  profileId,
  width = 360,
  height = 480,
  autoRotate = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cardRef = useRef<THREE.Mesh | null>(null);
  const frameId = useRef<number>(0);
  
  // 旋转状态
  const rotationY = useRef(0);
  const targetRotationY = useRef(0);
  const isDragging = useRef(false);
  const prevMouseX = useRef(0);
  const velocityY = useRef(0);
  const autoRotateSpeed = useRef(0.003);
  
  // 语音状态
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ═══ Three.js 初始化 ═══
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // ── 场景 ──
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // ── 相机 ──
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // ── 渲染器 ──
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── 灯光 ──
    // 环境光
    const ambient = new THREE.AmbientLight(0x404060, 1.2);
    scene.add(ambient);
    
    // 主光源（前方偏上）
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(2, 3, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(512, 512);
    scene.add(keyLight);
    
    // 补光（侧面）
    const fillLight = new THREE.DirectionalLight(0x8866ff, 1.2);
    fillLight.position.set(-3, 0, 2);
    scene.add(fillLight);
    
    // 底部补光（消除阴影）
    const rimLight = new THREE.DirectionalLight(0xff6688, 0.8);
    rimLight.position.set(0, -2, 0);
    scene.add(rimLight);

    // ── 粒子背景 ──
    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = 200;
    const positions = new Float32Array(particlesCount * 3);
    const colors = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      
      // 紫色-金色渐变粒子
      const t = Math.random();
      colors[i * 3] = 0.5 + t * 0.5;       // R
      colors[i * 3 + 1] = 0.3 + t * 0.3;   // G
      colors[i * 3 + 2] = 0.8 + t * 0.2;   // B
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particlesMat = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.7,
    });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    // ── 底座光环（地板圆环） ──
    const ringGeo = new THREE.TorusGeometry(1.4, 0.02, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ 
      color: 0x8866ff, 
      transparent: true, 
      opacity: 0.4,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -2.2;
    ring.receiveShadow = true;
    scene.add(ring);

    // 外环
    const ring2Geo = new THREE.TorusGeometry(1.7, 0.01, 16, 64);
    const ring2Mat = new THREE.MeshBasicMaterial({ 
      color: 0xff6688, 
      transparent: true, 
      opacity: 0.25,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI / 2.2;
    ring2.position.y = -2.15;
    scene.add(ring2);

    // ── 主播卡片（3D平面+相框） ──
    const cardGroup = new THREE.Group();
    
    // 纹理加载
    const textureLoader = new THREE.TextureLoader();
    
    const loadCard = (url: string) => {
      // 移除旧卡片
      while (cardGroup.children.length > 0) {
        cardGroup.remove(cardGroup.children[0]);
      }

      // 背景卡片（发光边框效果）
      const bgGeo = new THREE.PlaneGeometry(1.6, 2.2);
      const bgMat = new THREE.MeshPhongMaterial({
        color: 0x1a1a2e,
        emissive: 0x111122,
        emissiveIntensity: 0.3,
        specular: 0x444466,
        shininess: 30,
      });
      const bgCard = new THREE.Mesh(bgGeo, bgMat);
      bgCard.position.z = -0.02;
      bgCard.castShadow = true;
      bgCard.receiveShadow = true;
      cardGroup.add(bgCard);

      // 边框线
      const edgeGeo = new THREE.EdgesGeometry(bgGeo);
      const edgeMat = new THREE.LineBasicMaterial({ color: 0x8866ff, transparent: true, opacity: 0.5 });
      const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
      edgeLine.position.z = -0.01;
      cardGroup.add(edgeLine);

      // 主播照片
      const photoGeo = new THREE.PlaneGeometry(1.4, 1.8);
      
      textureLoader.load(url, (texture) => {
        const photoMat = new THREE.MeshPhongMaterial({
          map: texture,
          specular: 0x222222,
          shininess: 5,
        });
        const photo = new THREE.Mesh(photoGeo, photoMat);
        photo.castShadow = true;
        cardGroup.add(photo);
        cardRef.current = photo;
        
        // 重新计算场景中心
        cardGroup.position.set(0, 0, 0);
      }, undefined, () => {
        // 加载失败：使用纯色占位
        const fallbackMat = new THREE.MeshPhongMaterial({
          color: 0x2a1a3e,
          emissive: 0x110022,
          emissiveIntensity: 0.4,
          specular: 0x444466,
        });
        const fallback = new THREE.Mesh(photoGeo, fallbackMat);
        cardGroup.add(fallback);
        cardRef.current = fallback;
      });
    };

    loadCard(avatarImageUrl);
    scene.add(cardGroup);

    // 存储卡片引用用于旋转
    (cardGroup as any).userData = { isCard: true };
    scene.userData = { cardGroup, ring, ring2, particles };

    // ── 渲染循环 ──
    const animate = () => {
      frameId.current = requestAnimationFrame(animate);

      const elapsed = Date.now() * 0.001;

      // 平滑旋转
      if (!isDragging.current) {
        if (autoRotate) {
          targetRotationY.current += autoRotateSpeed.current;
        }
        // 惯性衰减
        velocityY.current *= 0.95;
        targetRotationY.current += velocityY.current;
      }
      rotationY.current += (targetRotationY.current - rotationY.current) * 0.1;
      
      // 应用旋转到卡片
      cardGroup.rotation.y = rotationY.current;
      
      // 卡片轻微浮动
      cardGroup.position.y = Math.sin(elapsed * 1.2) * 0.1;

      // 粒子旋转
      particles.rotation.y += 0.0005;
      particles.rotation.x += 0.0002;
      
      // 光环脉冲
      const pulse = 1 + Math.sin(elapsed * 2) * 0.05;
      ring.scale.setScalar(pulse);
      ring.material.opacity = 0.3 + Math.sin(elapsed * 2) * 0.1;
      ring2.scale.setScalar(1 + Math.cos(elapsed * 2.5) * 0.03);
      
      renderer.render(scene, camera);
    };
    animate();

    // ── 清理 ──
    return () => {
      cancelAnimationFrame(frameId.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [width, height, autoRotate]);

  // ═══ 图片更新 ═══
  useEffect(() => {
    if (!sceneRef.current || !avatarImageUrl) return;
    const scene = sceneRef.current;
    const cardGroup = (scene as any).userData?.cardGroup;
    if (!cardGroup) return;

    // 清除旧纹理
    while (cardGroup.children.length > 0) {
      const child = cardGroup.children[0];
      if ((child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material;
        if (Array.isArray(mat)) {
          mat.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
        } else {
          if (mat.map) mat.map.dispose();
          mat.dispose();
        }
      }
      if (child.geometry) child.geometry.dispose();
      cardGroup.remove(child);
    }

    // 重建卡片
    const textureLoader = new THREE.TextureLoader();
    const bgGeo = new THREE.PlaneGeometry(1.6, 2.2);
    const bgMat = new THREE.MeshPhongMaterial({
      color: 0x1a1a2e, emissive: 0x111122, emissiveIntensity: 0.3,
      specular: 0x444466, shininess: 30,
    });
    const bgCard = new THREE.Mesh(bgGeo, bgMat);
    bgCard.position.z = -0.02;
    cardGroup.add(bgCard);

    const photoGeo = new THREE.PlaneGeometry(1.4, 1.8);
    textureLoader.load(avatarImageUrl, (texture) => {
      const photoMat = new THREE.MeshPhongMaterial({
        map: texture, specular: 0x222222, shininess: 5,
      });
      const photo = new THREE.Mesh(photoGeo, photoMat);
      cardGroup.add(photo);
      cardRef.current = photo;
    }, undefined, () => {
      const fallbackMat = new THREE.MeshPhongMaterial({
        color: 0x2a1a3e, emissive: 0x110022, emissiveIntensity: 0.4,
      });
      cardGroup.add(new THREE.Mesh(photoGeo, fallbackMat));
    });
  }, [avatarImageUrl]);

  // ═══ 鼠标/触摸交互 ═══
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      prevMouseX.current = e.clientX;
      velocityY.current = 0;
      container.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - prevMouseX.current;
      targetRotationY.current += delta * 0.01;
      velocityY.current = delta * 0.002;
      prevMouseX.current = e.clientX;
    };

    const handlePointerUp = () => {
      isDragging.current = false;
    };

    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointerleave', handlePointerUp);

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointerleave', handlePointerUp);
    };
  }, []);

  // ═══ 语音试听 ═══
  const handleVoicePreview = useCallback(async () => {
    if (voicePlaying || voiceLoading) return;
    
    setVoiceLoading(true);
    try {
      // 构建试听文本
      const sampleText = `大家好，我是${avatarName}，欢迎来到直播间，今天给大家带来超值好物，家人们点点关注不迷路！`;
      
      const res = await fetch(`${API_BASE}/api/live-stream/preview-voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          voice: voice || 'zh-CN-XiaoxiaoNeural',
          profileId,
        }),
      });
      
      const data = await res.json();
      if (data.success && data.data?.audioUrl) {
        // 播放音频
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        const audio = new Audio(data.data.audioUrl);
        audioRef.current = audio;
        setVoicePlaying(true);
        audio.onended = () => setVoicePlaying(false);
        audio.onerror = () => {
          setVoicePlaying(false);
          setVoiceLoading(false);
        };
        await audio.play();
        setVoiceLoading(false);
      } else {
        // 服务器TTS失败，使用浏览器SpeechSynthesis兜底
        fallbackBrowserTTS(sampleText);
        setVoiceLoading(false);
      }
    } catch {
      // 网络错误，使用浏览器TTS兜底
      fallbackBrowserTTS(`大家好，我是${avatarName}，欢迎来到直播间！`);
      setVoiceLoading(false);
    }
  }, [avatarName, voice, profileId, voicePlaying, voiceLoading]);

  const fallbackBrowserTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'zh-CN';
      utter.rate = 1.0;
      utter.pitch = 1.0;
      setVoicePlaying(true);
      utter.onend = () => setVoicePlaying(false);
      utter.onerror = () => setVoicePlaying(false);
      speechSynthesis.speak(utter);
    }
  };

  // ═══ 交互提示 ═══
  const [showHint, setShowHint] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* 3D 画布 */}
      <div 
        ref={containerRef} 
        style={{ 
          width, height, 
          borderRadius: 16, 
          overflow: 'hidden',
          cursor: 'grab',
          background: 'radial-gradient(ellipse at center, #1a1a3e 0%, #0a0a18 70%)',
          position: 'relative',
        }}
      />

      {/* 拖拽提示 */}
      {showHint && (
        <div style={{
          position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.6)', color: '#aa99ff', fontSize: 12,
          padding: '4px 14px', borderRadius: 20, pointerEvents: 'none',
          backdropFilter: 'blur(10px)', whiteSpace: 'nowrap',
        }}>
          🖱️ 拖拽旋转 · 360° 预览
        </div>
      )}

      {/* 底部信息栏 */}
      <div style={{
        position: 'absolute', bottom: 8, left: 8, right: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8,
      }}>
        {/* 名称标签 */}
        <div style={{
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          color: '#fff', fontSize: 13, fontWeight: 600,
          padding: '4px 12px', borderRadius: 12,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          flex: 1,
        }}>
          {avatarName}
        </div>

        {/* 语音试听按钮 */}
        <button
          onClick={handleVoicePreview}
          disabled={voiceLoading}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            border: 'none',
            background: voicePlaying 
              ? 'linear-gradient(135deg, #ff6688, #8866ff)' 
              : 'linear-gradient(135deg, #8866ff, #6644cc)',
            color: '#fff', fontSize: 16,
            cursor: voiceLoading ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s',
            boxShadow: voicePlaying ? '0 0 12px rgba(136,102,255,0.5)' : 'none',
            flexShrink: 0,
          }}
          title="试听语音"
        >
          {voiceLoading ? '⏳' : voicePlaying ? '🔊' : '🔈'}
        </button>
      </div>
    </div>
  );
}
