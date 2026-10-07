import React, {
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback,
} from 'react';
import * as THREE from 'three';
import { toast } from 'sonner';
import { echo } from '@laravel/echo-react';
import { BUILDING_TYPES } from './buildings';
import { resolveGameCursor } from './cursor-mode';
import {
    DEFAULT_DEMOLISH_REFUND_PERCENT,
    DEFAULT_GRID_SIZE,
    DEFAULT_MAP_EXPANSION_COST,
    DEFAULT_MAX_LEVEL,
    DEFAULT_NEXT_EXPANSION_LEVEL,
} from './game-limits';
import {
    buildingCost,
    calcDemolishRefund,
    createTileBuildingGroup,
    disposeObject3D,
    gridItemNeedsMeshRebuild,
    neighborRoadKeys,
    roadConnectionsFor,
} from './grid-scene-sync';
import type {
    BuildingDefinition,
    CityLimits,
    FloatingText,
    GridData,
    GridItem,
    MetroCityGameProps,
    SaveStatus,
} from './types';
import { playSound } from './audio';
import { createBuildingMesh } from './building-meshes';
import FloatingTexts from './hud/floating-texts';
import TopHud from './hud/top-hud';
import ShopToolbar from './hud/shop-toolbar';
import type { ShopCategory } from './hud/shop-toolbar';
import InspectionModal from './hud/inspection-modal';
import NewCityModal from './hud/new-city-modal';
import ProfileSettingsModal from './hud/profile-settings-modal';
import FeedbackModal from './hud/feedback-modal';
import { useTranslation } from '@/hooks/use-translation';

// Backwards-compatible re-exports for existing importers.
// (Definitions now live in sibling modules.)
export { BUILDING_TYPES, GRID_SIZE, formatDuration } from './buildings';
export { createBuildingMesh } from './building-meshes';
export { getRoadTexture } from './road-texture';
export type {
    BuildingDefinition,
    CityLimits,
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
    onExpandMap,
    settings,
}: MetroCityGameProps) {
    const { t } = useTranslation();

    const maxLevel = initialCity.limits?.maxLevel ?? DEFAULT_MAX_LEVEL;
    const demolishRefundPercent =
        initialCity.limits?.demolishRefundPercent ??
        DEFAULT_DEMOLISH_REFUND_PERCENT;

    const buildingName = (type: string): string =>
        t(`building.${type}.name`, BUILDING_TYPES[type]?.name ?? type);

    const ensureMoney = useCallback((value: number) => Math.max(0, value), []);

    // Game Economy State
    const [cityName, setCityName] = useState(initialCity.name || 'Metropolis');
    const [money, setMoney] = useState(() =>
        ensureMoney(initialCity.money ?? 2500),
    );
    const [population, setPopulation] = useState(initialCity.population ?? 0);
    const [xp, setXp] = useState(initialCity.xp ?? 0);
    const [level, setLevel] = useState(() =>
        Math.min(maxLevel, initialCity.level ?? 1),
    );
    const [gridSize, setGridSize] = useState(
        initialCity.gridSize ?? DEFAULT_GRID_SIZE,
    );
    const [cityLimits, setCityLimits] = useState<CityLimits | undefined>(
        initialCity.limits,
    );
    const [isExpandingMap, setIsExpandingMap] = useState(false);
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
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [newCityNameInput, setNewCityNameInput] = useState('');
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const lastSavedRef = useRef<string>('');
    const prevGridRef = useRef<GridData | null>(null);
    const prevGridMeshesRef = useRef<GridData>({});
    const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const collectAllSavePendingRef = useRef(false);
    const gameStateRef = useRef({
        cityName,
        money,
        population,
        xp,
        level,
        gridData,
    });

    // Canvas Refs
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const objectsGroupRef = useRef<THREE.Group | null>(null);
    const previewMeshRef = useRef<THREE.Group | null>(null);
    const gridTilesRef = useRef<Map<string, THREE.Mesh>>(new Map());
    const tileBuildingMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
    const highlightedTileKeyRef = useRef<string | null>(null);
    const hoverRafRef = useRef<number | null>(null);
    const pendingHoverRef = useRef<{ x: number; z: number } | null>(null);

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

    useEffect(() => {
        gameStateRef.current = {
            cityName,
            money,
            population,
            xp,
            level,
            gridData,
        };
    }, [cityName, money, population, xp, level, gridData]);

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

    const triggerSave = useCallback(async () => {
        if (!onSave) {
            return;
        }

        const state = gameStateRef.current;
        const currentStateStr = JSON.stringify({
            cityName: state.cityName,
            money: state.money,
            population: state.population,
            xp: state.xp,
            level: state.level,
            gridData: state.gridData,
        });

        if (currentStateStr === lastSavedRef.current) {
            return;
        }

        try {
            setSaveStatus('saving');
            await onSave({
                name: state.cityName,
                money: state.money,
                population: state.population,
                xp: state.xp,
                level: state.level,
                grid_data: state.gridData,
            });
            lastSavedRef.current = currentStateStr;
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2500);
        } catch {
            setSaveStatus('error');
        }
    }, [onSave]);

    const scheduleSave = useCallback(
        (options?: { immediate?: boolean }) => {
            if (saveDebounceRef.current) {
                clearTimeout(saveDebounceRef.current);
                saveDebounceRef.current = null;
            }

            if (options?.immediate) {
                void triggerSave();
                return;
            }

            saveDebounceRef.current = setTimeout(() => {
                saveDebounceRef.current = null;
                void triggerSave();
            }, 400);
        },
        [triggerSave],
    );

    useEffect(() => {
        return () => {
            if (saveDebounceRef.current) {
                clearTimeout(saveDebounceRef.current);
            }
        };
    }, []);

    // Autosave when a building finishes construction.
    useEffect(() => {
        const prev = prevGridRef.current;
        prevGridRef.current = gridData;
        if (!prev) {
            return;
        }
        const hasCompletedBuilding = Object.keys(gridData).some((key) => {
            const was = prev[key];
            const nowItem = gridData[key];
            if (!was || !nowItem) {
                return false;
            }
            return (
                (was.isConstructed ?? true) === false &&
                (nowItem.isConstructed ?? true) === true
            );
        });
        if (hasCompletedBuilding) {
            scheduleSave({ immediate: true });
        }
    }, [gridData, scheduleSave]);

    useEffect(() => {
        if (!collectAllSavePendingRef.current) {
            return;
        }
        collectAllSavePendingRef.current = false;
        scheduleSave({ immediate: true });
    }, [gridData, money, xp, level, scheduleSave]);

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
        camera.lookAt(gridSize / 2, 0, gridSize / 2);
        cameraRef.current = camera;

        // 3. Renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
        });
        renderer.setSize(width, height);
        const pixelCap = window.matchMedia('(max-width: 768px)').matches
            ? 1.5
            : 2;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelCap));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.shadowMap.autoUpdate = false;
        currentMount.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // 4. Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xfffaed, 0.85);
        dirLight.position.set(25, 40, 20);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
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
        gridTilesRef.current = new Map();
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                const tileGeo = new THREE.BoxGeometry(0.96, 0.1, 0.96);
                const isAlternate = (x + z) % 2 === 0;
                const baseColor = isAlternate ? 0x82c91e : 0x74b816;
                const tileMat = new THREE.MeshStandardMaterial({
                    color: baseColor,
                    roughness: 0.8,
                });
                const tileMesh = new THREE.Mesh(tileGeo, tileMat);
                tileMesh.position.set(x + 0.5, -0.05, z + 0.5);
                tileMesh.receiveShadow = true;
                tileMesh.userData = {
                    gridX: x,
                    gridZ: z,
                    isTile: true,
                    baseColor,
                };
                gridGroup.add(tileMesh);
                gridTilesRef.current.set(`${x},${z}`, tileMesh);
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

        const commitHover = () => {
            hoverRafRef.current = null;
            const pending = pendingHoverRef.current;
            setHoverTile((current) => {
                if (!pending && !current) {
                    return current;
                }
                if (
                    pending &&
                    current &&
                    pending.x === current.x &&
                    pending.z === current.z
                ) {
                    return current;
                }
                return pending;
            });
        };

        const handleMouseMove = (event: MouseEvent) => {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(gridGroup.children);

            if (intersects.length > 0) {
                const hitTile = intersects[0].object as THREE.Mesh;
                if (hitTile.userData?.isTile) {
                    pendingHoverRef.current = {
                        x: hitTile.userData.gridX as number,
                        z: hitTile.userData.gridZ as number,
                    };
                } else {
                    pendingHoverRef.current = null;
                }
            } else {
                pendingHoverRef.current = null;
            }

            if (hoverRafRef.current === null) {
                hoverRafRef.current = requestAnimationFrame(commitHover);
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
                if (cloud.position.x > gridSize + 10) {
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
            if (hoverRafRef.current !== null) {
                cancelAnimationFrame(hoverRafRef.current);
            }
            timer.dispose();
            gridTilesRef.current.clear();
            tileBuildingMeshesRef.current.clear();
            prevGridMeshesRef.current = {};
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
    }, [gridSize]);

    const rebuildTileMesh = useCallback((key: string, data: GridData) => {
        const group = objectsGroupRef.current;
        const item = data[key];
        if (!group || !item) {
            return;
        }

        const existing = tileBuildingMeshesRef.current.get(key);
        if (existing) {
            group.remove(existing);
            disposeObject3D(existing);
        }

        const meshGroup = createTileBuildingGroup(key, item, data);
        group.add(meshGroup);
        tileBuildingMeshesRef.current.set(key, meshGroup);
    }, []);

    // Incremental sync of building meshes when gridData changes.
    useEffect(() => {
        if (!objectsGroupRef.current) {
            return;
        }

        const group = objectsGroupRef.current;
        const prev = prevGridMeshesRef.current;
        const nextKeys = new Set(Object.keys(gridData));
        const keysToRebuild = new Set<string>();

        Object.keys(prev).forEach((key) => {
            if (!nextKeys.has(key)) {
                const mesh = tileBuildingMeshesRef.current.get(key);
                if (mesh) {
                    group.remove(mesh);
                    disposeObject3D(mesh);
                    tileBuildingMeshesRef.current.delete(key);
                }
                if (prev[key]?.type === 'road') {
                    neighborRoadKeys(key).forEach((nk) =>
                        keysToRebuild.add(nk),
                    );
                }
            }
        });

        nextKeys.forEach((key) => {
            const item = gridData[key];
            if (!item) {
                return;
            }
            if (gridItemNeedsMeshRebuild(prev[key], item)) {
                keysToRebuild.add(key);
                if (item.type === 'road' || prev[key]?.type === 'road') {
                    neighborRoadKeys(key).forEach((nk) =>
                        keysToRebuild.add(nk),
                    );
                }
            }
        });

        keysToRebuild.forEach((key) => {
            if (!gridData[key]) {
                const mesh = tileBuildingMeshesRef.current.get(key);
                if (mesh) {
                    group.remove(mesh);
                    disposeObject3D(mesh);
                    tileBuildingMeshesRef.current.delete(key);
                }
                return;
            }
            rebuildTileMesh(key, gridData);
        });

        prevGridMeshesRef.current = gridData;

        if (rendererRef.current && keysToRebuild.size > 0) {
            rendererRef.current.shadowMap.needsUpdate = true;
        }
    }, [gridData, rebuildTileMesh]);

    useEffect(() => {
        const resetTileMaterial = (mesh: THREE.Mesh) => {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            const baseColor = mesh.userData.baseColor as number;
            mat.color.setHex(baseColor);
            mat.emissive.setHex(0x000000);
            mat.emissiveIntensity = 0;
        };

        const previousKey = highlightedTileKeyRef.current;
        if (previousKey) {
            const previousMesh = gridTilesRef.current.get(previousKey);
            if (previousMesh) {
                resetTileMaterial(previousMesh);
            }
        }

        if (!hoverTile) {
            highlightedTileKeyRef.current = null;
            return;
        }

        const key = `${hoverTile.x},${hoverTile.z}`;
        highlightedTileKeyRef.current = key;
        const mesh = gridTilesRef.current.get(key);
        if (!mesh) {
            return;
        }

        const mat = mesh.material as THREE.MeshStandardMaterial;
        const existing = gridData[key];
        let emissive = 0x38bdf8;

        if (selectedTool === 'bulldozer') {
            emissive = existing ? 0xf87171 : 0x64748b;
        } else if (selectedTool && selectedTool !== 'bulldozer') {
            const bType = BUILDING_TYPES[selectedTool];
            const isOccupied = !!existing;
            const canAfford = bType ? money >= bType.cost : false;
            const isUnlocked = bType ? level >= bType.unlockLevel : false;
            emissive =
                !isOccupied && canAfford && isUnlocked ? 0xa3e635 : 0xf87171;
        } else if (existing?.isReady) {
            emissive = 0x34d399;
        }

        mat.emissive.setHex(emissive);
        mat.emissiveIntensity = 0.35;
    }, [hoverTile, selectedTool, gridData, money, level]);

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
                    preview = createBuildingMesh(
                        selectedTool,
                        roadConnectionsFor(gridData, hoverTile.x, hoverTile.z),
                    );
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
                const refund = calcDemolishRefund(
                    buildingCost(existing.type),
                    demolishRefundPercent,
                );
                if (bDef && existing.isConstructed) {
                    setPopulation((prev) =>
                        Math.max(0, prev - bDef.population),
                    );
                }
                const updated = { ...gridData };
                delete updated[key];
                setGridData(updated);
                if (refund > 0) {
                    setMoney((prev) => ensureMoney(prev + refund));
                }
                setSelectedBuilding(null);
                playSound('demolish', soundEnabled);
                spawnFloatingText(
                    refund > 0
                        ? t('game.demolish_refund', {
                              amount: refund.toLocaleString(),
                          })
                        : t('game.destroyed'),
                    e.clientX,
                    e.clientY,
                );
                scheduleSave({ immediate: true });
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
                    setMoney((prev) => ensureMoney(prev - bDef.cost));
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

                    scheduleSave({ immediate: true });
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
                    setMoney((prev) => ensureMoney(prev + reward));
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
                    scheduleSave({ immediate: true });
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
            if (nextXP >= xpToNextLevel && level < maxLevel) {
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
        setMoney((prev) => ensureMoney(prev + reward));
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
        scheduleSave({ immediate: true });
    };

    const handleDemolishBuilding = (key: string) => {
        const existing = gridData[key];
        if (!existing) return;
        const bDef = BUILDING_TYPES[existing.type];
        const isConstructed = existing.isConstructed ?? true;
        const refund = calcDemolishRefund(
            buildingCost(existing.type),
            demolishRefundPercent,
        );
        const updated = { ...gridData };
        delete updated[key];
        setGridData(updated);
        if (isConstructed && bDef && bDef.population > 0) {
            setPopulation((prev) => Math.max(0, prev - bDef.population));
        }
        if (refund > 0) {
            setMoney((prev) => ensureMoney(prev + refund));
        }
        setSelectedBuilding(null);
        playSound('demolish', soundEnabled);
        spawnFloatingText(
            refund > 0
                ? t('game.demolish_refund', {
                      amount: refund.toLocaleString(),
                  })
                : t('game.demolished'),
            window.innerWidth / 2,
            window.innerHeight / 2,
        );
        scheduleSave({ immediate: true });
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
        camera.lookAt(gridSize / 2, 0, gridSize / 2);
        camera.updateProjectionMatrix();
    };

    const readyCollectibleCount = useMemo(() => {
        return Object.values(gridData).filter((item) => {
            const bDef = BUILDING_TYPES[item.type];
            return (
                (item.isConstructed ?? true) &&
                item.isReady &&
                bDef &&
                bDef.income > 0
            );
        }).length;
    }, [gridData]);

    const handleCollectAll = () => {
        if (readyCollectibleCount === 0) {
            toast.message(t('game.collect_all_empty'));
            return;
        }

        let totalReward = 0;
        let totalXp = 0;
        let collected = 0;
        const now = Date.now();
        const updated: GridData = { ...gridData };

        Object.keys(updated).forEach((key) => {
            const item = updated[key];
            const bDef = BUILDING_TYPES[item.type];
            if (
                !bDef ||
                bDef.income <= 0 ||
                !(item.isConstructed ?? true) ||
                !item.isReady
            ) {
                return;
            }

            totalReward += bDef.income;
            totalXp += Math.floor(bDef.xp / 2);
            collected += 1;
            updated[key] = {
                ...item,
                isReady: false,
                harvestReadyAt: now + bDef.timer * 1000,
            };
        });

        collectAllSavePendingRef.current = true;
        setGridData(updated);
        setMoney((prev) => ensureMoney(prev + totalReward));
        if (totalXp > 0) {
            addXP(totalXp);
        }

        playSound('collect', soundEnabled);
        toast.success(
            t('game.collect_all_success', {
                total: totalReward.toLocaleString(),
                count: collected,
            }),
        );
    };

    const handleExpandMap = async () => {
        if (!onExpandMap || isExpandingMap) {
            return;
        }

        if (!cityLimits?.canExpand) {
            toast.error(t('game.map_expansion_max_reached'));
            return;
        }

        const nextExpansionLevel =
            cityLimits?.nextExpansionLevel ?? DEFAULT_NEXT_EXPANSION_LEVEL;
        if (level < nextExpansionLevel) {
            toast.error(
                t('game.map_expansion_level_required', {
                    level: nextExpansionLevel,
                }),
            );
            return;
        }

        const cost = cityLimits?.mapExpansionCost ?? DEFAULT_MAP_EXPANSION_COST;
        if (money < cost) {
            toast.error(t('game.map_expansion_insufficient_funds'));
            return;
        }

        try {
            setIsExpandingMap(true);
            const city = await onExpandMap();
            setMoney(ensureMoney(city.money));
            setGridSize(city.gridSize ?? gridSize);
            setCityLimits(city.limits);
            playSound('levelup', soundEnabled);
            toast.success(
                t('game.expand_map_success', {
                    size: city.gridSize ?? gridSize,
                }),
            );
            resetCamera();
        } catch (error) {
            playSound('error', soundEnabled);
            toast.error(
                error instanceof Error && error.message
                    ? error.message
                    : t('game.map_expansion_insufficient_funds'),
            );
        } finally {
            setIsExpandingMap(false);
        }
    };

    const handleStartNewCitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const chosenName = newCityNameInput.trim() || `${userName}'s City`;
        if (onResetCity) {
            await onResetCity(chosenName);
        }
        setCityName(chosenName);
        setMoney(ensureMoney(2500));
        setPopulation(0);
        setXp(0);
        setLevel(1);
        setGridSize(DEFAULT_GRID_SIZE);
        setCityLimits(
            initialCity.limits
                ? { ...initialCity.limits, canExpand: true }
                : undefined,
        );
        setGridData({});
        setSelectedBuilding(null);
        setSelectedTool(null);
        setIsResetModalOpen(false);
        setNewCityNameInput('');
    };

    const canvasCursor = useMemo(
        () =>
            resolveGameCursor(selectedTool, hoverTile, gridData, money, level),
        [selectedTool, hoverTile, gridData, money, level],
    );

    return (
        <div className="relative h-screen w-full overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
            {/* 3D WebGL Canvas Container */}
            <div
                ref={mountRef}
                onClick={handleCanvasClick}
                className="absolute inset-0"
                style={{ cursor: canvasCursor }}
            />

            <FloatingTexts items={floatingTexts} />

            <TopHud
                cityName={cityName}
                userName={userName}
                money={money}
                population={population}
                xp={xp}
                level={level}
                readyCollectibleCount={readyCollectibleCount}
                canExpandMap={cityLimits?.canExpand ?? false}
                mapExpansionCost={
                    cityLimits?.mapExpansionCost ?? DEFAULT_MAP_EXPANSION_COST
                }
                gridSize={gridSize}
                isExpandingMap={isExpandingMap}
                saveStatus={saveStatus}
                soundEnabled={soundEnabled}
                onSave={() => {
                    void triggerSave();
                }}
                onNewCity={() => setIsResetModalOpen(true)}
                onCollectAll={handleCollectAll}
                onExpandMap={() => {
                    void handleExpandMap();
                }}
                onProfileClick={() => setIsProfileModalOpen(true)}
                onFeedbackClick={() => setIsFeedbackModalOpen(true)}
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

            {isFeedbackModalOpen && (
                <FeedbackModal onClose={() => setIsFeedbackModalOpen(false)} />
            )}
        </div>
    );
}
