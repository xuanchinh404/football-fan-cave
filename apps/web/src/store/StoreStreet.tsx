import { product, stalls, stallZ } from '../../../../packages/shared/store/catalog';
import { practiceTarget } from '../../../../packages/shared/store/physics';
import { AssetModel } from '../game/three/AssetModel';
import { Label } from '../game/three/Models';
import { Block, Ring, StoreModel } from './StoreModel';

const displays = [
  ['P001', 'P003', 'P004'],
  ['P035', 'P046', 'P042'],
  ['P065', 'P069', 'P058'],
  ['P073', 'P086', 'P076'],
];

export function StoreStreet() {
  return (
    <>
      <group name="shop-street">
        <Block at={[0, 0.012, 31.2]} size={[38, 0.035, 5.6]} color="#5b3f68" />
        {[-19, 19].map((x) => (
          <group key={x} position={[x, 0, 29]}>
            <Block at={[0, 1.7, 0]} size={[0.42, 3.4, 0.42]} color="#6a3837" />
            <Block at={[0, 3.65, 0]} size={[0.65, 0.52, 0.65]} color="#ffd47a" />
          </group>
        ))}
        <group position={[0, 0, stallZ - 0.7]} rotation={[0, Math.PI, 0]}>
          <Label text="✦  PHỐ CỬA HÀNG  ✦" position={[0, 6.2, 0]} width={12} background="#573369" />
          <Label text="SHOP STREET" position={[0, 5.29, 0.02]} width={5} background="#573369" />
        </group>
        {stalls.map((stall, index) => (
          <group
            key={stall.id}
            name={stall.id}
            position={[stall.x, 0, stallZ]}
            rotation={[0, Math.PI, 0]}
          >
            <AssetModel asset="market-stall" tint={stall.color} solid={false} />
            <Block at={[0, 0.62, 1.48]} size={[5.68, 1.24, 0.68]} color="#59364a" />
            <Block at={[0, 1.28, 1.48]} size={[5.73, 0.13, 0.75]} color="#bc7b55" />
            {Array.from({ length: 9 }, (_, i) => (
              <Block
                key={i}
                at={[(i - 4) * 0.62, 2.98, 1.87]}
                size={[0.62, 0.25, 0.12]}
                color={i % 2 ? '#ffebc9' : stall.color}
              />
            ))}
            <Label
              text={stall.name[0]}
              position={[0, 4.22, 2.15]}
              width={5.85}
              background={stall.color}
            />
            <AssetModel
              asset="fan-chibi"
              position={[0, 0, -0.45]}
              scale={0.84}
              animation="Idle"
              solid={false}
            />
            {displays[index].map((id, i) => (
              <group key={id} position={[(i - 1) * 1.73, 1.72, 1.52]}>
                <StoreModel item={product(id)!} size={i === 1 ? 0.65 : 0.78} />
              </group>
            ))}
          </group>
        ))}
      </group>
      <group position={[practiceTarget.x, practiceTarget.y, practiceTarget.z]}>
        <Block at={[0, -0.48, -0.12]} size={[0.18, 1.8, 0.23]} color="#9d613d" />
        <Block size={[2.05, 1.95, 0.13]} color="#573358" />
        {[0.85, 0.57, 0.28].map((radius, i) => (
          <Ring
            key={radius}
            at={[0, 0, 0.1]}
            radius={radius}
            color={i === 1 ? '#fff1bd' : '#f65c65'}
          />
        ))}
        <Label
          text="BIA TẬP · PRACTICE"
          position={[0, 1.35, 0.14]}
          width={3.7}
          background="#573358"
        />
      </group>
    </>
  );
}
