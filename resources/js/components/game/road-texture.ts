import * as THREE from 'three';
import type { RoadConnections } from './types';

const roadTextureCache = new Map<string, THREE.CanvasTexture>();

export const getRoadTexture = (
    connections?: RoadConnections,
): THREE.CanvasTexture => {
    const north = connections?.north ?? false;
    const south = connections?.south ?? false;
    const west = connections?.west ?? false;
    const east = connections?.east ?? false;

    const cacheKey = `${north ? 1 : 0}${south ? 1 : 0}${west ? 1 : 0}${east ? 1 : 0}`;

    if (roadTextureCache.has(cacheKey)) {
        return roadTextureCache.get(cacheKey)!;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return new THREE.CanvasTexture(canvas);
    }

    // 1. Asphalt Road Surface
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, 256, 256);

    // Fine asphalt texture grain
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < 350; i++) {
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }

    // 2. Concrete Curbs & Sidewalk Borders on Dead Edges (where no road connection continues)
    const curbSize = 14;
    ctx.fillStyle = '#475569'; // slate-600 concrete
    if (!north) ctx.fillRect(0, 0, 256, curbSize);
    if (!south) ctx.fillRect(0, 256 - curbSize, 256, curbSize);
    if (!west) ctx.fillRect(0, 0, curbSize, 256);
    if (!east) ctx.fillRect(256 - curbSize, 0, curbSize, 256);

    // Curb edge highlight line
    ctx.strokeStyle = '#64748b'; // slate-500
    ctx.lineWidth = 2;
    if (!north) {
        ctx.beginPath();
        ctx.moveTo(0, curbSize);
        ctx.lineTo(256, curbSize);
        ctx.stroke();
    }
    if (!south) {
        ctx.beginPath();
        ctx.moveTo(0, 256 - curbSize);
        ctx.lineTo(256, 256 - curbSize);
        ctx.stroke();
    }
    if (!west) {
        ctx.beginPath();
        ctx.moveTo(curbSize, 0);
        ctx.lineTo(curbSize, 256);
        ctx.stroke();
    }
    if (!east) {
        ctx.beginPath();
        ctx.moveTo(256 - curbSize, 0);
        ctx.lineTo(256 - curbSize, 256);
        ctx.stroke();
    }

    // 3. Road Markings (Vivid Yellow Center Lines)
    const lineThickness = 14;
    ctx.strokeStyle = '#f1c40f'; // Vivid traffic yellow
    ctx.fillStyle = '#f1c40f';
    ctx.lineWidth = lineThickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const count =
        (north ? 1 : 0) + (south ? 1 : 0) + (west ? 1 : 0) + (east ? 1 : 0);

    // CASE 0: Isolated road tile (0 connections)
    if (count === 0) {
        ctx.beginPath();
        ctx.moveTo(128, 64);
        ctx.lineTo(128, 192);
        ctx.stroke();
    }
    // CASE 1: Straight road (2 opposite connections)
    else if (north && south && !west && !east) {
        // Vertical dashes along Z (North-South)
        ctx.beginPath();
        ctx.moveTo(128, 18);
        ctx.lineTo(128, 96);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(128, 160);
        ctx.lineTo(128, 238);
        ctx.stroke();
    } else if (west && east && !north && !south) {
        // Horizontal dashes along X (West-East)
        ctx.beginPath();
        ctx.moveTo(18, 128);
        ctx.lineTo(96, 128);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(160, 128);
        ctx.lineTo(238, 128);
        ctx.stroke();
    }
    // CASE 2: Dead End (1 connection)
    else if (count === 1) {
        ctx.beginPath();
        ctx.moveTo(128, 128);
        if (north) ctx.lineTo(128, 0);
        if (south) ctx.lineTo(128, 256);
        if (west) ctx.lineTo(0, 128);
        if (east) ctx.lineTo(256, 128);
        ctx.stroke();

        // Round center cap
        ctx.beginPath();
        ctx.arc(128, 128, lineThickness / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    // CASE 3: 90-degree Corners (2 adjacent connections)
    else if (count === 2) {
        if (north && east) {
            // Arc turning from North to East (center at 256, 0)
            ctx.beginPath();
            ctx.arc(256, 0, 128, Math.PI, Math.PI / 2, true);
            ctx.stroke();
        } else if (north && west) {
            // Arc turning from North to West (center at 0, 0)
            ctx.beginPath();
            ctx.arc(0, 0, 128, 0, Math.PI / 2, false);
            ctx.stroke();
        } else if (south && east) {
            // Arc turning from South to East (center at 256, 256)
            ctx.beginPath();
            ctx.arc(256, 256, 128, Math.PI, (3 * Math.PI) / 2, false);
            ctx.stroke();
        } else if (south && west) {
            // Arc turning from South to West (center at 0, 256)
            ctx.beginPath();
            ctx.arc(0, 256, 128, 0, (3 * Math.PI) / 2, true);
            ctx.stroke();
        }
    }
    // CASE 4: T-Intersections (3 connections)
    else if (count === 3) {
        if (!west) {
            // N + S + E (West closed)
            ctx.beginPath();
            ctx.moveTo(128, 0);
            ctx.lineTo(128, 256);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(128, 128);
            ctx.lineTo(256, 128);
            ctx.stroke();
        } else if (!east) {
            // N + S + W (East closed)
            ctx.beginPath();
            ctx.moveTo(128, 0);
            ctx.lineTo(128, 256);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(128, 128);
            ctx.lineTo(0, 128);
            ctx.stroke();
        } else if (!south) {
            // W + E + N (South closed)
            ctx.beginPath();
            ctx.moveTo(0, 128);
            ctx.lineTo(256, 128);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(128, 128);
            ctx.lineTo(128, 0);
            ctx.stroke();
        } else if (!north) {
            // W + E + S (North closed)
            ctx.beginPath();
            ctx.moveTo(0, 128);
            ctx.lineTo(256, 128);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(128, 128);
            ctx.lineTo(128, 256);
            ctx.stroke();
        }

        // Center junction circle
        ctx.beginPath();
        ctx.arc(128, 128, lineThickness / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    // CASE 5: 4-Way Crossroads (4 connections)
    else if (count === 4) {
        ctx.beginPath();
        ctx.moveTo(128, 0);
        ctx.lineTo(128, 256);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, 128);
        ctx.lineTo(256, 128);
        ctx.stroke();

        // Center hub circle
        ctx.beginPath();
        ctx.arc(128, 128, lineThickness / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    roadTextureCache.set(cacheKey, texture);
    return texture;
};
