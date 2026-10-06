import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { toast } from 'sonner';
import { echo } from '@laravel/echo-react';
import { BUILDING_TYPES, GRID_SIZE, getBuildingHeight } from './buildings';
import type {
    BuildingDefinition,
    FloatingText,
    GridData,
    GridItem,
    MetroCityGameProps,
    SaveStatus,
} from './types';
import { playSound } from './audio';
import { createBuildingMesh } from './building-meshes';
import { createConstructionMesh } from './construction-mesh';
import { createDollarCoinMesh } from './coin-indicator';
import FloatingTexts from './hud/floating-texts';
import TopHud from './hud/top-hud';
import ShopToolbar from './hud/shop-toolbar';
import type { ShopCategory } from './hud/shop-toolbar';
import InspectionModal from './hud/inspection-modal';
import NewCityModal from './hud/new-city-modal';
import ProfileSettingsModal from './hud/profile-settings-modal';
import { useTranslation } from '@/hooks/use-translation';

// Backwards-compatible re-exports for existing importers.
// (Definitions now live in sibling modules.)
export { BUILDING_TYPES, GRID_SIZE, formatDuration } from './buildings';
export { createBuildingMesh } from './building-meshes';
export { getRoadTexture } from './road-texture';
export type {
    BuildingDefinition,
    CityModelData,
    CitySaveData,
    FloatingText,
    GameSettingsProps,
    GridData,
    GridItem,
    MetroCityGameProps,
    RoadConnections,
    SaveStatus,
} from './types';

export default function MetroCityGame({
    initialCity,
    userName = 'Mayor',
    userId,
    onSave,
    onResetCity,
    settings,
}: MetroCityGameProps) {
    const { t } = useTranslation();

    const buildingName = (type: string): string =>
        t(`building.${type}.name`, BUILDING_TYPES[type]?.name ?? type);

    // Game Economy State
    const [cityName, setCityName] = useState(initialCity.name || 'Metropolis');
    const [money, setMoney] = useState(initialCity.money ?? 2500);
    const [population, setPopulation] = useState(initialCity.population ?? 0);
    const [xp, setXp] = useState(initialCity.xp ?? 0);
    const [level, setLevel] = useState(initialCity.level ?? 1);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Construction State
    const [selectedTool, setSelectedTool] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ShopCategory>('residential');
    const [gridData, setGridData] = useState<GridData>(() => {
        // Ensure initial data backwards-compatibility
        const initial = initialCity.gridData || {};
        const parsed: GridData = {};
        Object.keys(initial).forEach((k) => {
            const item = initial[k];
            parsed[k] = {
                ...item,
                isConstructed: item.isConstructed ?? true,
                buildStartedAt: item.buildStartedAt ?? item.createdAt ?? 0,
                buildCompletedAt: item.buildCompletedAt ?? item.createdAt ?? 0,
            };
        });
        return parsed;
    });

    const [hoverTile, setHoverTile] = useState<{ x: number; z: number } | null>(
        null,
    );
    const [selectedBuilding, setSelectedBuilding] = useState<
        (GridItem & { key: string }) | null
    >(null);
    const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
    const [nowTick, setNowTick] = useState(() => Date.now());

    // Re-render every second while the inspection modal is open so
    // construction / harvest countdowns tick without tab switches.
    useEffect(() => {
        if (!selectedBuilding || selectedTool) return;
        const interval = setInterval(() => setNowTick(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [selectedBuilding, selectedTool]);

    // Keep the open inspection modal in sync when gridData changes
    // (e.g. construction completes via websocket), so it flips to
    // "ready" without closing/reopening.
    useEffect(() => {
        if (!selectedBuilding) return;
        const latest = gridData[selectedBuilding.key];
        if (
            latest &&
            (latest.isConstructed !== selectedBuilding.isConstructed ||
                latest.harvestReadyAt !== selectedBuilding.harvestReadyAt ||
                latest.buildCompletedAt !== selectedBuilding.buildCompletedAt)
        ) {
            setSelectedBuilding({ ...latest, key: selectedBuilding.key });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gridData]);

    // Modals & Save states
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [newCityNameInput, setNewCityNameInput] = useState('');
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const lastSavedRef = useRef<string>('');
    const prevGridRef = useRef<GridData | null>(null);

    // Canvas Refs
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const objectsGroupRef = useRef<THREE.Group | null>(null);
    const previewMeshRef = useRef<THREE.Group | null>(null);

    // Interaction State Ref to bypass state updates inside RAF loop
    const stateRef = useRef({
        gridData,
        selectedTool,
        hoverTile,
        soundEnabled,
    });

    useEffect(() => {
        stateRef.current = { gridData, selectedTool, hoverTile, soundEnabled };
    }, [gridData, selectedTool, hoverTile, soundEnabled]);

    // WebSocket / Reverb Echo listener for queued BuildingCompletedEvent
    useEffect(() => {
        if (!userId) return;
        try {
            const channel = echo().private(`App.Models.User.${userId}`);
            channel.listen(
                '.building.completed',
                (data: {
                    buildingType: string;
                    buildingName: string;
                    tileKey: string;
                }) => {
                    toast.success(
                        t('game.project_finished', {
                            name: data.buildingName,
                        }),
                        {
                            icon: '🏗️',
                            description: t('game.tile_opened', {
                                tile: data.tileKey,
                            }),
                        },
                    );
                    playSound('levelup', soundEnabled);

                    setGridData((prev) => {
                        const target = prev[data.tileKey];
                        if (target && !target.isConstructed) {
                            const bDef = BUILDING_TYPES[target.type];
                            return {
                                ...prev,
                                [data.tileKey]: {
                                    ...target,
                                    isConstructed: true,
                                    harvestReadyAt:
                                        bDef && bDef.timer > 0
                                            ? Date.now() + bDef.timer * 1000
                                            : 0,
                                },
                            };
                        }
                        return prev;
                    });
                },
            );

            return () => {
                channel.stopListening('.building.completed');
            };
        } catch {
            // Echo fallback if Reverb websocket connection is inactive
        }
    }, [userId, soundEnabled]);

    // Auto-save triggers
    const triggerSave = async () => {
        if (!onSave) return;
        const currentStateStr = JSON.stringify({
            cityName,
            money,
            population,
            xp,
            level,
            gridData,
        });
        if (currentStateStr === lastSavedRef.current) return;

        try {
            setSaveStatus('saving');
            await onSave({
                name: cityName,
                money,
                population,
                xp,
                level,
                grid_data: gridData,
            });
            lastSavedRef.current = currentStateStr;
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2500);
        } catch {
            setSaveStatus('error');
        }
    };

    // Periodic auto-save every 15 seconds if dirty
    useEffect(() => {
        const timer = setInterval(() => {
            void triggerSave();
        }, 15000);
        return () => clearInterval(timer);
    });

    // Autosave when a building finishes construction. Covers both the local
    // countdown loop and the websocket listener, since both commit via
    // setGridData. Runs after state commits so triggerSave sees fresh
    // money/population/grid values. Silent — reuses the existing
    // saving/saved HUD indicator via triggerSave.
    useEffect(() => {
        const prev = prevGridRef.current;
        prevGridRef.current = gridData;
        if (!prev) return;
        const hasCompletedBuilding = Object.keys(gridData).some((key) => {
            const was = prev[key];
            const nowItem = gridData[key];
            if (!was || !nowItem) return false;
            return (
                (was.isConstructed ?? true) === false &&
                (nowItem.isConstructed ?? true) === true
            );
        });
        if (hasCompletedBuilding) {
            void triggerSave();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gridData]);

    // Three.js Mount Setup
    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        const width = currentMount.clientWidth;
        const height = currentMount.clientHeight;

        // 1. Scene Setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb);
        scene.fog = new THREE.FogExp2(0x87ceeb, 0.015);
        sceneRef.current = scene;

        // 2. Isometric Orthographic Camera
        const aspect = width / height;
        const d = 10;
        const camera = new THREE.OrthographicCamera(
            -d * aspect,
            d * aspect,
            d,
            -d,
            1,
            1000,
        );
        camera.position.set(20, 20, 20);
        camera.lookAt(GRID_SIZE / 2, 0, GRID_SIZE / 2);
        cameraRef.current = camera;

        // 3. Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        currentMount.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // 4. Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xfffaed, 0.85);
        dirLight.position.set(25, 40, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 100;
        const shadowD = 15;
        dirLight.shadow.camera.left = -shadowD;
        dirLight.shadow.camera.right = shadowD;
        dirLight.shadow.camera.top = shadowD;
        dirLight.shadow.camera.bottom = -shadowD;
        scene.add(dirLight);

        // 5. Ground Grid Base
        const gridGroup = new THREE.Group();
        for (let x = 0; x < GRID_SIZE; x++) {
            for (let z = 0; z < GRID_SIZE; z++) {
                const tileGeo = new THREE.BoxGeometry(0.96, 0.1, 0.96);
                const isAlternate = (x + z) % 2 === 0;
                const tileMat = new THREE.MeshStandardMaterial({
                    color: isAlternate ? 0x82c91e : 0x74b816,
                    roughness: 0.8,
                });
                const tileMesh = new THREE.Mesh(tileGeo, tileMat);
                tileMesh.position.set(x + 0.5, -0.05, z + 0.5);
                tileMesh.receiveShadow = true;
                tileMesh.userData = { gridX: x, gridZ: z, isTile: true };
                gridGroup.add(tileMesh);
            }
        }
        scene.add(gridGroup);

        // Group for constructed buildings & decorations
        const objectsGroup = new THREE.Group();
        scene.add(objectsGroup);
        objectsGroupRef.current = objectsGroup;

        // Ambient Floating Clouds
        const cloudsGroup = new THREE.Group();
        const cloudMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.85,
        });
        for (let i = 0; i < 6; i++) {
            const cloud = new THREE.Group();
            const pCount = 3 + Math.floor(Math.random() * 3);
            for (let j = 0; j < pCount; j++) {
                const pGeo = new THREE.DodecahedronGeometry(
                    0.8 + Math.random() * 0.5,
                );
                const pMesh = new THREE.Mesh(pGeo, cloudMat);
                pMesh.position.set(
                    j * 0.6,
                    Math.random() * 0.2,
                    Math.random() * 0.4,
                );
                cloud.add(pMesh);
            }
            cloud.position.set(
                Math.random() * 20 - 5,
                8 + Math.random() * 3,
                Math.random() * 20 - 5,
            );
            cloudsGroup.add(cloud);
        }
        scene.add(cloudsGroup);

        // Raycasting & Mouse Interaction Setup
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const handleMouseMove = (event: MouseEvent) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(gridGroup.children);

            if (intersects.length > 0) {
                const hitTile = intersects[0].object as THREE.Mesh;
                if (hitTile.userData && hitTile.userData.isTile) {
                    setHoverTile({
                        x: hitTile.userData.gridX,
                        z: hitTile.userData.gridZ,
                    });
                }
            } else {
                setHoverTile(null);
            }
        };

        const handleResize = () => {
            if (!currentMount) return;
            const w = currentMount.clientWidth;
            const h = currentMount.clientHeight;
            const newAspect = w / h;
            camera.left = -d * newAspect;
            camera.right = d * newAspect;
            camera.top = d;
            camera.bottom = -d;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };

        window.addEventListener('resize', handleResize);
        const domEl = renderer.domElement;
        domEl.addEventListener('mousemove', handleMouseMove);

        // Animation Loop with Crane & Dollar Symbol Animations
        let animationFrameId: number;
        const timer = new THREE.Timer();

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            timer.update();
            const delta = timer.getDelta();
            const elapsed = timer.getElapsed();

            // 1. Cloud movement
            cloudsGroup.children.forEach((cloud) => {
                cloud.position.x += delta * 0.3;
                if (cloud.position.x > GRID_SIZE + 10) {
                    cloud.position.x = -10;
                }
            });

            // 2. Animated objects in scene (Cranes, Beacons, Dollar symbols)
            if (objectsGroupRef.current) {
                objectsGroupRef.current.traverse((child) => {
                    // Construction Crane arm swing
                    if (child.userData && child.userData.isCraneArm) {
                        child.rotation.y = Math.sin(elapsed * 2) * 0.7;
                    }

                    // Construction Hazard Beacon pulsing
                    if (child.userData && child.userData.isBeacon) {
                        const mat = (child as THREE.Mesh)
                            .material as THREE.MeshStandardMaterial;
                        if (mat) {
                            mat.emissiveIntensity =
                                0.4 + Math.abs(Math.sin(elapsed * 6)) * 0.8;
                        }
                    }

                    // Dollar Coin Recollect Animation: Face Camera + Bobbing & Floating Wobble
                    if (child.userData && child.userData.isDollarIndicator) {
                        const baseY = child.userData.baseY || 1.2;
                        child.position.y =
                            baseY + Math.sin(elapsed * 4.0) * 0.12;
                        child.quaternion.copy(camera.quaternion);
                        child.rotateZ(Math.sin(elapsed * 2.5) * 0.14);
                    }

                    // Glowing Aura Ring Pulse
                    if (child.userData && child.userData.isGlowRing) {
                        const scale = 1 + Math.sin(elapsed * 5) * 0.12;
                        child.scale.set(scale, scale, scale);
                    }
                });
            }

            // Render loop
            renderer.render(scene, camera);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            timer.dispose();
            window.removeEventListener('resize', handleResize);
            if (domEl) domEl.removeEventListener('mousemove', handleMouseMove);
            renderer.dispose();
            if (
                renderer.domElement &&
                currentMount.contains(renderer.domElement)
            ) {
                currentMount.removeChild(renderer.domElement);
            }
        };
    }, []);

    // Update Scene Objects when gridData changes
    useEffect(() => {
        if (!objectsGroupRef.current) return;
        const group = objectsGroupRef.current;

        // Clear previous models cleanly
        while (group.children.length > 0) {
            const child = group.children[0];
            group.remove(child);
            child.traverse((node) => {
                if (node instanceof THREE.Mesh) {
                    if (node.geometry) node.geometry.dispose();
                    if (Array.isArray(node.material)) {
                        node.material.forEach((m) => m.dispose());
                    } else if (node.material) {
                        node.material.dispose();
                    }
                }
            });
        }

        // Rebuild models from grid state
        const now = Date.now();
        Object.keys(gridData).forEach((key) => {
            const item = gridData[key];
            if (!item) return;
            const [x, z] = key.split(',').map(Number);

            let meshGroup: THREE.Group;
            const isConstructed = item.isConstructed ?? true;

            const north = gridData[`${x},${z - 1}`]?.type === 'road';
            const south = gridData[`${x},${z + 1}`]?.type === 'road';
            const west = gridData[`${x - 1},${z}`]?.type === 'road';
            const east = gridData[`${x + 1},${z}`]?.type === 'road';
            const roadConnections = { north, south, west, east };

            if (!isConstructed) {
                // Construction site animation mesh
                const start = item.buildStartedAt || item.createdAt;
                const end = item.buildCompletedAt || start;
                const total = Math.max(1, end - start);
                const currentElapsed = Math.max(0, now - start);
                const progress = Math.min(1.0, currentElapsed / total);
                meshGroup = createConstructionMesh(
                    item.type,
                    progress,
                    roadConnections,
                );
            } else {
                // Finished building
                meshGroup = createBuildingMesh(item.type, roadConnections);

                // Add 3D Floating Dollar Symbol if money is ready to recollect
                if (item.isReady) {
                    const bHeight = getBuildingHeight(item.type);
                    const dollarIndicator = createDollarCoinMesh(bHeight);
                    meshGroup.add(dollarIndicator);
                }
            }

            meshGroup.position.set(x + 0.5, 0, z + 0.5);
            meshGroup.userData = {
                key,
                x,
                z,
                type: item.type,
                isConstructed,
            };
            group.add(meshGroup);
        });
    }, [gridData]);

    // Update Placement Preview Hover Mesh
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        if (previewMeshRef.current) {
            scene.remove(previewMeshRef.current);
            previewMeshRef.current = null;
        }

        if (hoverTile && selectedTool && selectedTool !== 'bulldozer') {
            const bType = BUILDING_TYPES[selectedTool];
            if (bType) {
                let preview: THREE.Group;
                if (selectedTool === 'road') {
                    const north =
                        gridData[`${hoverTile.x},${hoverTile.z - 1}`]?.type ===
                        'road';
                    const south =
                        gridData[`${hoverTile.x},${hoverTile.z + 1}`]?.type ===
                        'road';
                    const west =
                        gridData[`${hoverTile.x - 1},${hoverTile.z}`]?.type ===
                        'road';
                    const east =
                        gridData[`${hoverTile.x + 1},${hoverTile.z}`]?.type ===
                        'road';
                    preview = createBuildingMesh(selectedTool, {
                        north,
                        south,
                        west,
                        east,
                    });
                } else {
                    preview = createBuildingMesh(selectedTool);
                }
                preview.position.set(hoverTile.x + 0.5, 0, hoverTile.z + 0.5);

                const key = `${hoverTile.x},${hoverTile.z}`;
                const isOccupied = !!gridData[key];
                const canAfford = money >= bType.cost;
                const isUnlocked = level >= bType.unlockLevel;
                const isValid = !isOccupied && canAfford && isUnlocked;

                const color = isValid ? 0x2ecc71 : 0xe74c3c;
                preview.traverse((child) => {
                    if (child instanceof THREE.Mesh && child.material) {
                        const mat = Array.isArray(child.material)
                            ? child.material[0]
                            : child.material;
                        const cloneMat =
                            mat.clone() as THREE.MeshStandardMaterial;
                        cloneMat.transparent = true;
                        cloneMat.opacity = 0.5;
                        cloneMat.color = new THREE.Color(color);
                        child.material = cloneMat;
                    }
                });

                scene.add(preview);
                previewMeshRef.current = preview;
            }
        }
    }, [hoverTile, selectedTool, gridData, money, level]);

    // Construction Countdown & Rent Harvest Loop
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            let updated = false;
            const newGrid: GridData = { ...gridData };

            Object.keys(newGrid).forEach((key) => {
                const item = newGrid[key];
                const bDef = BUILDING_TYPES[item.type];
                if (!bDef) return;

                const isConstructed = item.isConstructed ?? true;

                // 1. Check Construction Finish
                if (!isConstructed) {
                    const completedAt = item.buildCompletedAt || 0;
                    if (now >= completedAt) {
                        newGrid[key] = {
                            ...item,
                            isConstructed: true,
                            harvestReadyAt:
                                bDef.timer > 0 ? now + bDef.timer * 1000 : 0,
                        };
                        updated = true;

                        // Citizen capacity moves in!
                        if (bDef.population > 0) {
                            setPopulation((prev) => prev + bDef.population);
                        }

                        playSound('levelup', soundEnabled);
                        toast.success(
                            t('game.construction_complete', {
                                name: buildingName(bDef.id),
                            }),
                            {
                                icon: '🏗️',
                            },
                        );
                        spawnFloatingText(
                            t('game.building_open', {
                                name: buildingName(bDef.id),
                            }),
                            window.innerWidth / 2,
                            window.innerHeight / 2,
                        );
                    }
                }

                // 2. Check Rent Harvest Readiness
                if (
                    isConstructed &&
                    bDef.timer > 0 &&
                    !item.isReady &&
                    now >= item.harvestReadyAt
                ) {
                    newGrid[key] = { ...item, isReady: true };
                    updated = true;
                }
            });

            if (updated) {
                setGridData(newGrid);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [gridData, soundEnabled]);

    // Handle Canvas Click Actions (Build, Collect, Demolish, Inspect)
    const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!hoverTile) return;

        const key = `${hoverTile.x},${hoverTile.z}`;
        const existing = gridData[key];

        // 1. Bulldozer Mode
        if (selectedTool === 'bulldozer') {
            if (existing) {
                const bDef = BUILDING_TYPES[existing.type];
                if (bDef && existing.isConstructed) {
                    setPopulation((prev) =>
                        Math.max(0, prev - bDef.population),
                    );
                }
                const updated = { ...gridData };
                delete updated[key];
                setGridData(updated);
                setSelectedBuilding(null);
                playSound('demolish', soundEnabled);
                spawnFloatingText(t('game.destroyed'), e.clientX, e.clientY);
            }
            return;
        }

        // 2. Construction Placement Mode
        if (selectedTool && selectedTool !== 'bulldozer') {
            if (!existing) {
                const bDef = BUILDING_TYPES[selectedTool];
                if (bDef) {
                    if (level < bDef.unlockLevel) {
                        playSound('error', soundEnabled);
                        toast.error(
                            `🔒 ${t('game.requires_level', {
                                level: bDef.unlockLevel,
                                name: buildingName(selectedTool),
                            })}`,
                        );
                        return;
                    }

                    if (money < bDef.cost) {
                        playSound('error', soundEnabled);
                        toast.error(
                            t('game.not_enough_funds', {
                                name: buildingName(selectedTool),
                            }),
                        );
                        return;
                    }

                    const buildDuration = bDef.buildTime ?? 0;
                    const isImmediate = buildDuration === 0;
                    const buildStartedAt = Date.now();
                    const buildCompletedAt =
                        buildStartedAt + buildDuration * 1000;

                    // Deduct cost and add XP
                    setMoney((prev) => prev - bDef.cost);
                    addXP(bDef.xp);

                    // If immediate, population moves in now, otherwise when construction finishes
                    if (isImmediate && bDef.population > 0) {
                        setPopulation((prev) => prev + bDef.population);
                    }

                    const harvestReadyAt =
                        isImmediate && bDef.timer > 0
                            ? Date.now() + bDef.timer * 1000
                            : 0;

                    setGridData({
                        ...gridData,
                        [key]: {
                            type: selectedTool,
                            isConstructed: isImmediate,
                            buildStartedAt,
                            buildCompletedAt,
                            harvestReadyAt,
                            isReady: false,
                            createdAt: Date.now(),
                        },
                    });

                    playSound('build', soundEnabled);
                    spawnFloatingText(`-$${bDef.cost}`, e.clientX, e.clientY);

                    // Dispatch Laravel Background Job for in-game notification
                    if (!isImmediate) {
                        void fetch('/city/construction/start', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN':
                                    (
                                        document.querySelector(
                                            'meta[name="csrf-token"]',
                                        ) as HTMLMetaElement
                                    )?.content || '',
                                Accept: 'application/json',
                            },
                            body: JSON.stringify({
                                tile_key: key,
                                building_type: selectedTool,
                                building_name: bDef.name,
                                duration_seconds: buildDuration,
                            }),
                        });
                    }
                }
            }
            return;
        }

        // 3. Inspect or Harvest Mode
        if (existing) {
            const isConstructed = existing.isConstructed ?? true;

            // Case A: Harvest Ready Rent (has floating Dollar Symbol!)
            if (isConstructed && existing.isReady) {
                const bDef = BUILDING_TYPES[existing.type];
                if (bDef) {
                    const reward = bDef.income;
                    setMoney((prev) => prev + reward);
                    addXP(Math.floor(bDef.xp / 2));

                    // Reset timer
                    setGridData({
                        ...gridData,
                        [key]: {
                            ...existing,
                            isReady: false,
                            harvestReadyAt: Date.now() + bDef.timer * 1000,
                        },
                    });

                    playSound('collect', soundEnabled);
                    spawnFloatingText(`+$${reward}`, e.clientX, e.clientY);
                    setSelectedBuilding(null);
                }
            } else {
                // Case B: Show Inspection Modal (either Under Construction or in Production)
                setSelectedBuilding({ key, ...existing });
            }
        } else {
            setSelectedBuilding(null);
        }
    };

    const addXP = (amount: number) => {
        setXp((prevXP) => {
            const nextXP = prevXP + amount;
            const xpToNextLevel = level * 100;
            if (nextXP >= xpToNextLevel) {
                const nextLvl = level + 1;
                setLevel(nextLvl);
                playSound('levelup', soundEnabled);

                const newlyUnlocked = Object.values(BUILDING_TYPES).filter(
                    (b) => b.unlockLevel === nextLvl,
                );
                if (newlyUnlocked.length > 0) {
                    const names = newlyUnlocked
                        .map((b) => buildingName(b.id))
                        .join(', ');
                    toast.success(
                        `🎉 ${t('game.level_up_unlocked', {
                            level: nextLvl,
                            names,
                        })}`,
                        { duration: 5000 },
                    );
                } else {
                    toast.success(
                        `🎉 ${t('game.level_up', { level: nextLvl })}`,
                    );
                }

                return nextXP - xpToNextLevel;
            }
            return nextXP;
        });
    };

    const spawnFloatingText = (
        text: string,
        clientX: number,
        clientY: number,
    ) => {
        const id = Date.now() + Math.random();
        setFloatingTexts((prev) => [
            ...prev,
            { id, text, x: clientX, y: clientY },
        ]);
        setTimeout(() => {
            setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
        }, 1200);
    };

    const handleCollectBuilding = (key: string) => {
        const existing = gridData[key];
        if (!existing) return;
        const bDef = BUILDING_TYPES[existing.type];
        if (!bDef) return;
        const reward = bDef.income;
        setMoney((prev) => prev + reward);
        addXP(Math.floor(bDef.xp / 2));

        // Reset timer
        setGridData({
            ...gridData,
            [key]: {
                ...existing,
                isReady: false,
                harvestReadyAt: Date.now() + bDef.timer * 1000,
            },
        });

        playSound('collect', soundEnabled);
        spawnFloatingText(
            `+$${reward}`,
            window.innerWidth / 2,
            window.innerHeight / 2,
        );
        setSelectedBuilding(null);
    };

    const handleDemolishBuilding = (key: string) => {
        const existing = gridData[key];
        if (!existing) return;
        const bDef = BUILDING_TYPES[existing.type];
        const isConstructed = existing.isConstructed ?? true;
        const updated = { ...gridData };
        delete updated[key];
        setGridData(updated);
        if (isConstructed && bDef && bDef.population > 0) {
            setPopulation((prev) => Math.max(0, prev - bDef.population));
        }
        setSelectedBuilding(null);
        playSound('demolish', soundEnabled);
        spawnFloatingText(
            t('game.demolished'),
            window.innerWidth / 2,
            window.innerHeight / 2,
        );
    };

    const handleLockedBuilding = (item: BuildingDefinition) => {
        playSound('error', soundEnabled);
        toast.error(
            `🔒 ${t('game.locked_building', {
                level: item.unlockLevel,
                name: buildingName(item.id),
            })}`,
        );
    };

    // Camera Controls Manual Zoom
    const adjustZoom = (delta: number) => {
        const camera = cameraRef.current;
        if (!camera) return;
        camera.zoom = Math.min(Math.max(camera.zoom + delta, 0.5), 2.5);
        camera.updateProjectionMatrix();
    };

    const resetCamera = () => {
        const camera = cameraRef.current;
        if (!camera) return;
        camera.zoom = 1.0;
        camera.position.set(20, 20, 20);
        camera.lookAt(GRID_SIZE / 2, 0, GRID_SIZE / 2);
        camera.updateProjectionMatrix();
    };

    const handleStartNewCitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const chosenName = newCityNameInput.trim() || `${userName}'s City`;
        if (onResetCity) {
            await onResetCity(chosenName);
        }
        setCityName(chosenName);
        setMoney(2500);
        setPopulation(0);
        setXp(0);
        setLevel(1);
        setGridData({});
        setSelectedBuilding(null);
        setSelectedTool(null);
        setIsResetModalOpen(false);
        setNewCityNameInput('');
    };

    return (
        <div className="relative h-screen w-full overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
            {/* 3D WebGL Canvas Container */}
            <div
                ref={mountRef}
                onClick={handleCanvasClick}
                className="absolute inset-0 cursor-crosshair"
            />

            <FloatingTexts items={floatingTexts} />

            <TopHud
                cityName={cityName}
                userName={userName}
                money={money}
                population={population}
                xp={xp}
                level={level}
                saveStatus={saveStatus}
                soundEnabled={soundEnabled}
                onSave={() => {
                    void triggerSave();
                }}
                onNewCity={() => setIsResetModalOpen(true)}
                onProfileClick={() => setIsProfileModalOpen(true)}
                onToggleSound={() => setSoundEnabled(!soundEnabled)}
                onZoomIn={() => adjustZoom(0.2)}
                onZoomOut={() => adjustZoom(-0.2)}
                onResetCamera={resetCamera}
            />

            <ShopToolbar
                selectedTool={selectedTool}
                activeTab={activeTab}
                money={money}
                level={level}
                onTabChange={setActiveTab}
                onToolChange={setSelectedTool}
                onLockedBuilding={handleLockedBuilding}
            />

            {selectedBuilding && !selectedTool && (
                <InspectionModal
                    building={selectedBuilding}
                    nowTick={nowTick}
                    onClose={() => setSelectedBuilding(null)}
                    onCollect={handleCollectBuilding}
                    onDemolish={handleDemolishBuilding}
                />
            )}

            {isResetModalOpen && (
                <NewCityModal
                    userName={userName}
                    value={newCityNameInput}
                    onChange={setNewCityNameInput}
                    onClose={() => setIsResetModalOpen(false)}
                    onSubmit={handleStartNewCitySubmit}
                />
            )}

            {isProfileModalOpen && (
                <ProfileSettingsModal
                    passwordRules={settings?.passwordRules ?? ''}
                    onClose={() => setIsProfileModalOpen(false)}
                />
            )}
        </div>
    );
}
