import * as THREE from 'three';
import type { RoadConnections } from './types';
import { createBuildingMesh } from './building-meshes';

// 3D Construction Site Mesh Generator
export const createConstructionMesh = (
    type: string,
    progress: number,
    roadConnections?: RoadConnections,
): THREE.Group => {
    const group = new THREE.Group();
    group.userData = { isUnderConstruction: true };

    // Gravel Foundation
    const baseGeo = new THREE.BoxGeometry(0.92, 0.04, 0.92);
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.9,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.02;
    group.add(base);

    // 4 Corner Scaffolding Posts
    const postGeo = new THREE.BoxGeometry(0.05, 0.85, 0.05);
    const postMat = new THREE.MeshStandardMaterial({
        color: 0x8b5a2b,
        roughness: 0.8,
    });
    const corners = [
        [-0.42, -0.42],
        [0.42, -0.42],
        [-0.42, 0.42],
        [0.42, 0.42],
    ];
    corners.forEach(([cx, cz]) => {
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(cx, 0.425, cz);
        group.add(post);
    });

    // Horizontal Rails
    const railXGeo = new THREE.BoxGeometry(0.85, 0.03, 0.03);
    const railZGeo = new THREE.BoxGeometry(0.03, 0.03, 0.85);
    const rail1 = new THREE.Mesh(railXGeo, postMat);
    rail1.position.set(0, 0.4, -0.42);
    const rail2 = new THREE.Mesh(railXGeo, postMat);
    rail2.position.set(0, 0.4, 0.42);
    const rail3 = new THREE.Mesh(railZGeo, postMat);
    rail3.position.set(-0.42, 0.4, 0);
    const rail4 = new THREE.Mesh(railZGeo, postMat);
    rail4.position.set(0.42, 0.4, 0);
    group.add(rail1, rail2, rail3, rail4);

    // Emerging Scaled Building Mesh
    const building = createBuildingMesh(type, roadConnections);
    const clampedProgress = Math.max(0.1, Math.min(1.0, progress));
    building.scale.set(0.88, clampedProgress * 0.88, 0.88);
    building.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
            const mat = child.material as THREE.MeshStandardMaterial;
            mat.transparent = true;
            mat.opacity = 0.85;
        }
    });
    group.add(building);

    // Yellow Construction Tower Crane
    const craneMastGeo = new THREE.BoxGeometry(0.07, 1.25, 0.07);
    const craneMat = new THREE.MeshStandardMaterial({
        color: 0xf39c12,
        roughness: 0.4,
    });
    const craneMast = new THREE.Mesh(craneMastGeo, craneMat);
    craneMast.position.set(0.38, 0.625, 0.38);
    group.add(craneMast);

    // Flashing Beacon on Crane Mast
    const beaconGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.06, 8);
    const beaconMat = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0xff7700,
        emissiveIntensity: 0.8,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0.38, 1.28, 0.38);
    beacon.userData = { isBeacon: true };
    group.add(beacon);

    // Rotating Crane Jib Arm Group
    const armGroup = new THREE.Group();
    armGroup.position.set(0.38, 1.24, 0.38);
    armGroup.userData = { isCraneArm: true };

    const jibGeo = new THREE.BoxGeometry(0.7, 0.05, 0.05);
    const jib = new THREE.Mesh(jibGeo, craneMat);
    jib.position.set(-0.25, 0, 0);
    armGroup.add(jib);

    const counterGeo = new THREE.BoxGeometry(0.12, 0.08, 0.08);
    const counterMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const counter = new THREE.Mesh(counterGeo, counterMat);
    counter.position.set(0.15, 0, 0);
    armGroup.add(counter);

    // Cable & Hook
    const cableGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.4, 6);
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const cable = new THREE.Mesh(cableGeo, cableMat);
    cable.position.set(-0.4, -0.2, 0);
    armGroup.add(cable);

    const hookGeo = new THREE.BoxGeometry(0.08, 0.06, 0.08);
    const hook = new THREE.Mesh(hookGeo, craneMat);
    hook.position.set(-0.4, -0.4, 0);
    armGroup.add(hook);

    group.add(armGroup);

    // Mini 3D Progress Bar above Construction Site
    const progressBgGeo = new THREE.BoxGeometry(0.6, 0.08, 0.03);
    const progressBgMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.9,
    });
    const progressBg = new THREE.Mesh(progressBgGeo, progressBgMat);
    progressBg.position.set(0, 1.45, 0);

    const progressFillGeo = new THREE.BoxGeometry(
        Math.max(0.02, 0.56 * clampedProgress),
        0.05,
        0.035,
    );
    const progressFillMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.5,
    });
    const progressFill = new THREE.Mesh(progressFillGeo, progressFillMat);
    progressFill.position.set(
        -0.28 + (0.56 * clampedProgress) / 2,
        1.45,
        0.005,
    );
    group.add(progressBg);
    group.add(progressFill);

    return group;
};
