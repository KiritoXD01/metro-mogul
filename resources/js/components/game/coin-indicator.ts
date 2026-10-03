import * as THREE from 'three';

// 3D Dollar Symbol Mesh Generator (recollect indicator)
export const createDollarCoinMesh = (baseHeight: number): THREE.Group => {
    const group = new THREE.Group();
    group.position.set(0, baseHeight + 0.35, 0);
    group.userData = { isDollarIndicator: true, baseY: baseHeight + 0.35 };

    // Canvas texture with dollar sign
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.7, '#eab308');
        grad.addColorStop(1, '#ca8a04');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(64, 64, 58, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(64, 64, 46, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 64, 68);
    }

    const texture = new THREE.CanvasTexture(canvas);

    // Coin Mesh
    const coinGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.06, 24);
    coinGeo.rotateX(Math.PI / 2);
    const sideMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.8,
        roughness: 0.2,
    });
    const faceMat = new THREE.MeshStandardMaterial({
        map: texture,
        metalness: 0.4,
        roughness: 0.3,
    });
    const coinMesh = new THREE.Mesh(coinGeo, [sideMat, faceMat, faceMat]);
    group.add(coinMesh);

    // Glowing Emerald Aura Ring
    const ringGeo = new THREE.TorusGeometry(0.36, 0.025, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        emissive: 0x22c55e,
        emissiveIntensity: 0.8,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.userData = { isGlowRing: true };
    group.add(ring);

    return group;
};
