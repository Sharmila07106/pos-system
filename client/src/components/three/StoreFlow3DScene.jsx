import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, RoundedBox } from '@react-three/drei';

const LaserBeam = () => {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 3) * 0.8;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0.4]}>
      <boxGeometry args={[2.4, 0.03, 0.05]} />
      <meshBasicMaterial color="#0FA38F" transparent opacity={0.85} />
    </mesh>
  );
};

const StylizedScanner = () => {
  return (
    <group position={[0, -0.2, 0]}>
      {/* Base POS terminal stand */}
      <RoundedBox args={[2.2, 1.4, 0.3]} radius={0.08} smoothness={4} position={[0, -0.6, -0.2]} rotation={[-0.4, 0, 0]}>
        <meshStandardMaterial color="#0B1B3A" metalness={0.7} roughness={0.25} />
      </RoundedBox>

      {/* Screen */}
      <mesh position={[0, -0.58, -0.04]} rotation={[-0.4, 0, 0]}>
        <planeGeometry args={[1.9, 1.1]} />
        <meshBasicMaterial color="#12274F" />
      </mesh>

      {/* Floating glossy barcode box */}
      <Float speed={2.5} rotationIntensity={0.8} floatIntensity={1.2}>
        <RoundedBox args={[1.2, 1.2, 1.2]} radius={0.12} smoothness={4} position={[1.4, 0.8, 0.2]} rotation={[0.4, 0.6, 0.2]}>
          <meshStandardMaterial color="#0FA38F" metalness={0.4} roughness={0.2} />
        </RoundedBox>
      </Float>

      {/* Second product box */}
      <Float speed={2} rotationIntensity={1.2} floatIntensity={1.5}>
        <RoundedBox args={[0.9, 0.9, 0.9]} radius={0.08} smoothness={4} position={[-1.5, 0.6, -0.4]} rotation={[-0.3, 0.5, 0.4]}>
          <meshStandardMaterial color="#FF8A1F" metalness={0.3} roughness={0.3} />
        </RoundedBox>
      </Float>

      {/* Sweeping laser beam */}
      <LaserBeam />
    </group>
  );
};

export const StoreFlow3DScene = () => {
  return (
    <div className="w-full h-full relative pointer-events-none">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[10, 15, 10]} intensity={2.5} color="#FFFFFF" />
        <pointLight position={[-10, -5, -10]} intensity={1.5} color="#0FA38F" />
        <pointLight position={[5, -5, 5]} intensity={1.2} color="#FF8A1F" />

        <StylizedScanner />
      </Canvas>
    </div>
  );
};

export default StoreFlow3DScene;
