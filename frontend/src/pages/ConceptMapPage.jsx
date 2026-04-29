import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getConceptMap, uploadConceptMapPng, updateConceptMapGraph, updateConceptMapPrivacy } from '../api';
import './ConceptMapPage.css';
import BackButton from '../components/BackButton.jsx';

const ConceptMapPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const canvasRef = useRef(null);
    
    // Core state
    const [mapData, setMapData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    
    // Editor State
    const searchParams = new URLSearchParams(location.search);
    const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
    const [selectedElement, setSelectedElement] = useState(null); // { type: 'node'|'edge', data: object }
    const [isAddingConnection, setIsAddingConnection] = useState(false);
    // Forced re-render trigger for UI
    const [, setTickFlip] = useState(0);

    // Viewport state for panning/zooming
    const transformRef = useRef({ x: 0, y: 0, k: 1 });
    const isDraggingCanvasRef = useRef(false);
    const draggingNodeRef = useRef(null);
    const connectionSourceNodeRef = useRef(null);
    const lastMousePosRef = useRef({ x: 0, y: 0 });

    // Forces simulation state
    const simulationRef = useRef(null);
    const nodesRef = useRef([]);
    const edgesRef = useRef([]);

    useEffect(() => {
        getConceptMap(id)
            .then(data => {
                setMapData(data);
                if (!data.isOwner && isEditing) {
                    setIsEditing(false);
                }
                try {
                    const parsed = typeof data.graphData === 'string' ? JSON.parse(data.graphData) : data.graphData;
                    initGraphData(parsed);
                } catch(e) {
                    setError("Failed to parse graph data");
                }
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
            
        return () => {
            if (simulationRef.current) cancelAnimationFrame(simulationRef.current);
        };
    }, [id]);

    const initGraphData = (graph) => {
        if (!graph || (!graph.nodes && !graph.edges)) return;
        
        nodesRef.current = (graph.nodes || []).map(n => {
            const len = (n.label || "Concept").length;
            let baseR = n.type === 'main' ? 65 : (n.type === 'sub' ? 50 : 40);
            if (len > 15) baseR += 15;
            if (len > 25) baseR += 15;

            return {
                ...n,
                x: n.fx !== undefined ? n.fx : (n.x || 400 + (Math.random() - 0.5) * 400),
                y: n.fy !== undefined ? n.fy : (n.y || 300 + (Math.random() - 0.5) * 300),
                vx: 0,
                vy: 0,
                radius: baseR,
                color: n.type === 'main' ? '#2b5c3f' : (n.type === 'sub' ? '#4a6b57' : '#7ba18a')
            };
        });
        
        edgesRef.current = (graph.edges || []).map(e => {
            const source = nodesRef.current.find(n => n.id === e.from);
            const target = nodesRef.current.find(n => n.id === e.to);
            // Some edges might be assigned a random ID if not present
            return { ...e, id: e.id || Math.random().toString(36).substring(7), source, target };
        }).filter(e => e.source && e.target);
        
        startSimulation();
    };

    const startSimulation = () => {
        if (simulationRef.current) cancelAnimationFrame(simulationRef.current);
        
        let alpha = 1.0;
        const decay = 0.02;
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        const tick = () => {
            const nodes = nodesRef.current;
            const edges = edgesRef.current;
            
            // Only apply physics if active or editing
            if (alpha > 0 || isEditing || draggingNodeRef.current) {
                // 1. Repulsion
                for (let i = 0; i < nodes.length; i++) {
                    for (let j = i + 1; j < nodes.length; j++) {
                        const n1 = nodes[i];
                        const n2 = nodes[j];
                        const dx = n2.x - n1.x;
                        const dy = n2.y - n1.y;
                        const distSq = dx * dx + dy * dy;
                        if (distSq === 0) continue;
                        const dist = Math.sqrt(distSq);
                        
                        const minDist = n1.radius + n2.radius + 50; 
                        if (dist < minDist) {
                            const overlap = minDist - dist;
                            const force = (overlap / minDist) * alpha * 2.5; 
                            const fx = (dx / dist) * force * 20;
                            const fy = (dy / dist) * force * 20;
                            n1.vx -= fx; n1.vy -= fy;
                            n2.vx += fx; n2.vy += fy;
                        }
                    }
                }
                
                // 2. Attraction (Edges)
                edges.forEach(edge => {
                    const s = edge.source;
                    const t = edge.target;
                    const dx = t.x - s.x;
                    const dy = t.y - s.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist === 0) return; // SAFEGUARD against Division by Zero 
                    
                    const targetDist = s.radius + t.radius + 180; 
                    const force = (dist - targetDist) * alpha * 0.01;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    
                    s.vx += fx; s.vy += fy;
                    t.vx -= fx; t.vy -= fy;
                });
                
                // 3. Center pull
                nodes.forEach(n => {
                    n.vx += (width / 2 - n.x) * alpha * 0.0005;
                    n.vy += (height / 2 - n.y) * alpha * 0.0005;
                });
                
                // 4. Update pos
                nodes.forEach(n => {
                    if (n.fx !== undefined && n.fy !== undefined) {
                        n.x = n.fx;
                        n.y = n.fy;
                        n.vx = 0;
                        n.vy = 0;
                    } else {
                        n.x += n.vx;
                        n.y += n.vy;
                        n.vx *= 0.8;
                        n.vy *= 0.8;
                    }
                });
            }
            
            draw();
            
            // In edit mode we keep physics running fully to allow unlimited dragging without it freezing
            if (isEditing) {
                alpha = Math.max(0.1, alpha - decay);
            } else {
                alpha -= decay;
            }
        };

        // Separate render loop that always runs
        const renderLoop = () => {
            tick();
            draw();
            simulationRef.current = requestAnimationFrame(renderLoop);
        };
        
        simulationRef.current = requestAnimationFrame(renderLoop);
    };

    const wakeSimulation = () => {
        // Safe to call now since it will cancel the previous loop
        startSimulation();
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        drawToContext(ctx, canvas.width, canvas.height, transformRef.current, false);
    };

    const drawToContext = (ctx, w, h, transform, isExport = false) => {
        if (!isExport) {
            ctx.clearRect(0, 0, w, h);
        }
        
        const { x, y, k } = transform;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(k, k);
        
        // Selected highlight backgrounds
        if (!isExport && selectedElement) {
            if (selectedElement.type === 'node') {
                const sn = nodesRef.current.find(n => n.id === selectedElement.data.id);
                if (sn) {
                    ctx.beginPath();
                    ctx.arc(sn.x, sn.y, sn.radius + 12/k, 0, 2*Math.PI);
                    ctx.fillStyle = 'rgba(74, 107, 87, 0.2)';
                    ctx.fill();
                }
            } else if (selectedElement.type === 'edge') {
                const se = edgesRef.current.find(e => e.id === selectedElement.data.id);
                if (se) {
                    ctx.beginPath();
                    ctx.moveTo(se.source.x, se.source.y);
                    ctx.lineTo(se.target.x, se.target.y);
                    ctx.lineWidth = 14 / k;
                    ctx.strokeStyle = 'rgba(74, 107, 87, 0.2)';
                    ctx.stroke();
                }
            }
        }

        // Draw Edges (lines only)
        ctx.lineWidth = 2 / k; 
        edgesRef.current.forEach(edge => {
            ctx.beginPath();
            ctx.moveTo(edge.source.x, edge.source.y);
            ctx.lineTo(edge.target.x, edge.target.y);
            ctx.strokeStyle = (!isExport && selectedElement?.type === 'edge' && selectedElement.data.id === edge.id) ? '#4a6b57' : '#cbd5e1';
            ctx.stroke();
        });
        
        // Draw Nodes
        nodesRef.current.forEach(n => {
            ctx.shadowColor = 'rgba(0,0,0,0.15)';
            ctx.shadowBlur = 10 / k;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 4 / k;
            
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.radius, 0, 2 * Math.PI);
            ctx.fillStyle = n.color;
            ctx.fill();
            
            ctx.shadowColor = 'transparent';
            
            // Draw ring if selected or source of connection
            if (!isExport && selectedElement?.type === 'node' && selectedElement.data.id === n.id) {
                ctx.lineWidth = 4 / k;
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();
            } else if (!isExport && isAddingConnection && connectionSourceNodeRef.current?.id === n.id) {
                // Highlight the source node uniquely if we are in adding connection mode
                ctx.lineWidth = 6 / k;
                ctx.strokeStyle = '#f59e0b'; // amber/orange to distinguish it
                ctx.stroke();
            }
            
            ctx.fillStyle = '#ffffff';
            ctx.font = n.type === 'main' ? 'bold 16px Inter' : 'bold 13px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const maxW = n.radius * 1.8;
            wrapText(ctx, n.label || "Concept", n.x, n.y, maxW, 16);
        });

        // Draw Edge Labels
        edgesRef.current.forEach(edge => {
            if (edge.label) {
                let midX = (edge.source.x + edge.target.x) / 2;
                let midY = (edge.source.y + edge.target.y) / 2;
                
                ctx.font = `${Math.max(10, 12 / Math.max(1, k))}px Inter`;
                const textWidth = ctx.measureText(edge.label).width;
                const boxW = textWidth + (16 / k);
                const boxH = 20 / Math.max(1, k);
                
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.beginPath();
                ctx.roundRect(midX - boxW/2, midY - boxH/2, boxW, boxH, 4 / k);
                ctx.fill();
                
                if (!isExport && selectedElement?.type === 'edge' && selectedElement.data.id === edge.id) {
                    ctx.strokeStyle = '#2b5c3f';
                    ctx.lineWidth = 2 / k;
                    ctx.stroke();
                }

                // Draw interaction hint if selected
                if (!isExport && isEditing && selectedElement?.type === 'edge' && selectedElement.data.id === edge.id) {
                    ctx.fillStyle = '#10b981';
                    ctx.font = `bold ${Math.max(8, 10 / Math.max(1, k))}px Inter`;
                    ctx.fillText('Double-click to edit', midX, midY + boxH);
                }

                ctx.fillStyle = '#1e293b';  
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(edge.label, midX, midY);
            }
        });
        
        ctx.restore();
    };

    const wrapText = (context, text, x, y, maxWidth, lineHeight) => {
        let words = text.split(' ');
        let line = '';
        let lines = [];
        for(let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = context.measureText(testLine);
            let testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);
        let startY = y - (lines.length - 1) * lineHeight / 2;
        for(let j = 0; j < lines.length; j++) {
            context.fillText(lines[j], x, startY + (j * lineHeight));
        }
    };
    
    // Interactivity
    const getMouseCoord = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const { x, y, k } = transformRef.current;
        // Fix: Include both logical and x/y aliases for math functions
        const logicX = (mouseX - x) / k;
        const logicY = (mouseY - y) / k;
        return {
            logicX, logicY,
            x: logicX,
            y: logicY
        };
    };

    // Math for point-to-line segment distance
    const distToSegmentSq = (p, v, w) => {
        let l2 = (w.x - v.x)*(w.x - v.x) + (w.y - v.y)*(w.y - v.y);
        if (l2 === 0) return (p.x - v.x)*(p.x - v.x) + (p.y - v.y)*(p.y - v.y);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const projX = v.x + t * (w.x - v.x);
        const projY = v.y + t * (w.y - v.y);
        return (p.x - projX)*(p.x - projX) + (p.y - projY)*(p.y - projY);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const onWheel = (e) => {
            e.preventDefault();
            const { x, y, k } = transformRef.current;
            const delta = -e.deltaY * 0.001;
            const newK = Math.max(0.1, Math.min(5, k * Math.exp(delta)));
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const newX = mouseX - (mouseX - x) * (newK / k);
            const newY = mouseY - (mouseY - y) * (newK / k);
            transformRef.current = { x: newX, y: newY, k: newK };
            window.requestAnimationFrame(draw);
        };

        const onPointerDown = (e) => {
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
            const m = getMouseCoord(e);

            if (isEditing) {
                // Hit detection Nodes first
                for (let i = nodesRef.current.length - 1; i >= 0; i--) {
                    const n = nodesRef.current[i];
                    const dx = n.x - m.logicX;
                    const dy = n.y - m.logicY;
                    if (dx*dx + dy*dy <= n.radius*n.radius) {
                        
                        if (isAddingConnection) {
                            if (!connectionSourceNodeRef.current) {
                                connectionSourceNodeRef.current = n;
                            } else {
                                const sourceNode = connectionSourceNodeRef.current;
                                const targetNode = n;
                                
                                if (sourceNode.id !== targetNode.id) {
                                    const newLabel = prompt(`adding an edge between "${sourceNode.label}" and "${targetNode.label}" with label:`, 'relates to');
                                    if (newLabel !== null) {
                                        edgesRef.current.push({
                                            id: 'edge_' + Math.random().toString(36).substring(2),
                                            from: sourceNode.id,
                                            to: targetNode.id,
                                            source: sourceNode,
                                            target: targetNode,
                                            label: newLabel
                                        });
                                        startSimulation();
                                    }
                                }
                                connectionSourceNodeRef.current = null;
                                setIsAddingConnection(false);
                            }
                            setTickFlip(Date.now());
                            return; // Don't trigger drag
                        }

                        draggingNodeRef.current = n;
                        return; // Prevent canvas drag
                    }
                }
                
                // Hit detection Edges
                if (!isAddingConnection) {
                    const k = transformRef.current.k;
                    // Aim for a 20 pixel click tolerance radius on the literal screen
                    const logicToleranceSq = (20 / k) * (20 / k);
                    
                    for (let j = 0; j < edgesRef.current.length; j++) {
                        const edge = edgesRef.current[j];
                        const d = distToSegmentSq(m, {x: edge.source.x, y: edge.source.y}, {x: edge.target.x, y: edge.target.y});
                        if (d < logicToleranceSq) { 
                            setSelectedElement({ type: 'edge', data: edge });
                            setTickFlip(Date.now());
                            return;
                        }
                    }
                }
            }

            // Clicked empty space
            setSelectedElement(null);
            setTickFlip(Date.now());
            isDraggingCanvasRef.current = true;
            canvas.style.cursor = 'grabbing';
            wakeSimulation();
        };

        const onDoubleClick = (e) => {
            if (!isEditing || isAddingConnection) return;
            const m = getMouseCoord(e);
            for (let j = 0; j < edgesRef.current.length; j++) {
                const edge = edgesRef.current[j];
                const d = distToSegmentSq(m, {x: edge.source.x, y: edge.source.y}, {x: edge.target.x, y: edge.target.y});
                if (d < 200) {
                    const newLabel = prompt(`Edit relationship between "${edge.source.label}" and "${edge.target.label}":`, edge.label);
                    if (newLabel !== null) {
                        edge.label = newLabel;
                        setSelectedElement({ type: 'edge', data: edge });
                        setTickFlip(Date.now());
                    }
                    return;
                }
            }
        };

        const onPointerMove = (e) => {
            if (isEditing && draggingNodeRef.current) {
                const m = getMouseCoord(e);
                draggingNodeRef.current.fx = m.logicX;
                draggingNodeRef.current.fy = m.logicY;
                return;
            }

            if (!isDraggingCanvasRef.current) return;
            const dx = e.clientX - lastMousePosRef.current.x;
            const dy = e.clientY - lastMousePosRef.current.y;
            transformRef.current.x += dx;
            transformRef.current.y += dy;
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        };

        const onPointerUp = (e) => {
            if (isEditing && draggingNodeRef.current) {
                // Keep the fx/fy pinned permanently after drag!
                setSelectedElement({ type: 'node', data: draggingNodeRef.current });
                setTickFlip(Date.now());
                draggingNodeRef.current = null;
                return;
            }
            isDraggingCanvasRef.current = false;
            canvas.style.cursor = 'grab';
        };

        canvas.addEventListener('wheel', onWheel, { passive: false });
        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('dblclick', onDoubleClick);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);

        return () => {
            canvas.removeEventListener('wheel', onWheel);
            canvas.removeEventListener('pointerdown', onPointerDown);
            canvas.removeEventListener('dblclick', onDoubleClick);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };
    }, [isEditing, loading, isAddingConnection]); 
    // re-bind events when edit mode changes

    // Update map shape logic
    const recalcNodeProp = (n) => {
        const len = (n.label || "Concept").length;
        let baseR = n.type === 'main' ? 65 : (n.type === 'sub' ? 50 : 40);
        if (len > 15) baseR += 15;
        if (len > 25) baseR += 15;
        n.radius = baseR;
        n.color = n.type === 'main' ? '#2b5c3f' : (n.type === 'sub' ? '#4a6b57' : '#7ba18a');
        draw();
    };

    const handleAddNode = () => {
        const newNode = {
            id: 'node_' + Math.random().toString(36).substring(2),
            label: 'New Concept',
            type: 'sub',
            x: -transformRef.current.x / transformRef.current.k + window.innerWidth / 2,
            y: -transformRef.current.y / transformRef.current.k + window.innerHeight / 2,
            vx: 0, vy: 0
        };
        recalcNodeProp(newNode);
        nodesRef.current.push(newNode);
        startSimulation();
    };

    const handleDeleteElement = () => {
        if (!selectedElement) return;
        if (selectedElement.type === 'node') {
            const id = selectedElement.data.id;
            nodesRef.current = nodesRef.current.filter(n => n.id !== id);
            edgesRef.current = edgesRef.current.filter(e => e.source.id !== id && e.target.id !== id);
        } else if (selectedElement.type === 'edge') {
            edgesRef.current = edgesRef.current.filter(e => e.id !== selectedElement.data.id);
        }
        setSelectedElement(null);
        startSimulation();
        draw();
    };

    const handleSaveEdits = async () => {
        setUploading(true);
        // Build JSON explicitly mapping `nodesRef` and `edgesRef`
        const nJson = nodesRef.current.map(n => ({
            id: n.id,
            label: n.label,
            type: n.type,
            fx: n.fx, fy: n.fy // save pinned coordinates!
        }));
        const eJson = edgesRef.current.map(e => ({
            id: e.id,
            from: e.source.id,
            to: e.target.id,
            label: e.label
        }));
        
        try {
            await updateConceptMapGraph(id, { nodes: nJson, edges: eJson });
            alert("Concept map changes successfully synchronized to storage!");
            setIsEditing(false);
            setSelectedElement(null);
        } catch(e) {
            alert("Failed saving: " + e.message);
        } finally {
            setUploading(false);
        }
    };

    // PDF Saving
    const loadJsPDF = async () => {
        if (window.jspdf) return window.jspdf.jsPDF;
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
            script.onload = () => resolve(window.jspdf.jsPDF);
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    const saveToLibrary = async () => {
        if (!canvasRef.current) return;
        setUploading(true);
        try {
            const jsPDF = await loadJsPDF();
            
            // 1. Calculate dynamic bounding box of all nodes
            const nodes = nodesRef.current;
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            
            if (nodes.length === 0) {
                setUploading(false);
                return;
            }

            nodes.forEach(n => {
                const padding = n.radius + 60; // Leave nice padding around nodes
                if (n.x - padding < minX) minX = n.x - padding;
                if (n.y - padding < minY) minY = n.y - padding;
                if (n.x + padding > maxX) maxX = n.x + padding;
                if (n.y + padding > maxY) maxY = n.y + padding;
            });

            const logicalWidth = maxX - minX;
            const logicalHeight = maxY - minY;

            // 2. Render to ultra-high-resolution offscreen canvas (smart DPI scaling)
            // We cap the maximum dimensions to prevent generating a massive 50MB+ Blob 
            // that gets rejected by the server or crashes the browser.
            const MAX_DIM = 6000; 
            let dpi = 2.5; // High definition target
            
            if (logicalWidth * dpi > MAX_DIM) dpi = MAX_DIM / logicalWidth;
            if (logicalHeight * dpi > MAX_DIM) dpi = MAX_DIM / logicalHeight;
            dpi = Math.max(0.5, Math.min(2.5, dpi));

            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = logicalWidth * dpi;
            offscreenCanvas.height = logicalHeight * dpi;
            const ctx = offscreenCanvas.getContext('2d');

            // Force solid white background so it's not transparent
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

            const exportTransform = {
                x: -minX * dpi,
                y: -minY * dpi,
                k: dpi
            };
            
            // Draw natively utilizing the helper to avoid pixelation
            drawToContext(ctx, offscreenCanvas.width, offscreenCanvas.height, exportTransform, true);
            const imgData = offscreenCanvas.toDataURL('image/jpeg', 0.95); // Use JPEG for massively smaller payload footprint
            
            // 3. Size the PDF dynamically to fit the exact layout of the map perfectly!
            const pdf = new jsPDF({
                orientation: logicalWidth > logicalHeight ? 'landscape' : 'portrait',
                unit: 'px',
                format: [logicalWidth, logicalHeight]
            });
            
            pdf.addImage(imgData, 'JPEG', 0, 0, logicalWidth, logicalHeight);
            const pdfBlob = pdf.output('blob');
            
            const file = new File([pdfBlob], `${mapData.title || 'concept_map'}.pdf`, { type: 'application/pdf' });
            await uploadConceptMapPng(id, file);
            
            pdf.save(`${mapData.title || 'concept_map'}.pdf`);
            
            alert('Concept map saved to your library as a high-quality PDF!');
        } catch (e) {
            alert('Failed to save PDF: ' + e.message);
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className="cmap-page-loading"><div className="loader"></div>Building visual map...</div>;
    if (error) return <div className="cmap-page-error">{error}</div>;

    const actualSelectedNode = selectedElement?.type === 'node' ? nodesRef.current.find(n => n.id === selectedElement.data.id) : null;
    const actualSelectedEdge = selectedElement?.type === 'edge' ? edgesRef.current.find(e => e.id === selectedElement.data.id) : null;

    const handleTogglePrivacy = async () => {
        try {
            await updateConceptMapPrivacy(id, !mapData.isPublic);
            setMapData({ ...mapData, isPublic: !mapData.isPublic });
        } catch (e) {
            alert('Failed to update privacy: ' + e.message);
        }
    };

    return (
        <div className="cmap-page-container">
            <header className="cmap-page-header">
                <div style={{display:'flex', alignItems:'center', gap: 16}}>
                    <BackButton />
                    <div className="cmap-header-info">
                        <h1>{mapData.title || "AI Concept Map"}</h1>
                        <p>{isEditing ? "✏️ Edit Mode Active" : `Generated from ${mapData.sourceSetId ? 'flashcard set' : 'library material'}`}</p>
                    </div>
                </div>
                
                <div style={{display:'flex', gap: 12}}>
                    {!isEditing && (
                        <>
                            {mapData.isOwner && (
                                <>
                                    <button className="cmap-save-png" style={{background: '#6b4a4a'}} onClick={handleTogglePrivacy}>
                                        {mapData.isPublic ? '🔒 Make Private' : '🌍 Make Public'}
                                    </button>
                                    <button className="cmap-save-png" style={{background: '#4a6b57'}} onClick={() => setIsEditing(true)}>
                                        ✏️ Edit Map
                                    </button>
                                </>
                            )}
                            <button className="cmap-save-png" onClick={saveToLibrary} disabled={uploading}>
                                {uploading ? 'Saving...' : '💾 Save as PDF'}
                            </button>
                        </>
                    )}
                    {isEditing && (
                        <>
                            <button className="cmap-back-btn" onClick={() => { setIsEditing(false); setSelectedElement(null); }}>
                                Cancel Edits
                            </button>
                            <button className="cmap-save-png" onClick={handleSaveEdits} disabled={uploading}>
                                {uploading ? 'Synching...' : '✅ Save Changes'}
                            </button>
                        </>
                    )}
                </div>
            </header>
            
            <main className="cmap-canvas-wrap">
                <div style={{position: 'absolute', top: 12, left: 16, zIndex: 10, background: 'rgba(255,255,255,0.8)', padding: '6px 10px', borderRadius: 6, fontSize: '0.85rem', color: '#4a6b57', pointerEvents: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'}}>
                    {isEditing ? "✏️ Click & Drag to pin nodes. Click to edit/delete." : "🖱 Drag to pan · Scroll to zoom"}
                </div>

                {/* Edit Controls Toolbar */}
                {isEditing && (
                    <div className="cmap-edit-toolbar">
                        <button className="cmap-btn" onClick={handleAddNode}>+ Add Concept</button>
                        {isAddingConnection ? (
                            <button className="cmap-danger-btn" onClick={() => { setIsAddingConnection(false); connectionSourceNodeRef.current = null; setTickFlip(Date.now()); }}>
                                ✕ Cancel Connection
                            </button>
                        ) : (
                            <button className="cmap-btn" onClick={() => { setIsAddingConnection(true); setTickFlip(Date.now()); }}>
                                🔗 Add Connection
                            </button>
                        )}
                    </div>
                )}
                
                {/* Connection Mode Helper UI */}
                {isAddingConnection && (
                    <div style={{position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 20, background: '#f59e0b', color: '#fff', padding: '10px 20px', borderRadius: 20, fontWeight: 'bold', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'}}>
                        {connectionSourceNodeRef.current ? "Now click the Target Concept..." : "Click the Source Concept first..."}
                    </div>
                )}

                {/* Element Properties Sidebar */}
                {isEditing && selectedElement && !isAddingConnection && (
                    <div className="cmap-properties-sidebar">
                        <h3>{selectedElement.type === 'node' ? 'Edit Concept' : 'Edit Connection'}</h3>
                        
                        {actualSelectedNode && (
                            <>
                                <label>Label</label>
                                <input 
                                    value={actualSelectedNode.label} 
                                    onChange={e => { actualSelectedNode.label = e.target.value; recalcNodeProp(actualSelectedNode); setTickFlip(Date.now()); }} 
                                />
                                <label>Importance</label>
                                <select 
                                    value={actualSelectedNode.type} 
                                    onChange={e => { actualSelectedNode.type = e.target.value; recalcNodeProp(actualSelectedNode); setTickFlip(Date.now()); }}
                                >
                                    <option value="main">Main Topic</option>
                                    <option value="sub">Sub Topic</option>
                                    <option value="detail">Detail</option>
                                </select>
                            </>
                        )}
                        
                        {actualSelectedEdge && (
                            <>
                                <label>Relationship</label>
                                <input 
                                    value={actualSelectedEdge.label || ''} 
                                    onChange={e => { actualSelectedEdge.label = e.target.value; setTickFlip(Date.now()); }} 
                                />
                                
                                <label style={{marginTop: 12}}>Source Concept</label>
                                <select 
                                    value={actualSelectedEdge.source.id} 
                                    onChange={e => {
                                        const newSource = nodesRef.current.find(n => n.id === e.target.value);
                                        if (newSource && newSource.id !== actualSelectedEdge.target.id) {
                                            actualSelectedEdge.from = newSource.id;
                                            actualSelectedEdge.source = newSource;
                                            setTickFlip(Date.now());
                                        }
                                    }}
                                >
                                    {nodesRef.current.map(n => <option key={`src-${n.id}`} value={n.id}>{n.label || "Concept"}</option>)}
                                </select>

                                <label style={{marginTop: 12}}>Target Concept</label>
                                <select 
                                    value={actualSelectedEdge.target.id} 
                                    onChange={e => {
                                        const newTarget = nodesRef.current.find(n => n.id === e.target.value);
                                        if (newTarget && newTarget.id !== actualSelectedEdge.source.id) {
                                            actualSelectedEdge.to = newTarget.id;
                                            actualSelectedEdge.target = newTarget;
                                            setTickFlip(Date.now());
                                        }
                                    }}
                                >
                                    {nodesRef.current.map(n => <option key={`tgt-${n.id}`} value={n.id}>{n.label || "Concept"}</option>)}
                                </select>
                            </>
                        )}

                        <div style={{marginTop: 24, borderTop: '1px solid #e2e8f0', paddingTop: 16}}>
                            <button className="cmap-danger-btn" onClick={handleDeleteElement}>🗑 Delete {selectedElement.type === 'node' ? 'Concept' : 'Connection'}</button>
                        </div>
                        <button className="cmap-close-prop-btn" onClick={() => {setSelectedElement(null); draw();}}>✕</button>
                    </div>
                )}

                <canvas ref={canvasRef} style={{ touchAction: 'none' }} />
            </main>
        </div>
    );
};

export default ConceptMapPage;
