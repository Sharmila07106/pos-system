import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, RoundedBox } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

export const LoginScene = () => {
  return (
    <div className="w-full h-full absolute inset-0 -z-10 opacity-70 pointer-events-none hidden md:block">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        <directionalLight position={[-10, -10, -5]} color="#8b5cf6" intensity={2} />
        
        <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
          <RoundedBox args={[1.5, 2.5, 0.2]} radius={0.1} position={[-2, 0, -1]} rotation={[0.2, 0.5, 0]}>
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
          </RoundedBox>
        </Float>
        
        <Float speed={1.5} rotationIntensity={2} floatIntensity={1.5}>
          <mesh position={[1.5, 1, 0]}>
            <sphereGeometry args={[0.5, 32, 32]} />
            <MeshDistortMaterial color="#00e5ff" attach="material" distort={0.5} speed={2} roughness={0.1} metalness={0.8} />
          </mesh>
        </Float>

        <Float speed={3} rotationIntensity={1} floatIntensity={3}>
          <mesh position={[0, -1.5, 1]}>
            <torusGeometry args={[0.4, 0.15, 16, 32]} />
            <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.5} roughness={0.2} metalness={0.9} />
          </mesh>
        </Float>

        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};
