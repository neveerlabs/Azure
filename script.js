// Azure/script.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

console.log(`Developer   : Neverlabs
Technology  : HTML5, CSS3, JavaScript
Framework   : Three.js
Version     : v1.2.0
Copyright   : © 2026 Powered By Azure`);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(2, 1, 4);
camera.lookAt(0, 0, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const starCount = 4000;
const starGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(starCount * 3);
const alphas = new Float32Array(starCount);
const offsets = new Float32Array(starCount);
for (let i = 0; i < starCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 2000;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2000 - 500;
    alphas[i] = Math.random() * 0.6 + 0.3;
    offsets[i] = Math.random() * 6.283;
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
starGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
starGeometry.setAttribute('offset', new THREE.BufferAttribute(offsets, 1));

const starMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0.0 } },
    vertexShader: `
        attribute float alpha;
        attribute float offset;
        varying float vAlpha;
        varying float vOffset;
        void main() {
            vAlpha = alpha;
            vOffset = offset;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = 2.0 * (350.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
    `,
    fragmentShader: `
        uniform float time;
        varying float vAlpha;
        varying float vOffset;
        void main() {
            float tw = sin(time * 1.5 + vOffset) * 0.2;
            float finalAlpha = clamp(vAlpha + tw, 0.1, 1.0);
            gl_FragColor = vec4(1.0, 0.98, 0.95, finalAlpha);
        }
    `,
    transparent: true,
    depthWrite: false
});

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

const sunLight = new THREE.DirectionalLight(0xffeedd, 2.2);
sunLight.position.set(5, 5, 7);
sunLight.castShadow = true;
sunLight.receiveShadow = true;
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0x1a1a2e));

const textureLoader = new THREE.TextureLoader();
const moonTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/moon_1024.jpg');
const bumpTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/moon_bump.jpg');
const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 64, 64),
    new THREE.MeshStandardMaterial({
        map: moonTexture,
        bumpMap: bumpTexture,
        bumpScale: 0.06,
        roughness: 0.7,
        metalness: 0.1,
        emissive: new THREE.Color(0x111122),
        emissiveIntensity: 0.1
    })
);
moon.castShadow = true;
moon.receiveShadow = true;
scene.add(moon);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.5;
controls.zoomSpeed = 0.8;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;
controls.enableZoom = true;
controls.enableRotate = true;
controls.enableRotate = true;
controls.target.set(0, 0, 0);

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() * 0.0008;
    starMaterial.uniforms.time.value = time;
    moon.rotation.y += 0.0006;
    moon.rotation.x += 0.0002;
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

const audioAlarm = new Audio('/sound/alarm.mp3');
const audioAdzan = new Audio('/sound/adzan.mp3');
audioAlarm.volume = 1.0;
audioAdzan.volume = 1.0;
audioAlarm.preload = 'auto';
audioAdzan.preload = 'auto';

let musicPlaylist = [];
let currentTrackIndex = -1;
let musicAudio = new Audio();
let isMusicPlaying = false;
let wasPlayingBeforeAdhan = false;
let wasPlayingBeforeAlarm = false;

const trackNameEl = document.getElementById('track-name');
const playPauseBtn = document.getElementById('play-pause-btn');
const playPauseIcon = playPauseBtn.querySelector('i');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const uploadBtn = document.getElementById('upload-btn');
const fileInput = document.getElementById('file-input');
const notificationBox = document.getElementById('notification-box');
const notificationMsg = document.getElementById('notification-message');
const closeNotif = document.getElementById('close-notification');
const playlistPanel = document.getElementById('playlist-panel');
const playlistList = document.getElementById('playlist-list');
const playlistEmptyMsg = document.getElementById('playlist-empty-message');
const clearPlaylistBtn = document.getElementById('clear-playlist-btn');

let currentLocation = { lat: -6.4025, lon: 106.7942 };
let prayerTimings = {};
let prayerTimeouts = [];

closeNotif.addEventListener('click', () => {
    notificationBox.classList.add('hidden');
});

function showNotification(message, iconClass) {
    if (iconClass) {
        notificationMsg.innerHTML = `<i class="${iconClass}"></i> ${message}`;
    } else {
        notificationMsg.textContent = message;
    }
    notificationBox.classList.remove('hidden');
}

function pauseMusic() {
    if (musicAudio && !musicAudio.paused) {
        musicAudio.pause();
        isMusicPlaying = false;
        playPauseIcon.className = 'fas fa-play';
    }
}

function resumeMusic() {
    if (musicAudio.src && currentTrackIndex !== -1 && musicPlaylist.length > 0) {
        musicAudio.play().catch(e => console.warn('resume failed', e));
        isMusicPlaying = true;
        playPauseIcon.className = 'fas fa-pause';
    }
}

function playTrack(index) {
    if (!musicPlaylist.length || index < 0 || index >= musicPlaylist.length) return;
    currentTrackIndex = index;
    const track = musicPlaylist[currentTrackIndex];
    musicAudio.src = track.dataURL || track.url;
    musicAudio.load();
    musicAudio.play().then(() => {
        isMusicPlaying = true;
        playPauseIcon.className = 'fas fa-pause';
        trackNameEl.textContent = track.name;
    }).catch(err => {
        console.warn('play failed', err);
        showNotification('gagal memutar lagu', 'fas fa-circle-exclamation');
    });
}

musicAudio.addEventListener('ended', () => {
    if (currentTrackIndex < musicPlaylist.length - 1) {
        playTrack(currentTrackIndex + 1);
    } else {
        isMusicPlaying = false;
        playPauseIcon.className = 'fas fa-play';
        trackNameEl.textContent = '—  selesai  —';
    }
});

musicAudio.addEventListener('error', (e) => {
    console.warn('audio error', e);
    if (musicPlaylist.length > 0) {
        showNotification('format audio tidak didukung', 'fas fa-circle-exclamation');
    }
});

playPauseBtn.addEventListener('click', () => {
    if (!musicPlaylist.length) {
        showNotification('tidak ada lagu di daftar putar', 'fas fa-music-slash');
        return;
    }
    if (isMusicPlaying) {
        musicAudio.pause();
        isMusicPlaying = false;
        playPauseIcon.className = 'fas fa-play';
    } else {
        if (musicAudio.src && currentTrackIndex !== -1) {
            musicAudio.play().catch(() => {});
            isMusicPlaying = true;
            playPauseIcon.className = 'fas fa-pause';
        } else if (musicPlaylist.length) {
            playTrack(0);
        }
    }
});

prevBtn.addEventListener('click', () => {
    if (musicPlaylist.length && currentTrackIndex > 0) playTrack(currentTrackIndex - 1);
});

nextBtn.addEventListener('click', () => {
    if (musicPlaylist.length && currentTrackIndex < musicPlaylist.length - 1) playTrack(currentTrackIndex + 1);
});

uploadBtn.addEventListener('click', () => fileInput.click());

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ name: file.name, dataURL: e.target.result });
        reader.onerror = () => reject(new Error('gagal membaca file'));
        reader.readAsDataURL(file);
    });
}

fileInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    try {
        const filePromises = files.map(file => readFileAsDataURL(file));
        const newTracks = await Promise.all(filePromises);
        musicPlaylist.push(...newTracks);
        savePlaylistToStorage();
        renderPlaylist();
        if (!isMusicPlaying && !musicAudio.src && musicPlaylist.length) {
            playTrack(0);
        }
        showNotification(`${files.length} lagu ditambahkan`, 'fas fa-check-circle');
    } catch (err) {
        showNotification('gagal membaca file', 'fas fa-triangle-exclamation');
    }
    fileInput.value = '';
});

function savePlaylistToStorage() {
    try {
        const serialized = musicPlaylist.map(({ name, dataURL }) => ({ name, dataURL }));
        localStorage.setItem('chronodeck_playlist', JSON.stringify(serialized));
    } catch (e) {
        console.warn('localStorage quota exceeded', e);
        showNotification('penyimpanan lokal penuh', 'fas fa-database');
    }
}

function loadPlaylistFromStorage() {
    const stored = localStorage.getItem('chronodeck_playlist');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length) {
                musicPlaylist = parsed;
            }
        } catch (e) {
            console.warn('invalid playlist storage');
        }
    }
}

function renderPlaylist() {
    playlistList.innerHTML = '';
    if (!musicPlaylist.length) {
        playlistEmptyMsg.classList.remove('hidden');
        playlistPanel.classList.add('playlist-panel');
        return;
    }
    playlistEmptyMsg.classList.add('hidden');
    musicPlaylist.forEach((track, idx) => {
        const li = document.createElement('li');
        li.className = 'playlist-item';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'playlist-item-name';
        nameSpan.textContent = track.name;
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'playlist-item-actions';
        const playBtn = document.createElement('button');
        playBtn.className = 'playlist-btn';
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        playBtn.setAttribute('aria-label', 'putar');
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            playTrack(idx);
        });
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'playlist-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.setAttribute('aria-label', 'hapus');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTrack(idx);
        });
        actionsDiv.appendChild(playBtn);
        actionsDiv.appendChild(deleteBtn);
        li.appendChild(nameSpan);
        li.appendChild(actionsDiv);
        playlistList.appendChild(li);
    });
}

function deleteTrack(index) {
    if (index < 0 || index >= musicPlaylist.length) return;
    const wasCurrent = (index === currentTrackIndex);
    musicPlaylist.splice(index, 1);
    if (musicPlaylist.length === 0) {
        currentTrackIndex = -1;
        musicAudio.pause();
        musicAudio.src = '';
        isMusicPlaying = false;
        playPauseIcon.className = 'fas fa-play';
        trackNameEl.textContent = '—  tidak ada musik  —';
    } else {
        if (wasCurrent) {
            if (index < musicPlaylist.length) {
                playTrack(index);
            } else {
                playTrack(musicPlaylist.length - 1);
            }
        } else if (currentTrackIndex > index) {
            currentTrackIndex--;
        }
    }
    savePlaylistToStorage();
    renderPlaylist();
    showNotification('lagu dihapus', 'fas fa-trash-alt');
}

clearPlaylistBtn.addEventListener('click', () => {
    if (musicPlaylist.length === 0) return;
    musicPlaylist = [];
    currentTrackIndex = -1;
    musicAudio.pause();
    musicAudio.src = '';
    isMusicPlaying = false;
    playPauseIcon.className = 'fas fa-play';
    trackNameEl.textContent = '—  tidak ada musik  —';
    savePlaylistToStorage();
    renderPlaylist();
    showNotification('daftar putar dikosongkan', 'fas fa-trash-alt');
});

function setVolumeMaxAndPauseForAlarm() {
    wasPlayingBeforeAlarm = isMusicPlaying;
    pauseMusic();
    audioAlarm.currentTime = 0;
    audioAlarm.play().catch(() => {});
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    showNotification(`alarm • ${timeString}`, 'fas fa-bell');
}

audioAlarm.addEventListener('ended', () => {
    if (wasPlayingBeforeAlarm) {
        resumeMusic();
    }
    wasPlayingBeforeAlarm = false;
});

function handleAdhan(prayerName) {
    wasPlayingBeforeAdhan = isMusicPlaying;
    pauseMusic();
    audioAdzan.currentTime = 0;
    audioAdzan.play().catch(() => {});
    showNotification(`${prayerName}`, 'fas fa-mosque');
}

audioAdzan.addEventListener('ended', () => {
    if (wasPlayingBeforeAdhan) {
        resumeMusic();
    }
    wasPlayingBeforeAdhan = false;
});

async function fetchPrayerTimes(lat, lon) {
    const date = new Date();
    const res = await fetch(`https://api.aladhan.com/v1/timings/${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}?latitude=${lat}&longitude=${lon}&method=2`);
    const data = await res.json();
    return data.data.timings;
}

function schedulePrayerEvents(timings) {
    prayerTimeouts.forEach(clearTimeout);
    prayerTimeouts = [];
    const now = new Date();
    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    prayers.forEach(name => {
        const timeStr = timings[name];
        if (!timeStr) return;
        const [h, m] = timeStr.split(':').map(Number);
        const prayerDate = new Date(now);
        prayerDate.setHours(h, m, 0, 0);
        if (prayerDate < now) prayerDate.setDate(prayerDate.getDate() + 1);
        const adhanTime = prayerDate.getTime();
        const alarmTime = adhanTime - 10 * 60 * 1000;
        const nowTime = now.getTime();
        if (alarmTime > nowTime) {
            prayerTimeouts.push(setTimeout(() => {
                setVolumeMaxAndPauseForAlarm();
            }, alarmTime - nowTime));
        }
        if (adhanTime > nowTime) {
            prayerTimeouts.push(setTimeout(() => {
                handleAdhan(name);
            }, adhanTime - nowTime));
        }
    });
    const midnight = new Date(now);
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    prayerTimeouts.push(setTimeout(() => {
        fetchAndSchedule();
    }, midnight.getTime() - nowTime));
}

function updateNextPrayerUI(timings) {
    const now = new Date();
    const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    let next = null;
    let nextName = '';
    for (let name of prayers) {
        const timeStr = timings[name];
        if (!timeStr) continue;
        const [h, m] = timeStr.split(':').map(Number);
        const d = new Date(now);
        d.setHours(h, m, 0, 0);
        if (d < now) d.setDate(d.getDate() + 1);
        if (!next || d < next) {
            next = d;
            nextName = name;
        }
    }
    if (next) {
        const diff = next - now;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        document.getElementById('next-prayer').innerHTML = `${nextName} <span style="opacity:0.8;">•</span> ${next.toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit' })}`;
        document.getElementById('countdown').textContent = `${hours}j ${minutes}m`;
    }
}

async function fetchAndSchedule() {
    try {
        const timings = await fetchPrayerTimes(currentLocation.lat, currentLocation.lon);
        prayerTimings = timings;
        schedulePrayerEvents(timings);
        updateNextPrayerUI(timings);
    } catch (err) {
        console.warn('prayer fetch failed', err);
        document.getElementById('next-prayer').textContent = 'jadwal tidak tersedia';
        document.getElementById('countdown').textContent = '';
    }
}

function getLocationAndFetch() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                currentLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude };
                fetchAndSchedule();
            },
            () => {
                fetch('https://ipapi.co/json/')
                    .then(r => r.json())
                    .then(d => {
                        if (d.latitude && d.longitude) {
                            currentLocation = { lat: d.latitude, lon: d.longitude };
                            fetchAndSchedule();
                        } else {
                            currentLocation = { lat: -6.4025, lon: 106.7942 };
                            fetchAndSchedule();
                        }
                    })
                    .catch(() => {
                        currentLocation = { lat: -6.4025, lon: 106.7942 };
                        fetchAndSchedule();
                    });
            }
        );
    } else {
        currentLocation = { lat: -6.4025, lon: 106.7942 };
        fetchAndSchedule();
    }
}

document.getElementById('refresh-location').addEventListener('click', getLocationAndFetch);

loadPlaylistFromStorage();
renderPlaylist();
if (musicPlaylist.length > 0 && !musicAudio.src) {
    playTrack(0);
}

getLocationAndFetch();
setInterval(() => {
    if (prayerTimings) updateNextPrayerUI(prayerTimings);
}, 1000);
