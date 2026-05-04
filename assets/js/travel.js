(function () {
    "use strict";

    var root = document.querySelector("[data-travel-page]");
    if (!root) {
        return;
    }

    var seedNode = document.getElementById("travel-seed");
    var seed = parseSeed(seedNode ? seedNode.textContent : "{}");
    var state = {
        places: (Array.isArray(seed.places) ? seed.places : []).map(normalizePlace).filter(Boolean),
        mode: "overview",
        parentId: "",
        activeId: "",
        map: null,
        activeLayer: "satellite",
        baseLayers: {},
        markers: {},
        scaleCheckTimer: 0,
        isTransitioning: false
    };

    var els = {
        workspace: root.querySelector(".travel-workspace"),
        mapPanel: root.querySelector(".travel-map-panel"),
        map: root.querySelector("[data-travel-map]"),
        timeline: root.querySelector("[data-travel-timeline]"),
        photoStrip: root.querySelector("[data-travel-photo-strip]"),
        card: root.querySelector("[data-travel-place-card]"),
        count: root.querySelector("[data-travel-count]"),
        countryCount: root.querySelector("[data-travel-country-count]"),
        back: root.querySelector("[data-travel-back]"),
        transitionLayer: null,
        ambient: null,
        ambientLayers: [],
        ambientIndex: 0
    };

    var chinaBounds = [[18.0, 73.0], [54.5, 135.5]];
    var detailEnterZoom = 10;
    var detailExitZoom = 9;
    var detailEnterDistanceMeters = 70000;
    var travelPhotoBasePath = "/images/travel/";
    var imageryAttribution = "Sources: Esri, Maxar, Earthstar Geographics, and the GIS User Community";

    init();

    function init() {
        initAmbientBackground();
        state.activeId = "";
        initResponsiveSidebar();
        bindEvents();
        renderStats();
        renderTimeline();
        renderPhotoStrip();
        initMap();
        hidePlaceCard();
    }

    function initResponsiveSidebar() {
        if (!window.matchMedia || !els.workspace) {
            return;
        }

        var media = window.matchMedia("(max-width: 720px)");
        var sync = function () {
            if (media.matches) {
                els.workspace.classList.add("is-sidebar-collapsed");
            } else {
                els.workspace.classList.remove("is-sidebar-collapsed");
            }
            if (state.map) {
                window.setTimeout(function () {
                    state.map.invalidateSize();
                }, 240);
            }
        };

        sync();
        if (media.addEventListener) {
            media.addEventListener("change", sync);
        } else if (media.addListener) {
            media.addListener(sync);
        }
    }

    function bindEvents() {
        root.querySelector("[data-travel-sidebar-toggle]").addEventListener("click", function () {
            els.workspace.classList.toggle("is-sidebar-collapsed");
            if (state.map) {
                window.setTimeout(function () {
                    state.map.invalidateSize();
                }, 240);
            }
        });

        root.querySelector("[data-travel-zoom-in]").addEventListener("click", function () {
            if (state.map) {
                state.map.zoomIn();
            }
        });

        root.querySelector("[data-travel-zoom-out]").addEventListener("click", function () {
            if (state.map) {
                state.map.zoomOut();
            }
        });

        root.querySelector("[data-travel-map-reset]").addEventListener("click", fitTravelBounds);

        root.querySelector("[data-travel-fullscreen]").addEventListener("click", toggleFullscreen);

        els.back.addEventListener("click", exitDetailMode);

        Array.prototype.forEach.call(root.querySelectorAll("[data-travel-layer]"), function (button) {
            button.addEventListener("click", function () {
                setBaseLayer(button.getAttribute("data-travel-layer"));
            });
        });

        document.addEventListener("fullscreenchange", function () {
            root.classList.toggle("is-map-fullscreen", document.fullscreenElement === els.mapPanel);
            if (state.map) {
                window.setTimeout(function () {
                    state.map.invalidateSize();
                }, 160);
            }
        });
    }

    function initMap() {
        if (!window.L) {
            els.map.innerHTML = '<div class="travel-map-fallback">地图资源暂时不可用</div>';
            return;
        }

        state.map = L.map(els.map, {
            center: [35.8, 104.2],
            zoom: 4,
            minZoom: 4,
            maxZoom: 18,
            zoomControl: false,
            preferCanvas: true,
            maxBounds: L.latLngBounds(chinaBounds).pad(0.22),
            maxBoundsViscosity: 0.75
        });
        els.transitionLayer = document.createElement("div");
        els.transitionLayer.className = "travel-transition-layer";
        els.map.appendChild(els.transitionLayer);

        state.baseLayers.standard = [
            L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            })
        ];

        state.baseLayers.satellite = [
            L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
                maxZoom: 18,
                attribution: imageryAttribution
            }),
            L.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
                maxZoom: 18,
                opacity: 0.72,
                attribution: "Esri"
            })
        ];

        setBaseLayer(state.activeLayer);
        renderMapLayers();
        fitTravelBounds();
        state.map.on("zoomend moveend", scheduleScaleModeCheck);
    }

    function setBaseLayer(layerName) {
        if (!state.map || !state.baseLayers[layerName]) {
            return;
        }

        Object.keys(state.baseLayers).forEach(function (name) {
            state.baseLayers[name].forEach(function (layer) {
                if (state.map.hasLayer(layer)) {
                    state.map.removeLayer(layer);
                }
            });
        });

        state.baseLayers[layerName].forEach(function (layer) {
            layer.addTo(state.map);
        });

        state.activeLayer = layerName;
        Array.prototype.forEach.call(root.querySelectorAll("[data-travel-layer]"), function (button) {
            button.classList.toggle("is-active", button.getAttribute("data-travel-layer") === layerName);
        });
    }

    function renderMapLayers() {
        if (!state.map) {
            return;
        }

        Object.keys(state.markers).forEach(function (key) {
            state.map.removeLayer(state.markers[key]);
        });
        state.markers = {};

        getCurrentItems().forEach(function (place) {
            var marker = L.marker([place.lat, place.lng], {
                title: place.city,
                icon: L.divIcon({
                    className: state.mode === "detail" ? "travel-leaflet-marker travel-leaflet-marker-spot" : "travel-leaflet-marker",
                    html: '<span style="--pin-color:' + escapeAttribute(place.accent) + '"></span>',
                    iconSize: [28, 28],
                    iconAnchor: [14, 14]
                })
            });
            marker.on("click", function () {
                if (state.mode === "overview" && place.spots.length) {
                    enterDetailMode(place.id);
                } else {
                    focusPlace(place.id, true);
                    showPlaceCard(place.id);
                }
            });
            marker.on("mouseover", function () {
                showPlaceCard(place.id);
            });
            marker.on("mouseout", function () {
                hidePlaceCard();
            });
            marker.addTo(state.map);
            state.markers[place.id] = marker;
        });

        renderModeUI();
        updateMarkerState();
    }

    function renderStats() {
        var countries = {};
        state.places.forEach(function (place) {
            if (place.country) {
                countries[place.country] = true;
            }
        });
        els.count.textContent = String(state.places.length);
        els.countryCount.textContent = String(Object.keys(countries).length);
    }

    function renderTimeline() {
        var sorted = getCurrentItems().slice().sort(function (a, b) {
            return String(b.date).localeCompare(String(a.date));
        });
        els.timeline.innerHTML = "";
        sorted.forEach(function (place) {
            var item = document.createElement("button");
            item.type = "button";
            item.className = "travel-timeline-item";
            item.style.setProperty("--item-color", place.accent);
            item.classList.toggle("is-active", place.id === state.activeId);
            item.innerHTML =
                '<span class="travel-timeline-date">' + escapeHTML(formatDate(place.date)) + '</span>' +
                '<span class="travel-timeline-title">' + escapeHTML(place.city) + '</span>' +
                '<span class="travel-timeline-note">' + escapeHTML(place.note || place.country || "") + '</span>';
            item.addEventListener("click", function () {
                if (state.mode === "overview" && place.spots.length) {
                    enterDetailMode(place.id);
                } else {
                    focusPlace(place.id, true);
                }
            });
            item.addEventListener("mouseenter", function () {
                setAmbientBackground(place);
            });
            els.timeline.appendChild(item);
        });
    }

    function renderPhotoStrip() {
        var items = getCurrentItems().slice().sort(function (a, b) {
            return String(b.date).localeCompare(String(a.date));
        }).slice(0, 6);
        els.photoStrip.innerHTML = "";
        items.forEach(function (place) {
            var photoUrl = getTravelPhotoUrl(place.photo);
            var item = document.createElement("button");
            item.type = "button";
            item.className = "travel-strip-item";
            item.style.setProperty("--strip-color", place.accent);
            item.innerHTML = photoUrl ?
                '<img src="' + escapeAttribute(photoUrl) + '" alt=""><span>' + escapeHTML(place.city) + '</span>' :
                '<strong>' + escapeHTML(place.city.slice(0, 1)) + '</strong><span>' + escapeHTML(place.city) + '</span>';
            item.addEventListener("click", function () {
                if (state.mode === "overview" && place.spots.length) {
                    enterDetailMode(place.id);
                } else {
                    focusPlace(place.id, true);
                }
            });
            item.addEventListener("mouseenter", function () {
                setAmbientBackground(place);
            });
            els.photoStrip.appendChild(item);
        });
    }

    function showPlaceCard(id) {
        var place = getPlaceById(id);
        if (!place) {
            hidePlaceCard();
            return;
        }

        setAmbientBackground(place);
        state.activeId = id;
        updateMarkerState();
        renderTimeline();

        var tags = place.tags.map(function (tag) {
            return "<span>" + escapeHTML(tag) + "</span>";
        }).join("");
        var photoUrl = getTravelPhotoUrl(place.photo);
        var image = photoUrl ?
            '<img class="travel-place-photo" src="' + escapeAttribute(photoUrl) + '" alt="' + escapeAttribute(place.city) + '">' :
            '<div class="travel-photo-fallback" aria-hidden="true">' + escapeHTML(place.city.slice(0, 1)) + '</div>';

        els.card.style.setProperty("--place-color", place.accent);
        els.card.innerHTML =
            '<div class="travel-place-inner">' +
            image +
            '<div class="travel-place-body">' +
            '<div class="travel-place-meta"><span>' + escapeHTML(formatDate(place.date)) + '</span><span>' + escapeHTML(place.country || "") + '</span></div>' +
            '<h3>' + escapeHTML(place.city) + '</h3>' +
            '<p>' + escapeHTML(place.note || "") + '</p>' +
            '<div class="travel-tags">' + tags + '</div>' +
            '</div>' +
            '</div>';
        els.card.classList.add("is-visible");
    }

    function hidePlaceCard() {
        state.activeId = "";
        updateMarkerState();
        renderTimeline();
        els.card.classList.remove("is-visible");
    }

    function focusPlace(id, moveMap) {
        state.activeId = id;
        updateMarkerState();
        renderTimeline();

        var place = getActivePlace();
        if (place) {
            setAmbientBackground(place);
        }
        if (moveMap && place && state.map) {
            state.map.flyTo([place.lat, place.lng], Math.max(state.map.getZoom(), 8), {
                duration: prefersReducedMotion() ? 0 : 0.7
            });
        }
    }

    function updateMarkerState() {
        Object.keys(state.markers).forEach(function (id) {
            var element = state.markers[id].getElement();
            if (element) {
                element.classList.toggle("is-active", id === state.activeId);
            }
        });
    }

    function getPlaceById(id) {
        return getCurrentItems().filter(function (place) {
            return place.id === id;
        })[0] || null;
    }

    function fitTravelBounds() {
        if (!state.map) {
            return;
        }

        var points = getCurrentItems().map(function (place) {
            return [place.lat, place.lng];
        });
        var bounds = points.length ? L.latLngBounds(points) : L.latLngBounds(chinaBounds);

        if (points.length === 1) {
            state.map.setView(points[0], state.mode === "detail" ? 14 : 8);
            return;
        }

        state.map.fitBounds(bounds.pad(0.26), {
            maxZoom: state.mode === "detail" ? 14 : 8,
            animate: !prefersReducedMotion()
        });
    }

    function toggleFullscreen() {
        if (!document.fullscreenEnabled || !els.mapPanel) {
            root.classList.toggle("is-map-fullscreen");
            if (state.map) {
                window.setTimeout(function () {
                    state.map.invalidateSize();
                }, 160);
            }
            return;
        }

        if (document.fullscreenElement === els.mapPanel) {
            document.exitFullscreen();
            return;
        }

        els.mapPanel.requestFullscreen().then(function () {
            if (state.map) {
                window.setTimeout(function () {
                    state.map.invalidateSize();
                }, 220);
            }
        }).catch(function () {
            root.classList.toggle("is-map-fullscreen");
        });
    }

    function normalizePlace(place) {
        if (!place || !place.city) {
            return null;
        }
        var lat = clamp(Number(place.lat), -90, 90);
        var lng = clamp(Number(place.lng), -180, 180);
        if (!isFinite(lat) || !isFinite(lng)) {
            return null;
        }
        return {
            id: String(place.id || slugify(place.city) || Date.now()),
            city: String(place.city),
            country: String(place.country || "中国"),
            date: String(place.date || ""),
            lat: lat,
            lng: lng,
            accent: /^#[0-9a-f]{6}$/i.test(String(place.accent || "")) ? String(place.accent) : "#007aff",
            note: String(place.note || ""),
            tags: Array.isArray(place.tags) ? place.tags.map(String).filter(Boolean) : [],
            photo: normalizeTravelPhoto(place.photo),
            spots: Array.isArray(place.spots) ? place.spots.map(normalizePlace).filter(Boolean) : []
        };
    }

    function getActivePlace() {
        return getCurrentItems().filter(function (place) {
            return place.id === state.activeId;
        })[0] || getLatestPlace(state.places);
    }

    function getParentPlace() {
        return state.places.filter(function (place) {
            return place.id === state.parentId;
        })[0] || null;
    }

    function getCurrentItems() {
        var parent = getParentPlace();
        if (state.mode === "detail" && parent && parent.spots.length) {
            return parent.spots;
        }
        return state.places;
    }

    function enterDetailMode(id, options) {
        options = options || {};
        var parent = state.places.filter(function (place) {
            return place.id === id;
        })[0];
        if (!parent || !parent.spots.length) {
            focusPlace(id, true);
            return;
        }

        if (state.isTransitioning || (state.mode === "detail" && state.parentId === id)) {
            return;
        }

        state.isTransitioning = true;
        hidePlaceCard();

        var finish = function () {
            animateLevelTransition(parent, "split").then(function () {
                state.mode = "detail";
                state.parentId = id;
                state.activeId = "";
                renderMapLayers();
                renderTimeline();
                renderPhotoStrip();
                renderModeUI();
                window.requestAnimationFrame(function () {
                    setTransitionVisual(false);
                    state.isTransitioning = false;
                });
            });
        };

        if (state.map && options.moveMap !== false) {
            flyToDetailBounds(parent);
            window.setTimeout(finish, prefersReducedMotion() ? 0 : 680);
            return;
        }

        finish();
    }

    function exitDetailMode(options) {
        options = options || {};
        var parent = getParentPlace();

        if (state.isTransitioning) {
            return;
        }

        if (!parent) {
            state.mode = "overview";
            state.parentId = "";
            renderModeUI();
            return;
        }

        state.isTransitioning = true;
        hidePlaceCard();
        animateLevelTransition(parent, "aggregate").then(function () {
            state.mode = "overview";
            state.parentId = "";
            state.activeId = "";
            renderMapLayers();
            renderTimeline();
            renderPhotoStrip();
            renderModeUI();
            window.requestAnimationFrame(function () {
                setTransitionVisual(false);
                state.isTransitioning = false;
                if (options.fitMap !== false) {
                    fitTravelBounds();
                }
            });
        });
    }

    function renderModeUI() {
        var parent = getParentPlace();
        root.classList.toggle("is-travel-detail", state.mode === "detail");
        if (!els.back) {
            return;
        }
        els.back.hidden = state.mode !== "detail";
        els.back.textContent = "返回";
    }

    function scheduleScaleModeCheck() {
        window.clearTimeout(state.scaleCheckTimer);
        state.scaleCheckTimer = window.setTimeout(handleScaleModeChange, 90);
    }

    function handleScaleModeChange() {
        if (!state.map) {
            return;
        }

        if (state.isTransitioning) {
            return;
        }

        var zoom = state.map.getZoom();
        if (state.mode === "detail" && zoom <= detailExitZoom) {
            exitDetailMode({ fitMap: false });
            return;
        }

        if (state.mode !== "overview" || zoom < detailEnterZoom) {
            return;
        }

        var nearest = getNearestSpotParent(state.map.getCenter());
        if (nearest && nearest.distance <= detailEnterDistanceMeters) {
            enterDetailMode(nearest.place.id, { moveMap: false });
        }
    }

    function getNearestSpotParent(center) {
        if (!state.map) {
            return null;
        }

        return state.places.reduce(function (best, place) {
            if (!place.spots.length) {
                return best;
            }
            var distance = state.map.distance(center, L.latLng(place.lat, place.lng));
            if (!best || distance < best.distance) {
                return { place: place, distance: distance };
            }
            return best;
        }, null);
    }

    function flyToDetailBounds(parent) {
        if (!state.map || !parent.spots.length) {
            return;
        }

        var bounds = L.latLngBounds(parent.spots.map(function (spot) {
            return [spot.lat, spot.lng];
        }));
        bounds.extend([parent.lat, parent.lng]);
        state.map.flyToBounds(bounds.pad(0.32), {
            maxZoom: 14,
            duration: prefersReducedMotion() ? 0 : 0.65,
            animate: !prefersReducedMotion()
        });
    }

    function animateLevelTransition(parent, direction) {
        if (prefersReducedMotion() || !state.map || !els.transitionLayer || !parent.spots.length) {
            return Promise.resolve();
        }

        setTransitionVisual(true);
        clearTransitionLayer();

        var parentPoint = state.map.latLngToContainerPoint([parent.lat, parent.lng]);
        var duration = 620;
        var maxDelay = 0;

        parent.spots.forEach(function (spot, index) {
            var spotPoint = state.map.latLngToContainerPoint([spot.lat, spot.lng]);
            var delay = index * 46;
            maxDelay = Math.max(maxDelay, delay);
            createTransitionDot({
                color: spot.accent,
                from: direction === "split" ? parentPoint : spotPoint,
                to: direction === "split" ? spotPoint : parentPoint,
                delay: delay,
                duration: duration,
                startScale: direction === "split" ? 1.18 : 0.88,
                endScale: direction === "split" ? 0.88 : 1.18,
                endOpacity: direction === "split" ? 0.98 : 0.18,
                className: direction === "split" ? "travel-transition-dot-split" : "travel-transition-dot-aggregate"
            });
        });

        return new Promise(function (resolve) {
            window.setTimeout(function () {
                clearTransitionLayer();
                resolve();
            }, duration + maxDelay + 90);
        });
    }

    function createTransitionDot(options) {
        var dot = document.createElement("span");
        var dx = options.to.x - options.from.x;
        var dy = options.to.y - options.from.y;

        dot.className = "travel-transition-dot " + options.className;
        dot.style.left = options.from.x + "px";
        dot.style.top = options.from.y + "px";
        dot.style.setProperty("--dot-color", options.color || "#007aff");
        els.transitionLayer.appendChild(dot);

        if (dot.animate) {
            dot.animate([
                {
                    opacity: 0.96,
                    transform: "translate(-50%, -50%) translate3d(0, 0, 0) scale(" + options.startScale + ")"
                },
                {
                    opacity: options.endOpacity,
                    transform: "translate(-50%, -50%) translate3d(" + dx + "px, " + dy + "px, 0) scale(" + options.endScale + ")"
                }
            ], {
                duration: options.duration,
                delay: options.delay,
                easing: "cubic-bezier(.2, .8, .2, 1)",
                fill: "forwards"
            });
            return;
        }

        dot.style.transition = "transform " + options.duration + "ms cubic-bezier(.2,.8,.2,1) " + options.delay + "ms, opacity " + options.duration + "ms ease " + options.delay + "ms";
        window.requestAnimationFrame(function () {
            dot.style.opacity = options.endOpacity;
            dot.style.transform = "translate(-50%, -50%) translate3d(" + dx + "px, " + dy + "px, 0) scale(" + options.endScale + ")";
        });
    }

    function setTransitionVisual(active) {
        root.classList.toggle("is-travel-transitioning", active);
        if (!active) {
            clearTransitionLayer();
        }
    }

    function clearTransitionLayer() {
        if (els.transitionLayer) {
            els.transitionLayer.innerHTML = "";
        }
    }

    function initAmbientBackground() {
        document.body.classList.add("travel-ambient-page");
        els.ambient = document.createElement("div");
        els.ambient.className = "travel-ambient";
        els.ambient.setAttribute("aria-hidden", "true");

        for (var index = 0; index < 2; index += 1) {
            var layer = document.createElement("div");
            layer.className = "travel-ambient-layer";
            els.ambient.appendChild(layer);
            els.ambientLayers.push(layer);
        }

        document.body.prepend(els.ambient);
    }

    function setAmbientBackground(place) {
        if (!els.ambientLayers.length || !place) {
            return;
        }

        var nextIndex = els.ambientIndex === 0 ? 1 : 0;
        var nextLayer = els.ambientLayers[nextIndex];
        var currentLayer = els.ambientLayers[els.ambientIndex];

        nextLayer.style.backgroundImage = getAmbientImage(place);
        nextLayer.classList.toggle("has-photo", Boolean(getTravelPhotoUrl(place.photo)));
        nextLayer.classList.add("is-active");
        currentLayer.classList.remove("is-active");
        els.ambientIndex = nextIndex;
    }

    function getAmbientImage(place) {
        var accent = /^#[0-9a-f]{6}$/i.test(place.accent) ? place.accent : "#007aff";

        var photoUrl = getTravelPhotoUrl(place.photo);
        if (photoUrl) {
            return [
                "linear-gradient(135deg, rgba(246, 248, 252, 0.48), rgba(246, 248, 252, 0.72))",
                'url("' + escapeCssUrl(photoUrl) + '")'
            ].join(", ");
        }

        return [
            "radial-gradient(circle at 18% 18%, " + hexToRgba(accent, 0.36) + " 0, transparent 34%)",
            "radial-gradient(circle at 82% 22%, " + hexToRgba(accent, 0.22) + " 0, transparent 32%)",
            "linear-gradient(135deg, " + hexToRgba(accent, 0.16) + ", rgba(248, 251, 255, 0.84) 48%, " + hexToRgba(accent, 0.2) + ")"
        ].join(", ");
    }

    function getLatestPlace(places) {
        return places.slice().sort(function (a, b) {
            return String(b.date).localeCompare(String(a.date));
        })[0] || {};
    }

    function normalizeTravelPhoto(value) {
        var photo = String(value || "").trim();
        if (!photo) {
            return "";
        }
        if (photo.indexOf(travelPhotoBasePath) === 0) {
            return photo.slice(travelPhotoBasePath.length);
        }
        if (photo.indexOf("images/travel/") === 0) {
            return photo.slice("images/travel/".length);
        }
        if (photo.indexOf("static/images/travel/") === 0) {
            return photo.slice("static/images/travel/".length);
        }
        if (photo.indexOf("travel/") === 0) {
            return photo.slice("travel/".length);
        }
        return photo;
    }

    function getTravelPhotoUrl(value) {
        var photo = normalizeTravelPhoto(value);
        if (!photo) {
            return "";
        }
        if (/^(https?:)?\/\//i.test(photo) || photo.charAt(0) === "/" || photo.indexOf("data:") === 0) {
            return photo;
        }
        return travelPhotoBasePath + photo.replace(/^\.?\/*/, "");
    }

    function formatDate(value) {
        if (!value) {
            return "";
        }
        var date = new Date(value + "T00:00:00");
        if (isNaN(date.getTime())) {
            return String(value);
        }
        return date.toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    function prefersReducedMotion() {
        return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function parseJSON(value) {
        if (!value) {
            return null;
        }
        try {
            return JSON.parse(value);
        } catch (error) {
            return null;
        }
    }

    function parseSeed(value) {
        var parsed = parseJSON(value);
        if (typeof parsed === "string") {
            parsed = parseJSON(parsed);
        }
        return parsed && typeof parsed === "object" ? parsed : {};
    }

    function slugify(value) {
        return String(value).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, function (character) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[character];
        });
    }

    function escapeAttribute(value) {
        return escapeHTML(value).replace(/`/g, "&#96;");
    }

    function escapeCssUrl(value) {
        return String(value).replace(/["\\\n\r]/g, "");
    }

    function hexToRgba(hex, alpha) {
        var normalized = String(hex || "#007aff").replace("#", "");
        if (normalized.length !== 6) {
            normalized = "007aff";
        }
        var red = parseInt(normalized.slice(0, 2), 16);
        var green = parseInt(normalized.slice(2, 4), 16);
        var blue = parseInt(normalized.slice(4, 6), 16);
        return "rgba(" + red + ", " + green + ", " + blue + ", " + alpha + ")";
    }
}());
