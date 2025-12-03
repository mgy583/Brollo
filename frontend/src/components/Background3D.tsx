import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial, Float } from '@react-three/drei'
import * as random from 'maath/random/dist/maath-random.cjs'

function Stars(props: any) {
  const ref = useRef<any>()
  const sphere = useMemo(() => random.inSphere(new Float32Array(5000), { radius: 1.5 }), [])

  useFrame((_state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10
      ref.current.rotation.y -= delta / 15
    }
  })

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#1890ff"
          size={0.002}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  )
}

function FloatingShape() {
    const mesh = useRef<any>()
    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        if(mesh.current) {
            mesh.current.rotation.x = Math.cos(t / 4) / 2
            mesh.current.rotation.y = Math.sin(t / 4) / 2
            mesh.current.position.y = (1 + Math.sin(t / 1.5)) / 10
        }
    })

    return (
        <mesh ref={mesh} position={[0, 0, 0]} scale={1.5}>
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color="#ffffff" wireframe transparent opacity={0.1} />
        </mesh>
    )
}

export default function Background3D() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, background: '#000' }}>
      <Canvas camera={{ position: [0, 0, 1] }}>
        <ambientLight intensity={0.5} />
        <Stars />
        <Float speed={4} rotationIntensity={1} floatIntensity={2}>
            <FloatingShape />
        </Float>
      </Canvas>
    </div>
  )
}
