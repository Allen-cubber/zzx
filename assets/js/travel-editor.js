(function () {
    "use strict";

    var root = document.querySelector("[data-travel-editor]");
    if (!root) {
        return;
    }

    var uidSeed = 0;
    var travelPhotoBasePath = "/images/travel/";
    var accentPalette = ["#007aff", "#34c759", "#ff9f0a", "#ff453a", "#5856d6", "#bf5af2", "#00c7be", "#ffd60a", "#64d2ff", "#ff2d55"];
    var seedNode = document.getElementById("travel-editor-seed");
    var state = {
        data: normalizeData(parseSeed(seedNode ? seedNode.textContent : "{}")),
        selectedUid: "",
        fileHandle: null,
        map: null,
        markerLayer: null,
        activeLayer: "standard",
        baseLayers: {},
        searchCache: {},
        searchLastAt: 0,
        searchController: null
    };

    var els = {
        status: root.querySelector("[data-editor-status]"),
        bind: root.querySelector("[data-editor-bind]"),
        save: root.querySelector("[data-editor-save]"),
        copy: root.querySelector("[data-editor-copy]"),
        download: root.querySelector("[data-editor-download]"),
        addPlace: root.querySelector("[data-editor-add-place]"),
        addSpot: root.querySelector("[data-editor-add-spot]"),
        places: root.querySelector("[data-editor-places]"),
        placeCount: root.querySelector("[data-editor-place-count]"),
        form: root.querySelector("[data-editor-form]"),
        fields: root.querySelector("[data-editor-fields]"),
        empty: root.querySelector("[data-editor-empty]"),
        selectedType: root.querySelector("[data-editor-selected-type]"),
        selectedName: root.querySelector("[data-editor-selected-name]"),
        coordinateLabel: root.querySelector("[data-editor-coordinate-label]"),
        map: root.querySelector("[data-editor-map]"),
        searchForm: root.querySelector("[data-editor-search-form]"),
        searchInput: root.querySelector("[data-editor-search-input]"),
        searchResults: root.querySelector("[data-editor-search-results]"),
        preview: root.querySelector("[data-editor-photo-preview]"),
        yaml: root.querySelector("[data-editor-yaml]"),
        rootFields: root.querySelectorAll("[data-root-field]"),
        layerButtons: root.querySelectorAll("[data-editor-layer]")
    };

    init();

    function init() {
        if (state.data.places.length) {
            state.selectedUid = state.data.places[0]._uid;
        }

        bindEvents();
        renderRootFields();
        renderList();
        renderForm();
        initMap();
        renderMapMarkers();
        renderPhotoPreview();
        updateYamlPreview();
        updateDirectSaveAvailability();
    }

    function bindEvents() {
        els.bind.addEventListener("click", function () {
            bindTravelFile();
        });

        els.save.addEventListener("click", function () {
            saveTravelFile();
        });

        els.copy.addEventListener("click", function () {
            copyYaml();
        });

        els.download.addEventListener("click", function () {
            downloadYaml();
        });

        els.addPlace.addEventListener("click", function () {
            addPlace();
        });

        els.addSpot.addEventListener("click", function () {
            addSpot();
        });

        els.searchForm.addEventListener("submit", function (event) {
            event.preventDefault();
            searchCoordinates();
        });

        els.searchResults.addEventListener("click", function (event) {
            var result = event.target.closest("[data-search-index]");
            if (!result) {
                return;
            }

            applySearchResult(Number(result.dataset.searchIndex));
        });

        els.places.addEventListener("click", function (event) {
            var action = event.target.closest("[data-action]");
            if (!action) {
                return;
            }

            var uid = action.getAttribute("data-uid");
            var placeUid = action.getAttribute("data-place-uid");
            var name = action.getAttribute("data-name") || "这个目的地";

            if (action.dataset.action === "select") {
                selectUid(uid, true);
                return;
            }

            if (action.dataset.action === "add-spot") {
                selectUid(placeUid, false);
                addSpot();
                return;
            }

            if (action.dataset.action === "delete-place") {
                if (window.confirm("删除 " + name + " 以及它的所有二级目的地？")) {
                    deletePlace(uid);
                }
                return;
            }

            if (action.dataset.action === "delete-spot") {
                if (window.confirm("删除 " + name + "？")) {
                    deleteSpot(uid);
                }
            }
        });

        els.form.addEventListener("input", function (event) {
            var field = event.target.closest("[data-field]");
            if (!field) {
                return;
            }

            updateSelectedField(field.dataset.field, field.value);
        });

        els.rootFields.forEach(function (field) {
            field.addEventListener("input", function () {
                state.data[field.dataset.rootField] = field.value;
                updateYamlPreview();
            });
        });

        els.layerButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                setMapLayer(button.dataset.editorLayer);
            });
        });
    }

    function initMap() {
        if (!els.map || typeof L === "undefined") {
            setStatus("地图模块未加载，表单仍可编辑", "warn");
            return;
        }

        state.map = L.map(els.map, {
            zoomControl: false,
            attributionControl: false,
            preferCanvas: true
        }).setView([35.8617, 104.1954], 4);

        state.baseLayers.standard = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 18,
            attribution: "OpenStreetMap"
        });
        state.baseLayers.satellite = L.layerGroup([
            L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
                maxZoom: 18,
                attribution: "Esri"
            }),
            L.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
                maxZoom: 18,
                opacity: 0.72
            })
        ]);

        state.baseLayers.standard.addTo(state.map);
        state.markerLayer = L.layerGroup().addTo(state.map);
        L.control.attribution({ prefix: false }).addTo(state.map);

        state.map.on("click", function (event) {
            setSelectedCoordinates(event.latlng);
        });

        window.setTimeout(function () {
            state.map.invalidateSize();
            fitMapToData();
        }, 120);
    }

    function renderRootFields() {
        els.rootFields.forEach(function (field) {
            field.value = state.data[field.dataset.rootField] || "";
        });
    }

    function renderList() {
        els.placeCount.textContent = String(state.data.places.length);

        if (!state.data.places.length) {
            els.places.innerHTML = "<div class=\"travel-editor-empty-list\">还没有目的地</div>";
            return;
        }

        els.places.innerHTML = state.data.places.map(function (place) {
            var isSelected = state.selectedUid === place._uid;
            var spots = Array.isArray(place.spots) ? place.spots : [];
            var spotHtml = spots.map(function (spot) {
                var selectedSpot = state.selectedUid === spot._uid;
                return [
                    "<div class=\"travel-editor-spot-row" + (selectedSpot ? " is-active" : "") + "\">",
                    "<button type=\"button\" data-action=\"select\" data-uid=\"" + spot._uid + "\">",
                    "<span style=\"--accent:" + safeColor(spot.accent) + "\"></span>",
                    "<strong>" + escapeHtml(spot.city || "未命名景点") + "</strong>",
                    "</button>",
                    "<button type=\"button\" class=\"travel-editor-row-delete\" title=\"删除景点\" aria-label=\"删除景点\" data-action=\"delete-spot\" data-uid=\"" + spot._uid + "\" data-name=\"" + escapeAttr(spot.city || "未命名景点") + "\">",
                    deleteIcon(),
                    "</button>",
                    "</div>"
                ].join("");
            }).join("");

            return [
                "<article class=\"travel-editor-place-card" + (isSelected ? " is-active" : "") + "\">",
                "<div class=\"travel-editor-place-main\">",
                "<button type=\"button\" class=\"travel-editor-place-select\" data-action=\"select\" data-uid=\"" + place._uid + "\">",
                "<span class=\"travel-editor-place-dot\" style=\"--accent:" + safeColor(place.accent) + "\"></span>",
                "<span>",
                "<strong>" + escapeHtml(place.city || "未命名城市") + "</strong>",
                "<em>" + escapeHtml(place.date || "未设置日期") + "</em>",
                "</span>",
                "</button>",
                "<button type=\"button\" class=\"travel-editor-row-delete\" title=\"删除城市\" aria-label=\"删除城市\" data-action=\"delete-place\" data-uid=\"" + place._uid + "\" data-name=\"" + escapeAttr(place.city || "未命名城市") + "\">",
                deleteIcon(),
                "</button>",
                "</div>",
                "<div class=\"travel-editor-spot-list\">",
                spotHtml,
                "<button type=\"button\" class=\"travel-editor-add-spot-row\" data-action=\"add-spot\" data-place-uid=\"" + place._uid + "\">+ 景点</button>",
                "</div>",
                "</article>"
            ].join("");
        }).join("");
    }

    function renderForm() {
        var context = getSelectedContext();
        if (!context.item) {
            els.empty.hidden = false;
            els.fields.hidden = true;
            updateCoordinateLabel();
            return;
        }

        els.empty.hidden = true;
        els.fields.hidden = false;
        els.addSpot.hidden = context.type !== "place";
        renderSelectedHeading();
        if (!els.searchInput.value.trim()) {
            els.searchInput.value = context.item.city || "";
        }

        setFieldValue("id", context.item.id);
        setFieldValue("city", context.item.city);
        setFieldValue("country", context.item.country);
        setFieldValue("date", context.item.date);
        setFieldValue("lat", context.item.lat);
        setFieldValue("lng", context.item.lng);
        setFieldValue("accent", safeColor(context.item.accent));
        setFieldValue("photo", normalizeTravelPhoto(context.item.photo));
        setFieldValue("tags", (context.item.tags || []).join("\n"));
        setFieldValue("note", context.item.note);
        setFieldValue("photos", formatPhotosField(context.item.photos || []));
        setFieldValue("story", context.item.story);
        updateCoordinateLabel();
    }

    function renderSelectedHeading() {
        var context = getSelectedContext();
        if (!context.item) {
            return;
        }

        els.selectedType.textContent = context.type === "spot" ? "二级目的地" : "城市";
        els.selectedName.textContent = context.item.city || "未命名";
    }

    function renderMapMarkers() {
        if (!state.map || !state.markerLayer) {
            return;
        }

        state.markerLayer.clearLayers();
        collectMapItems().forEach(function (entry) {
            if (!hasCoordinates(entry.item)) {
                return;
            }

            var selected = entry.item._uid === state.selectedUid;
            var marker = L.marker([Number(entry.item.lat), Number(entry.item.lng)], {
                draggable: selected,
                riseOnHover: true,
                icon: L.divIcon({
                    className: "travel-editor-marker " + (entry.type === "spot" ? "is-spot" : "is-place") + (selected ? " is-selected" : ""),
                    html: "<span style=\"--accent:" + safeColor(entry.item.accent) + "\"></span>",
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                })
            }).addTo(state.markerLayer);

            marker.bindTooltip(entry.item.city || "未命名", {
                direction: "top",
                offset: [0, -12],
                opacity: 0.92
            });

            marker.on("click", function () {
                selectUid(entry.item._uid, false);
            });

            marker.on("dragend", function () {
                setSelectedCoordinates(marker.getLatLng());
            });
        });
    }

    function renderPhotoPreview() {
        var context = getSelectedContext();
        var item = context.item;
        els.preview.classList.remove("has-photo");
        els.preview.style.backgroundImage = "";

        if (!item) {
            els.preview.innerHTML = "<span>照片预览</span>";
            return;
        }

        if (item.photo) {
            var photoUrl = getTravelPhotoUrl(item.photo);
            els.preview.classList.add("has-photo");
            els.preview.style.backgroundImage = "url(\"" + photoUrl.replace(/"/g, "%22") + "\")";
            els.preview.innerHTML = "<span>" + escapeHtml(normalizeTravelPhoto(item.photo)) + "</span>";
            return;
        }

        els.preview.style.setProperty("--accent", safeColor(item.accent));
        els.preview.innerHTML = "<span>没有照片时使用色标背景</span>";
    }

    function updateYamlPreview() {
        els.yaml.value = generateYaml();
    }

    function addPlace() {
        var place = normalizePlace({
            id: uniqueId("city"),
            city: "新城市",
            country: "中国",
            date: today(),
            lat: 39.9042,
            lng: 116.4074,
            accent: randomAccent(),
            note: "",
            tags: [],
            photo: "",
            photos: [],
            story: "",
            spots: []
        });

        state.data.places.unshift(place);
        selectUid(place._uid, true);
        setStatus("已新增城市", "ok");
    }

    function addSpot() {
        var context = getSelectedContext();
        var place = context.type === "spot" ? context.parent : context.item;
        if (!place) {
            setStatus("先选择一个城市", "warn");
            return;
        }

        place.spots = Array.isArray(place.spots) ? place.spots : [];
        var spot = normalizePlace({
            id: uniqueId(place.id || "spot"),
            city: "新景点",
            country: place.city || place.country || "中国",
            date: place.date || today(),
            lat: Number(place.lat) + 0.018,
            lng: Number(place.lng) + 0.018,
            accent: randomAccent(place.accent),
            note: "",
            tags: [],
            photo: "",
            photos: [],
            story: ""
        });

        place.spots.push(spot);
        selectUid(spot._uid, true);
        setStatus("已新增二级目的地", "ok");
    }

    function deletePlace(uid) {
        state.data.places = state.data.places.filter(function (place) {
            return place._uid !== uid;
        });
        state.selectedUid = state.data.places.length ? state.data.places[0]._uid : "";
        renderAll();
        fitMapToData();
        setStatus("已删除城市", "ok");
    }

    function deleteSpot(uid) {
        state.data.places.forEach(function (place) {
            place.spots = (place.spots || []).filter(function (spot) {
                return spot._uid !== uid;
            });
        });
        var first = state.data.places[0];
        state.selectedUid = first ? first._uid : "";
        renderAll();
        setStatus("已删除景点", "ok");
    }

    function selectUid(uid, focusMap) {
        state.selectedUid = uid;
        renderList();
        renderForm();
        renderMapMarkers();
        renderPhotoPreview();
        updateYamlPreview();

        if (focusMap) {
            focusSelectedOnMap();
        }
    }

    function updateSelectedField(field, value) {
        var context = getSelectedContext();
        var item = context.item;
        if (!item) {
            return;
        }

        if (field === "lat" || field === "lng") {
            item[field] = cleanNumber(value);
        } else if (field === "tags") {
            item.tags = parseTags(value);
        } else if (field === "accent") {
            item.accent = safeColor(value);
        } else if (field === "photo") {
            item.photo = normalizeTravelPhoto(value);
        } else if (field === "photos") {
            item.photos = parsePhotos(value);
        } else {
            item[field] = value;
        }

        renderList();
        renderSelectedHeading();
        updateCoordinateLabel();
        renderPhotoPreview();
        updateYamlPreview();

        if (["lat", "lng", "city", "country", "accent"].indexOf(field) !== -1) {
            renderMapMarkers();
        }
    }

    function setSelectedCoordinates(latlng) {
        var context = getSelectedContext();
        if (!context.item) {
            setStatus("先选择一个目的地", "warn");
            return;
        }

        context.item.lat = roundCoordinate(latlng.lat);
        context.item.lng = roundCoordinate(latlng.lng);
        renderForm();
        renderMapMarkers();
        renderList();
        updateYamlPreview();
        setStatus("坐标已更新", "ok");
    }

    function setFieldValue(field, value) {
        var node = els.form.querySelector("[data-field=\"" + field + "\"]");
        if (!node) {
            return;
        }
        node.value = value == null ? "" : String(value);
    }

    function updateCoordinateLabel() {
        var context = getSelectedContext();
        if (!context.item || !hasCoordinates(context.item)) {
            els.coordinateLabel.textContent = "点击地图设置坐标";
            return;
        }
        els.coordinateLabel.textContent = roundCoordinate(context.item.lat) + ", " + roundCoordinate(context.item.lng);
    }

    function collectMapItems() {
        var selectedContext = getSelectedContext();
        var selectedParent = selectedContext.type === "spot" ? selectedContext.parent : selectedContext.item;
        var items = [];

        state.data.places.forEach(function (place) {
            items.push({ type: "place", item: place });
        });

        if (selectedParent && Array.isArray(selectedParent.spots)) {
            selectedParent.spots.forEach(function (spot) {
                items.push({ type: "spot", item: spot });
            });
        }

        return items;
    }

    function fitMapToData() {
        if (!state.map) {
            return;
        }

        var latLngs = collectMapItems().filter(function (entry) {
            return hasCoordinates(entry.item);
        }).map(function (entry) {
            return [Number(entry.item.lat), Number(entry.item.lng)];
        });

        if (!latLngs.length) {
            state.map.setView([35.8617, 104.1954], 4);
            return;
        }

        state.map.fitBounds(latLngs, {
            padding: [34, 34],
            maxZoom: 7
        });
    }

    function focusSelectedOnMap() {
        var context = getSelectedContext();
        if (!state.map || !context.item || !hasCoordinates(context.item)) {
            return;
        }

        state.map.flyTo([Number(context.item.lat), Number(context.item.lng)], context.type === "spot" ? 12 : Math.max(state.map.getZoom(), 6), {
            duration: 0.45
        });
    }

    function setMapLayer(layerName) {
        if (!state.map || !state.baseLayers[layerName] || state.activeLayer === layerName) {
            return;
        }

        state.map.removeLayer(state.baseLayers[state.activeLayer]);
        state.baseLayers[layerName].addTo(state.map);
        state.activeLayer = layerName;
        els.layerButtons.forEach(function (button) {
            button.classList.toggle("is-active", button.dataset.editorLayer === layerName);
        });
    }

    async function searchCoordinates() {
        var query = (els.searchInput.value || "").trim();
        if (!query) {
            setSearchResults([], "输入地点名称后再搜索");
            return;
        }

        if (!getSelectedContext().item) {
            setStatus("先选择一个要写入坐标的目的地", "warn");
            return;
        }

        var cacheKey = query.toLowerCase();
        if (state.searchCache[cacheKey]) {
            setSearchResults(state.searchCache[cacheKey], "");
            setStatus("已显示缓存结果", "ok");
            return;
        }

        var waitTime = Math.max(0, 1000 - (Date.now() - state.searchLastAt));
        if (waitTime) {
            await delay(waitTime);
        }

        if (state.searchController) {
            state.searchController.abort();
        }

        state.searchController = new AbortController();
        state.searchLastAt = Date.now();
        setSearchLoading();

        try {
            var url = new URL("https://nominatim.openstreetmap.org/search");
            url.searchParams.set("q", query);
            url.searchParams.set("format", "jsonv2");
            url.searchParams.set("limit", "6");
            url.searchParams.set("countrycodes", "cn");
            url.searchParams.set("addressdetails", "1");
            url.searchParams.set("namedetails", "1");
            url.searchParams.set("accept-language", "zh-CN,zh,en");

            var response = await fetch(url.toString(), {
                signal: state.searchController.signal,
                headers: {
                    "Accept": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }

            var results = await response.json();
            results = Array.isArray(results) ? results.map(normalizeSearchResult).filter(Boolean) : [];
            state.searchCache[cacheKey] = results;
            setSearchResults(results, results.length ? "" : "没有找到结果，可以试试加城市名");
            setStatus(results.length ? "找到 " + results.length + " 个地点" : "没有找到地点", results.length ? "ok" : "warn");
        } catch (error) {
            if (error.name !== "AbortError") {
                setSearchResults([], "搜索失败，稍后再试");
                setStatus("搜索失败：" + error.message, "error");
            }
        }
    }

    function setSearchLoading() {
        els.searchResults.hidden = false;
        els.searchResults.innerHTML = "<div class=\"travel-editor-search-empty\">正在搜索...</div>";
    }

    function setSearchResults(results, emptyText) {
        els.searchResults.hidden = false;
        els.searchResults.dataset.results = JSON.stringify(results || []);

        if (!results || !results.length) {
            els.searchResults.innerHTML = "<div class=\"travel-editor-search-empty\">" + escapeHtml(emptyText || "没有搜索结果") + "</div>";
            return;
        }

        els.searchResults.innerHTML = results.map(function (result, index) {
            return [
                "<button type=\"button\" data-search-index=\"" + index + "\">",
                "<strong>" + escapeHtml(result.name) + "</strong>",
                "<span>" + escapeHtml(result.detail) + "</span>",
                "<em>" + result.lat + ", " + result.lng + "</em>",
                "</button>"
            ].join("");
        }).join("");
    }

    function applySearchResult(index) {
        var results = [];
        try {
            results = JSON.parse(els.searchResults.dataset.results || "[]");
        } catch (error) {
            results = [];
        }

        var result = results[index];
        var context = getSelectedContext();
        if (!result || !context.item) {
            return;
        }

        context.item.city = result.name;
        context.item.lat = result.lat;
        context.item.lng = result.lng;
        els.searchInput.value = result.name;
        renderForm();
        renderList();
        renderMapMarkers();
        updateYamlPreview();
        updateCoordinateLabel();

        if (state.map) {
            if (result.bounds) {
                state.map.fitBounds(result.bounds, {
                    padding: [40, 40],
                    maxZoom: 15
                });
            } else {
                state.map.flyTo([result.lat, result.lng], 13, { duration: 0.45 });
            }
        }

        setStatus("已写入坐标：" + result.name, "ok");
    }

    function normalizeSearchResult(result) {
        var lat = Number(result.lat);
        var lng = Number(result.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            return null;
        }

        var address = result.address || {};
        var detailParts = [
            address.city || address.town || address.county || address.state || "",
            address.road || address.suburb || address.village || "",
            result.type || result.category || ""
        ].filter(Boolean);

        return {
            name: result.name || result.display_name || "未命名地点",
            detail: detailParts.length ? detailParts.join(" · ") : result.display_name || "",
            lat: roundCoordinate(lat),
            lng: roundCoordinate(lng),
            bounds: normalizeBounds(result.boundingbox)
        };
    }

    function normalizeBounds(bounds) {
        if (!Array.isArray(bounds) || bounds.length !== 4) {
            return null;
        }

        var south = Number(bounds[0]);
        var north = Number(bounds[1]);
        var west = Number(bounds[2]);
        var east = Number(bounds[3]);
        if (![south, north, west, east].every(Number.isFinite)) {
            return null;
        }

        return [[south, west], [north, east]];
    }

    function renderAll() {
        renderRootFields();
        renderList();
        renderForm();
        renderMapMarkers();
        renderPhotoPreview();
        updateYamlPreview();
    }

    async function bindTravelFile() {
        if (!("showOpenFilePicker" in window)) {
            setStatus("当前浏览器不支持直接保存，建议用 Chrome 或 Edge", "warn");
            return;
        }

        try {
            var handles = await window.showOpenFilePicker({
                multiple: false,
                types: [{
                    description: "YAML",
                    accept: {
                        "text/yaml": [".yaml", ".yml"]
                    }
                }]
            });
            state.fileHandle = handles[0];
            setStatus("已绑定 " + state.fileHandle.name, "ok");
        } catch (error) {
            if (error && error.name !== "AbortError") {
                setStatus("绑定失败：" + error.message, "error");
            }
        }
    }

    async function saveTravelFile() {
        if (!("showOpenFilePicker" in window)) {
            setStatus("当前浏览器不支持直接保存", "warn");
            return;
        }

        if (!state.fileHandle) {
            await bindTravelFile();
            if (!state.fileHandle) {
                return;
            }
        }

        try {
            var permission = await state.fileHandle.queryPermission({ mode: "readwrite" });
            if (permission !== "granted") {
                permission = await state.fileHandle.requestPermission({ mode: "readwrite" });
            }
            if (permission !== "granted") {
                setStatus("没有写入权限", "warn");
                return;
            }

            var writable = await state.fileHandle.createWritable();
            await writable.write(generateYaml());
            await writable.close();
            setStatus("已保存到 " + state.fileHandle.name, "ok");
        } catch (error) {
            setStatus("保存失败：" + error.message, "error");
        }
    }

    async function copyYaml() {
        var yaml = generateYaml();
        try {
            await navigator.clipboard.writeText(yaml);
            setStatus("YAML 已复制", "ok");
        } catch (error) {
            els.yaml.focus();
            els.yaml.select();
            document.execCommand("copy");
            setStatus("YAML 已复制", "ok");
        }
    }

    function downloadYaml() {
        var blob = new Blob([generateYaml()], { type: "text/yaml;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = "travel.yaml";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        setStatus("已下载 travel.yaml", "ok");
    }

    function updateDirectSaveAvailability() {
        if (!("showOpenFilePicker" in window)) {
            els.bind.disabled = true;
            els.save.classList.remove("travel-editor-btn-primary");
            setStatus("当前浏览器不支持直接保存", "warn");
        }
    }

    function setStatus(message, type) {
        els.status.textContent = message;
        els.status.dataset.state = type || "";
    }

    function getSelectedContext() {
        var found = null;
        state.data.places.some(function (place) {
            if (place._uid === state.selectedUid) {
                found = { type: "place", item: place, parent: null };
                return true;
            }

            return (place.spots || []).some(function (spot) {
                if (spot._uid === state.selectedUid) {
                    found = { type: "spot", item: spot, parent: place };
                    return true;
                }
                return false;
            });
        });

        return found || { type: "", item: null, parent: null };
    }

    function normalizeData(input) {
        return {
            title: asString(input.title),
            subtitle: asString(input.subtitle),
            places: Array.isArray(input.places) ? input.places.map(normalizePlace).filter(Boolean) : []
        };
    }

    function normalizePlace(input) {
        if (!input || typeof input !== "object") {
            return null;
        }

        return {
            _uid: nextUid(),
            id: asString(input.id),
            city: asString(input.city),
            country: asString(input.country || "中国"),
            date: asString(input.date),
            lat: cleanNumber(input.lat),
            lng: cleanNumber(input.lng),
            accent: safeColor(input.accent),
            note: asString(input.note),
            tags: Array.isArray(input.tags) ? input.tags.map(asString).filter(Boolean) : [],
            photo: normalizeTravelPhoto(input.photo),
            photos: normalizeTravelPhotos(input.photos),
            story: asString(input.story),
            spots: Array.isArray(input.spots) ? input.spots.map(normalizePlace).filter(Boolean) : []
        };
    }

    function generateYaml() {
        var lines = [];
        lines.push("title: " + yamlString(state.data.title));
        lines.push("subtitle: " + yamlString(state.data.subtitle));

        if (!state.data.places.length) {
            lines.push("places: []");
            return lines.join("\n") + "\n";
        }

        lines.push("places:");
        state.data.places.forEach(function (place) {
            writePlace(lines, place, 2);
        });
        return lines.join("\n") + "\n";
    }

    function writePlace(lines, place, indent) {
        var base = spaces(indent);
        var child = spaces(indent + 2);

        lines.push(base + "- id: " + yamlString(place.id));
        lines.push(child + "city: " + yamlString(place.city));
        lines.push(child + "country: " + yamlString(place.country));
        lines.push(child + "date: " + yamlString(place.date));
        lines.push(child + "lat: " + yamlNumber(place.lat));
        lines.push(child + "lng: " + yamlNumber(place.lng));
        lines.push(child + "accent: " + yamlString(safeColor(place.accent)));
        lines.push(child + "note: " + yamlString(place.note));
        writeTags(lines, place.tags || [], indent + 2);
        lines.push(child + "photo: " + yamlString(place.photo));
        writePhotos(lines, place.photos || [], indent + 2);
        writeBlockString(lines, "story", place.story || "", indent + 2);

        if (Array.isArray(place.spots) && place.spots.length) {
            lines.push(child + "spots:");
            place.spots.forEach(function (spot) {
                writePlace(lines, spot, indent + 4);
            });
        }
    }

    function writeTags(lines, tags, indent) {
        var base = spaces(indent);
        if (!tags.length) {
            lines.push(base + "tags: []");
            return;
        }

        lines.push(base + "tags:");
        tags.forEach(function (tag) {
            lines.push(spaces(indent + 2) + "- " + yamlString(tag));
        });
    }

    function writePhotos(lines, photos, indent) {
        var base = spaces(indent);
        if (!photos.length) {
            lines.push(base + "photos: []");
            return;
        }

        lines.push(base + "photos:");
        photos.forEach(function (photo) {
            lines.push(spaces(indent + 2) + "- file: " + yamlString(photo.file));
            lines.push(spaces(indent + 4) + "caption: " + yamlString(photo.caption || ""));
        });
    }

    function writeBlockString(lines, key, value, indent) {
        var base = spaces(indent);
        var text = asString(value).replace(/\r\n/g, "\n").trim();
        if (!text) {
            lines.push(base + key + ": \"\"");
            return;
        }

        lines.push(base + key + ": |");
        text.split("\n").forEach(function (line) {
            lines.push(spaces(indent + 2) + line);
        });
    }

    function parseSeed(value) {
        var parsed = null;
        try {
            parsed = JSON.parse(value) || {};
        } catch (error) {
            return {};
        }

        if (typeof parsed === "string") {
            try {
                parsed = JSON.parse(parsed) || {};
            } catch (error) {
                return {};
            }
        }

        return parsed && typeof parsed === "object" ? parsed : {};
    }

    function parseTags(value) {
        return String(value || "").split(/[\n,，]/).map(function (tag) {
            return tag.trim();
        }).filter(Boolean);
    }

    function parsePhotos(value) {
        return String(value || "").split(/\n/).map(function (line) {
            var trimmed = line.trim();
            if (!trimmed) {
                return null;
            }
            var parts = trimmed.split("|");
            return {
                file: normalizeTravelPhoto(parts.shift() || ""),
                caption: parts.join("|").trim()
            };
        }).filter(function (photo) {
            return photo && photo.file;
        });
    }

    function formatPhotosField(photos) {
        return normalizeTravelPhotos(photos).map(function (photo) {
            return photo.file + (photo.caption ? " | " + photo.caption : "");
        }).join("\n");
    }

    function asString(value) {
        return value == null ? "" : String(value);
    }

    function cleanNumber(value) {
        var number = Number(value);
        return Number.isFinite(number) ? number : 0;
    }

    function roundCoordinate(value) {
        return Math.round(Number(value) * 1000000) / 1000000;
    }

    function hasCoordinates(item) {
        return item && Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lng));
    }

    function safeColor(value) {
        var color = String(value || "").trim();
        return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#007aff";
    }

    function randomAccent(excludedColor) {
        var excluded = safeColor(excludedColor || "").toLowerCase();
        var candidates = accentPalette.filter(function (color) {
            return color.toLowerCase() !== excluded;
        });
        return candidates[Math.floor(Math.random() * candidates.length)] || "#007aff";
    }

    function uniqueId(prefix) {
        return String(prefix || "place").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
    }

    function nextUid() {
        uidSeed += 1;
        return "travel-editor-" + uidSeed;
    }

    function today() {
        return new Date().toISOString().slice(0, 10);
    }

    function normalizeTravelPhoto(value) {
        var photo = asString(value).trim();
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

    function normalizeTravelPhotos(value) {
        if (!Array.isArray(value)) {
            return [];
        }

        return value.map(function (item) {
            if (typeof item === "string") {
                return {
                    file: normalizeTravelPhoto(item),
                    caption: ""
                };
            }
            if (!item || typeof item !== "object") {
                return null;
            }
            return {
                file: normalizeTravelPhoto(item.file || item.photo || item.src || ""),
                caption: asString(item.caption)
            };
        }).filter(function (item) {
            return item && item.file;
        });
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

    function delay(milliseconds) {
        return new Promise(function (resolve) {
            window.setTimeout(resolve, milliseconds);
        });
    }

    function yamlString(value) {
        return "\"" + asString(value)
            .replace(/\\/g, "\\\\")
            .replace(/"/g, "\\\"")
            .replace(/\r?\n/g, "\\n") + "\"";
    }

    function yamlNumber(value) {
        var number = Number(value);
        if (!Number.isFinite(number)) {
            return "0";
        }
        return String(roundCoordinate(number));
    }

    function spaces(count) {
        return new Array(count + 1).join(" ");
    }

    function escapeHtml(value) {
        return asString(value).replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "\"": "&quot;",
                "'": "&#39;"
            }[char];
        });
    }

    function escapeAttr(value) {
        return escapeHtml(value).replace(/`/g, "&#96;");
    }

    function deleteIcon() {
        return "<svg aria-hidden=\"true\" viewBox=\"0 0 24 24\"><path d=\"M18 6 6 18\"></path><path d=\"m6 6 12 12\"></path></svg>";
    }
})();
