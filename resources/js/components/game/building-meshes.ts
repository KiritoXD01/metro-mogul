import * as THREE from 'three';
import type { RoadConnections } from './types';
import { getRoadTexture } from './road-texture';

const boxGeometryCache = new Map<string, THREE.BoxGeometry>();

function cachedBoxGeometry(
    width: number,
    height: number,
    depth: number,
): THREE.BoxGeometry {
    const key = `${width}x${height}x${depth}`;
    const existing = boxGeometryCache.get(key);
    if (existing) {
        return existing;
    }
    const geometry = new THREE.BoxGeometry(width, height, depth);
    boxGeometryCache.set(key, geometry);
    return geometry;
}

// 3D Procedural Building Factory
export const createBuildingMesh = (
    type: string,
    roadConnections?: RoadConnections,
): THREE.Group => {
    const group = new THREE.Group();

    switch (type) {
        case 'small_house': {
            const bodyGeo = cachedBoxGeometry(0.7, 0.5, 0.7);
            const bodyMat = new THREE.MeshStandardMaterial({
                color: 0xf5f5f5,
                roughness: 0.4,
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 0.25;
            body.castShadow = true;
            body.receiveShadow = true;
            group.add(body);

            const roofGeo = new THREE.ConeGeometry(0.6, 0.4, 4);
            const roofMat = new THREE.MeshStandardMaterial({
                color: 0xe74c3c,
                roughness: 0.3,
            });
            const roof = new THREE.Mesh(roofGeo, roofMat);
            roof.position.y = 0.7;
            roof.rotation.y = Math.PI / 4;
            roof.castShadow = true;
            group.add(roof);

            const doorGeo = new THREE.BoxGeometry(0.18, 0.28, 0.02);
            const doorMat = new THREE.MeshStandardMaterial({ color: 0x6e2c00 });
            const door = new THREE.Mesh(doorGeo, doorMat);
            door.position.set(0, 0.14, 0.355);
            group.add(door);
            break;
        }

        case 'villa': {
            const mainGeo = new THREE.BoxGeometry(0.8, 0.6, 0.7);
            const mainMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.2,
            });
            const main = new THREE.Mesh(mainGeo, mainMat);
            main.position.set(-0.05, 0.3, 0);
            main.castShadow = true;
            group.add(main);

            const glassGeo = new THREE.BoxGeometry(0.4, 0.45, 0.6);
            const glassMat = new THREE.MeshPhysicalMaterial({
                color: 0x3498db,
                transparent: true,
                opacity: 0.7,
                roughness: 0.1,
                metalness: 0.8,
            });
            const glassWing = new THREE.Mesh(glassGeo, glassMat);
            glassWing.position.set(0.2, 0.225, 0.1);
            group.add(glassWing);

            const poolFrameGeo = new THREE.BoxGeometry(0.35, 0.08, 0.35);
            const poolFrameMat = new THREE.MeshStandardMaterial({
                color: 0xbdc3c7,
            });
            const poolFrame = new THREE.Mesh(poolFrameGeo, poolFrameMat);
            poolFrame.position.set(-0.15, 0.64, 0.05);
            group.add(poolFrame);

            const poolWaterGeo = new THREE.BoxGeometry(0.3, 0.02, 0.3);
            const poolWaterMat = new THREE.MeshStandardMaterial({
                color: 0x1abc9c,
                roughness: 0.1,
            });
            const poolWater = new THREE.Mesh(poolWaterGeo, poolWaterMat);
            poolWater.position.set(-0.15, 0.68, 0.05);
            group.add(poolWater);
            break;
        }

        case 'apartment': {
            const towerGeo = new THREE.BoxGeometry(0.7, 1.4, 0.7);
            const towerMat = new THREE.MeshStandardMaterial({
                color: 0x34495e,
                roughness: 0.3,
            });
            const tower = new THREE.Mesh(towerGeo, towerMat);
            tower.position.y = 0.7;
            tower.castShadow = true;
            group.add(tower);

            const windowMat = new THREE.MeshStandardMaterial({
                color: 0xf1c40f,
                emissive: 0xf1c40f,
                emissiveIntensity: 0.5,
            });
            for (let floor = 0; floor < 4; floor++) {
                for (let side = -0.2; side <= 0.2; side += 0.4) {
                    const winGeo = new THREE.BoxGeometry(0.15, 0.15, 0.72);
                    const win = new THREE.Mesh(winGeo, windowMat);
                    win.position.set(side, 0.3 + floor * 0.3, 0);
                    group.add(win);
                }
            }
            break;
        }

        case 'coffee_shop': {
            const baseGeo = new THREE.BoxGeometry(0.75, 0.45, 0.75);
            const baseMat = new THREE.MeshStandardMaterial({ color: 0xd35400 });
            const base = new THREE.Mesh(baseGeo, baseMat);
            base.position.y = 0.225;
            base.castShadow = true;
            group.add(base);

            const awningGeo = new THREE.BoxGeometry(0.8, 0.1, 0.25);
            const awningMat = new THREE.MeshStandardMaterial({
                color: 0xf39c12,
            });
            const awning = new THREE.Mesh(awningGeo, awningMat);
            awning.position.set(0, 0.35, 0.4);
            group.add(awning);

            const cupGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.2, 12);
            const cupMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
            const cup = new THREE.Mesh(cupGeo, cupMat);
            cup.position.set(0, 0.58, 0);
            group.add(cup);
            break;
        }

        case 'supermarket': {
            const baseGeo = new THREE.BoxGeometry(0.85, 0.5, 0.85);
            const baseMat = new THREE.MeshStandardMaterial({ color: 0x27ae60 });
            const base = new THREE.Mesh(baseGeo, baseMat);
            base.position.y = 0.25;
            base.castShadow = true;
            group.add(base);

            const frontGeo = new THREE.BoxGeometry(0.6, 0.3, 0.05);
            const frontMat = new THREE.MeshStandardMaterial({
                color: 0xecf0f1,
                metalness: 0.5,
            });
            const front = new THREE.Mesh(frontGeo, frontMat);
            front.position.set(0, 0.15, 0.43);
            group.add(front);

            const signGeo = new THREE.BoxGeometry(0.7, 0.2, 0.05);
            const signMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f });
            const sign = new THREE.Mesh(signGeo, signMat);
            sign.position.set(0, 0.6, 0.3);
            group.add(sign);
            break;
        }

        case 'tech_office': {
            const baseGeo = new THREE.CylinderGeometry(0.38, 0.42, 1.6, 8);
            const baseMat = new THREE.MeshPhysicalMaterial({
                color: 0x1abc9c,
                metalness: 0.8,
                roughness: 0.2,
                clearcoat: 1.0,
            });
            const base = new THREE.Mesh(baseGeo, baseMat);
            base.position.y = 0.8;
            base.castShadow = true;
            group.add(base);

            const padGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.04, 16);
            const padMat = new THREE.MeshStandardMaterial({ color: 0x34495e });
            const pad = new THREE.Mesh(padGeo, padMat);
            pad.position.y = 1.62;
            group.add(pad);
            break;
        }

        case 'park': {
            const grassGeo = new THREE.BoxGeometry(0.85, 0.05, 0.85);
            const grassMat = new THREE.MeshStandardMaterial({
                color: 0x2ecc71,
            });
            const grass = new THREE.Mesh(grassGeo, grassMat);
            grass.position.y = 0.025;
            group.add(grass);

            const treePositions = [
                { x: -0.22, z: -0.22 },
                { x: 0.22, z: 0.2 },
                { x: -0.2, z: 0.22 },
            ];

            treePositions.forEach((pos) => {
                const trunkGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.2, 6);
                const trunkMat = new THREE.MeshStandardMaterial({
                    color: 0x7e5109,
                });
                const trunk = new THREE.Mesh(trunkGeo, trunkMat);
                trunk.position.set(pos.x, 0.125, pos.z);

                const foliageGeo = new THREE.DodecahedronGeometry(0.18, 1);
                const foliageMat = new THREE.MeshStandardMaterial({
                    color: 0x27ae60,
                    roughness: 0.8,
                });
                const foliage = new THREE.Mesh(foliageGeo, foliageMat);
                foliage.position.set(pos.x, 0.3, pos.z);
                foliage.castShadow = true;

                group.add(trunk);
                group.add(foliage);
            });

            const benchGeo = new THREE.BoxGeometry(0.25, 0.08, 0.1);
            const benchMat = new THREE.MeshStandardMaterial({
                color: 0xa04000,
            });
            const bench = new THREE.Mesh(benchGeo, benchMat);
            bench.position.set(0.15, 0.07, -0.15);
            group.add(bench);
            break;
        }

        case 'fountain': {
            const poolGeo = new THREE.CylinderGeometry(0.4, 0.42, 0.1, 16);
            const poolMat = new THREE.MeshStandardMaterial({ color: 0x7f8c8d });
            const pool = new THREE.Mesh(poolGeo, poolMat);
            pool.position.y = 0.05;
            group.add(pool);

            const waterGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.02, 16);
            const waterMat = new THREE.MeshStandardMaterial({
                color: 0x3498db,
                roughness: 0.1,
            });
            const water = new THREE.Mesh(waterGeo, waterMat);
            water.position.y = 0.1;
            group.add(water);

            const spoutGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.3, 8);
            const spoutMat = new THREE.MeshStandardMaterial({
                color: 0xbdc3c7,
            });
            const spout = new THREE.Mesh(spoutGeo, spoutMat);
            spout.position.y = 0.2;
            group.add(spout);
            break;
        }

        case 'road': {
            const texture = getRoadTexture(roadConnections);
            const roadGeo = new THREE.BoxGeometry(1.0, 0.03, 1.0);
            const sideMat = new THREE.MeshStandardMaterial({
                color: 0x334155,
                roughness: 0.9,
            });
            const topMat = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.85,
            });
            // BoxGeometry materials: [+X, -X, +Y (top), -Y, +Z, -Z]
            const road = new THREE.Mesh(roadGeo, [
                sideMat,
                sideMat,
                topMat,
                sideMat,
                sideMat,
                sideMat,
            ]);
            road.position.y = 0.015;
            road.receiveShadow = true;
            group.add(road);
            break;
        }

        default:
            break;
    }

    return group;
};
